from .base import StyleRenderer
from .registry import StyleRegistry
from .utils import ms_to_ass, hex_to_ass, get_text_width
import random
import re
from pathlib import Path
from PIL import ImageFont

_WEIGHT_TOKENS = ["regular", "bold", "extrabold", "black", "heavy", "medium", "semibold", "italic", "oblique", "light", "thin"]


def _norm_font_token(val: str) -> str:
    token = re.sub(r"[^a-z0-9]", "", (val or "").lower())
    for w in _WEIGHT_TOKENS:
        token = token.replace(w, "")
    return token


def resolve_font(fonts_dir: Path, target_name: str):
    target_norm = _norm_font_token(target_name)
    font_files = sorted(list(fonts_dir.glob("*.ttf")) + list(fonts_dir.glob("*.otf")))
    for f in font_files:
        if _norm_font_token(f.stem) == target_norm:
            try:
                display = ImageFont.truetype(str(f), 12).getname()[0]
            except Exception:
                display = target_name
            return str(f), display
    for f in font_files:
        try:
            display = ImageFont.truetype(str(f), 12).getname()[0]
            if _norm_font_token(display) == target_norm:
                return str(f), display
        except Exception:
            continue
    if font_files:
        try:
            display = ImageFont.truetype(str(font_files[0]), 12).getname()[0]
        except Exception:
            display = target_name
        return str(font_files[0]), display
    return None, target_name


@StyleRegistry.register("tiktok_group")
class TikTokGroupRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            text_parts = []
            if i > 0:
                prev_word = self.words[i-1]['text']
                text_parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{prev_word}")
            curr_word = word['text']
            text_parts.append(f"{{\\alpha&H00&\\fscx120\\fscy120\\1c&HFFFF00&\\blur3}}{curr_word}")
            if i < len(self.words) - 1:
                next_word = self.words[i+1]['text']
                text_parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{next_word}")
            full_text = " ".join(text_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}")
        return self.header + "\n".join(lines)


@StyleRegistry.register("karaoke_classic")
class KaraokeClassicRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            text_parts = []
            if i > 0:
                text_parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{self.words[i-1]['text']}")
            text_parts.append(f"{{\\alpha&H00&\\fscx130\\fscy130\\1c&HFFFF00&\\blur4}}{word['text']}")
            if i < len(self.words) - 1:
                text_parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{self.words[i+1]['text']}")
            full_text = " ".join(text_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full_text}")
        return self.header + "\n".join(lines)


@StyleRegistry.register("karaoke_pro")
class KaraokeProRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        window_size = 12
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            start_idx = max(0, i - window_size // 2)
            end_idx = min(len(self.words), start_idx + window_size)
            if end_idx - start_idx < window_size:
                start_idx = max(0, end_idx - window_size)
            line_parts = []
            for w_idx in range(start_idx, end_idx):
                w = self.words[w_idx]
                w_text = w['text']
                if w_idx < i:
                    style = f"{{\\1c{self.color_past}\\3c{self.outline_past}}}"
                elif w_idx == i:
                    p_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
                    o_color = hex_to_ass(self.style.get("outline_color", "&H00000000"))
                    style = f"{{\\1c{p_color}\\3c{o_color}\\t(0,100,\\fscx115\\fscy115)\\t(100,{dur},\\fscx100\\fscy100)}}"
                else:
                    style = f"{{\\1c{self.color_future}\\3c{self.outline_future}}}"
                line_parts.append(f"{style}{w_text}")
            full_text = " ".join(line_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(0,0)}}{full_text}")
        return self.header + "\n".join(lines)


@StyleRegistry.register("dynamic_highlight")
class DynamicHighlightRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        normal_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        highlight_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        min_words = 2
        max_words = 4
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            words_before = min(i, max_words - 1)
            words_after = min(len(self.words) - i - 1, max_words - 1)
            total_words = 1 + words_before + words_after
            if total_words > max_words:
                excess = total_words - max_words
                if words_after > words_before:
                    words_after -= excess
                else:
                    words_before -= excess
            elif total_words < min_words:
                needed = min_words - total_words
                if i > 0 and words_before < max_words - 1:
                    add_before = min(needed, i - words_before)
                    words_before += add_before
                    needed -= add_before
                if needed > 0 and words_after < max_words - 1:
                    add_after = min(needed, len(self.words) - i - 1 - words_after)
                    words_after += add_after
            text_parts = []
            for j in range(i - words_before, i):
                if j >= 0:
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            transition_time = min(dur, 300)
            current_word_tag = f"{{\\1c{normal_color}\\t(0,{transition_time//2},\\1c{highlight_color})\\t({dur-transition_time//2},{dur},\\1c{normal_color})}}{word['text']}"
            text_parts.append(current_word_tag)
            for j in range(i + 1, i + 1 + words_after):
                if j < len(self.words):
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            full_text = " ".join(text_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}")
        return self.header + "\n".join(lines)


@StyleRegistry.register("karaoke_sentence")
class SentenceKaraokeRenderer(StyleRenderer):
    def render(self) -> str:
        from .utils import group_words_smart, get_text_width
        from pathlib import Path
        import os
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        sentences = group_words_smart(self.words, max_per_group=3, max_gap=1.5)
        active_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        passive_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        font_size = int(self.style.get("font_size", 60))
        font_name = self.style.get("font", "Arial")
        fonts_dir = Path(__file__).resolve().parent.parent / "fonts"
        font_path = None
        possible_fonts = list(fonts_dir.glob("*"))
        for f in possible_fonts:
            if f.stem.lower() == font_name.lower():
                font_path = str(f)
                break
        if not font_path:
            for fallback in ["black_default.ttf", "komika.ttf", "Roboto-Bold.ttf"]:
                fallback_path = fonts_dir / fallback
                if fallback_path.exists():
                    font_path = str(fallback_path)
                    break
            if not font_path:
                ttfs = list(fonts_dir.glob("*.ttf"))
                if ttfs:
                    font_path = str(ttfs[0])
        spacing = int(self.style.get("letter_spacing", 0)) + 20 
        for sent in sentences:
            start_ms = int(sent['start'] * 1000)
            end_ms = int(sent['end'] * 1000)
            total_width = 0
            word_widths = []
            for w in sent['words']:
                base_width = get_text_width(w['text'], font_path, font_size)
                w_width = int(base_width * 1.2) 
                word_widths.append(w_width)
                total_width += w_width
            if len(sent['words']) > 1:
                total_width += (len(sent['words']) - 1) * spacing
            current_x = cx - (total_width // 2)
            for i, w in enumerate(sent['words']):
                w_width = word_widths[i]
                word_cx = current_x + (w_width // 2)
                w_start = int(w['start'] * 1000)
                w_end = int(w['end'] * 1000)
                rel_start = max(0, w_start - start_ms)
                rel_end = min(end_ms - start_ms, w_end - start_ms)
                t_in_start = rel_start
                t_in_end = min(rel_start + 80, rel_end)
                t_out_start = max(rel_start, w_end - start_ms - 80)
                t_out_end = w_end - start_ms
                active_tags = f"\\1c{active_color}\\fscx115\\fscy115"
                passive_tags = f"\\1c{passive_color}\\fscx100\\fscy100"
                text = (
                    f"{{\\an5\\pos({word_cx},{cy})\\fad(150,150)"
                    f"\\1c{passive_color}"
                    f"\\t({t_in_start},{t_in_end},{active_tags})"
                    f"\\t({t_out_start},{t_out_end},{passive_tags})"
                    f"}}{w['text']}"
                )
                lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{text}")
                current_x += w_width + spacing
        return self.header + "\n".join(lines)


@StyleRegistry.register("mademyday")
class MadeMyDayRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()

        active_scale = 1.12
        transition = 220
        active_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        passive_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        font_size = int(self.style.get("font_size", 60))
        font_name = self.style.get("font", "Poppins")
        raw_spacing = int(self.style.get("letter_spacing", 0))
        border = int(self.style.get("border", 2) or 0)
        shadow = int(self.style.get("shadow", 0) or 0)

        fonts_dir = Path(__file__).resolve().parent.parent / "fonts"
        font_path, font_display_name = resolve_font(fonts_dir, font_name)
        font_missing = font_path is None
        font_obj = None
        ascent = descent = 0
        if font_path:
            try:
                font_obj = ImageFont.truetype(font_path, font_size)
                ascent, descent = font_obj.getmetrics()
            except Exception:
                font_obj = None
        if not font_obj:
            ascent = int(font_size * 0.72)
            descent = int(font_size * 0.28)

        stroke_pad = border * 6 + shadow * 2
        em_width = get_text_width("MM", font_path, font_size) if font_path else font_size * 1.1
        space_width = get_text_width(" ", font_path, font_size) if font_path else font_size * 0.5
        base_pad = max(font_size * (1.4 if font_missing else 1.25), em_width * 0.4, space_width * 1.2)
        safety_padding = int(base_pad + stroke_pad + space_width)
        scale_reserve = 1.8 if font_missing else 1.65

        spacing = min(5, max(1, raw_spacing))
        max_line_width = 1920 - 160
        line_gap_extra = min(5, max(0, int(font_size * 0.05)))
        line_step = font_size + line_gap_extra
        hyphen = "\u00ad"

        def split_word(word_text: str) -> list[str]:
            if not word_text:
                return [""]
            return list(word_text)

        for g_start in range(0, len(self.words), 3):
            group_words = self.words[g_start:g_start + 3]
            if not group_words:
                continue
            start_ms = int(group_words[0]['start'] * 1000)
            end_ms = int(group_words[-1]['end'] * 1000)

            expanded_words = []
            expanded_widths = []
            for w in group_words:
                base_width = get_text_width(w['text'], font_path, font_size)
                padded = base_width + safety_padding
                width_reserved = int(padded * scale_reserve)
                if width_reserved > max_line_width:
                    chars = split_word(w['text'])
                    for idx, ch in enumerate(chars):
                        ch_text = ch + (hyphen if idx < len(chars) - 1 else "")
                        ch_width = get_text_width(ch_text, font_path, font_size)
                        ch_padded = ch_width + safety_padding
                        ch_reserved = int(ch_padded * scale_reserve)
                        expanded_words.append({**w, "text": ch_text})
                        expanded_widths.append(min(ch_reserved, max_line_width))
                else:
                    expanded_words.append(w)
                    expanded_widths.append(width_reserved)

            group_words = expanded_words
            word_widths = expanded_widths

            def line_width(idx_list):
                if not idx_list:
                    return 0
                total = sum(word_widths[i] for i in idx_list)
                if len(idx_list) > 1:
                    total += (len(idx_list) - 1) * spacing
                return total

            lines_idx = []
            current_line = []
            current_width = 0
            for i, w_width in enumerate(word_widths):
                add_width = w_width if not current_line else spacing + w_width
                if current_line and current_width + add_width > max_line_width:
                    lines_idx.append(current_line)
                    current_line = [i]
                    current_width = w_width
                else:
                    current_line.append(i)
                    current_width += add_width
            if current_line:
                lines_idx.append(current_line)

            total_lines = len(lines_idx)
            start_y = cy - ((total_lines - 1) * line_step) / 2

            for line_number, idx_list in enumerate(lines_idx):
                line_w = line_width(idx_list)
                current_x = cx - (line_w // 2)
                line_y = int(start_y + line_number * line_step)

                for word_idx in idx_list:
                    w = group_words[word_idx]
                    w_width = word_widths[word_idx]
                    word_cx = current_x + (w_width // 2)

                    w_start = int(w['start'] * 1000)
                    w_end = int(w['end'] * 1000)
                    rel_start = max(0, w_start - start_ms)
                    rel_end = max(rel_start + 1, w_end - start_ms)
                    t_in_end = min(rel_start + transition, rel_end)
                    t_out_start = max(rel_start, rel_end - transition)
                    active_tags = f"\\1c{active_color}\\fscx{int(active_scale*100)}\\fscy{int(active_scale*100)}\\blur1"
                    passive_tags = f"\\1c{passive_color}\\fscx100\\fscy100\\blur0"
                    text = (
                        f"{{\\an5\\fn{font_display_name}\\fs{font_size}\\pos({word_cx},{line_y})\\fad(120,120)"
                        f"\\1c{passive_color}"
                        f"\\t({rel_start},{t_in_end},{active_tags})"
                        f"\\t({t_out_start},{rel_end},{passive_tags})"
                        f"}}{w['text']}"
                    )
                    lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{text}")
                    current_x += w_width + spacing

        return self.header + "\n".join(lines)
