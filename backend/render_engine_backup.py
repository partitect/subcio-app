from pathlib import Path
from typing import Any, Dict, List

from styles import StyleRegistry, StyleRenderer
from styles.utils import (
    get_text_width,
    group_words_smart,
    hex_to_ass,
    ms_to_ass,
)
import re

# Ensure all styles are registered
import styles


def _normalize_segments(words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalizes incoming words/segments into a unified grouped structure:
    - If entries already contain a `words` array -> treat as grouped segments.
    - Otherwise, convert each word into a single-word segment.
    """
    if not words:
        return []

    if isinstance(words[0], dict) and "words" in words[0]:
        normalized = []
        for seg in words:
            seg_words = seg.get("words", [])
            if not seg_words:
                continue
            start = seg.get("start", seg_words[0].get("start", 0))
            end = seg.get("end", seg_words[-1].get("end", start))
            normalized.append(
                {
                    "start": start,
                    "end": end,
                    "words": seg_words,
                    "active_word_index": seg.get("active_word_index"),
                }
            )
        return normalized

    # Single word list -> wrap into segments
    return [
        {
            "start": w.get("start", 0),
            "end": w.get("end", w.get("start", 0)),
            "words": [w],
            "active_word_index": 0,
        }
        for w in words
        if isinstance(w, dict)
    ]


class GroupedASSRenderer(StyleRenderer):
    """
    Generic grouped renderer that keeps group position static while animating only
    the active word. It supports both explicit active_word_index (for previews)
    and per-word timing driven highlights (for real playback).
    """

    def __init__(self, segments: List[Dict[str, Any]], style: Dict[str, Any]):
        self.segments = _normalize_segments(segments)
        super().__init__([w for seg in self.segments for w in seg.get("words", [])], style)

        self.active_color = hex_to_ass(style.get("secondary_color", style.get("primary_color", "&H00FFFFFF")))
        self.passive_color = hex_to_ass(style.get("primary_color", "&H00FFFFFF"))
        self.active_scale = int(style.get("active_scale", 115))
        self.passive_scale = int(style.get("passive_scale", 100))
        self.spacing = max(10, int(style.get("letter_spacing", 0)) + 16)

        # Resolve font path for accurate measurement; fall back gracefully.
        fonts_dir = Path(__file__).resolve().parent / "fonts"
        preferred_font = (style.get("font") or "Inter").split(",")[0].strip()
        fallback_fonts = list(fonts_dir.glob("*.ttf")) + list(fonts_dir.glob("*.otf"))
        self.font_path = None
        pref_token = re.sub(r"[\\s_-]+", "", preferred_font).lower()
        for f in fallback_fonts:
            stem_token = re.sub(r"[\\s_-]+", "", f.stem).lower()
            if stem_token == pref_token:
                self.font_path = str(f)
                break
        if not self.font_path and fallback_fonts:
            self.font_path = str(fallback_fonts[0])

    def _measure_word(self, text: str, font_size: int) -> int:
        return get_text_width(text, self.font_path, font_size) if self.font_path else get_text_width(text, "", font_size)

    def render(self) -> str:
        lines: List[str] = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()

        for seg in self.segments:
            seg_start_ms = int(seg["start"] * 1000)
            seg_end_ms = int(seg["end"] * 1000)
            seg_duration = max(1, seg_end_ms - seg_start_ms)
            words = seg.get("words", [])
            if not words:
                continue

            # Pre-calc widths with a safety multiplier so scale-up doesn't shift layout
            word_widths = []
            font_size = int(self.style.get("font_size", 56))
            for w in words:
                base = self._measure_word(w.get("text", ""), font_size)
                word_widths.append(int(base * max(self.active_scale / 100, 1.2)))

            total_width = sum(word_widths) + self.spacing * (len(words) - 1)
            current_x = cx - total_width // 2

            for idx, w in enumerate(words):
                safe_text = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                word_w = word_widths[idx]
                word_x = current_x + word_w // 2
                current_x += word_w + self.spacing

                base_tags = (
                    f"\\an{self.alignment}\\pos({word_x},{cy})"
                    f"\\1c{self.passive_color}\\3c{self.color_outline}"
                    f"\\fscx{self.passive_scale}\\fscy{self.passive_scale}"
                )

                transforms = ""
                active_idx = seg.get("active_word_index")
                if active_idx is not None:
                    # Explicit active index: keep static highlight for this segment window
                    if active_idx == idx:
                        transforms = (
                            f"\\t(0,{seg_duration},\\1c{self.active_color}"
                            f"\\fscx{self.active_scale}\\fscy{self.active_scale})"
                        )
                else:
                    # Drive by word timestamps relative to the segment
                    w_start_rel = max(0, int((w.get("start", seg["start"]) - seg["start"]) * 1000))
                    w_end_rel = min(seg_duration, int((w.get("end", seg["end"]) - seg["start"]) * 1000))
                    if w_end_rel <= w_start_rel:
                        w_end_rel = min(seg_duration, w_start_rel + 80)

                    in_end = min(seg_duration, w_start_rel + 120)
                    out_start = max(0, w_end_rel - 120)
                    transforms = (
                        f"\\t({w_start_rel},{in_end},\\1c{self.active_color}"
                        f"\\fscx{self.active_scale}\\fscy{self.active_scale})"
                        f"\\t({out_start},{w_end_rel},\\1c{self.passive_color}"
                        f"\\fscx{self.passive_scale}\\fscy{self.passive_scale})"
                    )

                line = (
                    f"Dialogue: 1,{ms_to_ass(seg_start_ms)},{ms_to_ass(seg_end_ms)},Default,,0,0,0,,"
                    f"{{{base_tags}{transforms}}}{safe_text}"
                )
                lines.append(line)

        return self.header + "\n".join(lines)


class AdvancedRenderer:
    def __init__(self, words: List[Dict[str, Any]], style: Dict[str, Any]):
        self.words = words or []
        self.style = style or {}

    def _use_grouped_mode(self, style_id: str) -> bool:
        if any(isinstance(w, dict) and "words" in w for w in self.words):
            return True
        tokens = style_id.lower().replace("_", "-")
        return any(key in tokens for key in ["group", "sentence", "box"])

    def render(self) -> str:
        style_id = self.style.get("id", "default").replace("-", "_")

        if self._use_grouped_mode(style_id):
            # Auto-group plain words for grouped styles to avoid jitter.
            segments = _normalize_segments(self.words)
            if segments and all(len(seg.get("words", [])) == 1 for seg in segments):
                grouped = group_words_smart(self.words, max_per_group=3, max_gap=1.5)
                segments = _normalize_segments(
                    [
                        {
                            "start": g["start"],
                            "end": g["end"],
                            "words": g["words"],
                        }
                        for g in grouped
                    ]
                )
            renderer = GroupedASSRenderer(segments, self.style)
            return renderer.render()

        # Default: style-specific renderer
        renderer_cls = StyleRegistry.get_renderer_class(style_id)

        if not renderer_cls:
            print(f"Style '{style_id}' not found, falling back to word_pop")
            renderer_cls = StyleRegistry.get_renderer_class("word_pop")

        if not renderer_cls:
            return ""

        renderer = renderer_cls(self.words, self.style)
        return renderer.render()
