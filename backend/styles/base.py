from typing import List, Dict, Any
from .utils import hex_to_ass

class StyleRenderer:
    def __init__(self, words: List[Dict], style: Dict[str, Any]):
        self.words = words
        self.style = style
        
        # Common style properties
        self.font = (style.get("font") or "Inter").split(",")[0].strip()
        self.color_primary = hex_to_ass(style.get("primary_color", "&H00FFFFFF"))
        self.color_outline = hex_to_ass(style.get("outline_color", "&H00000000"))
        self.color_back = hex_to_ass(style.get("back_color", "&H00000000"))
        
        self.color_future = hex_to_ass(style.get("color_future", self.color_primary))
        self.color_past = hex_to_ass(style.get("color_past", "&H00CCCCCC"))
        self.outline_future = hex_to_ass(style.get("outline_future", self.color_outline))
        self.outline_past = hex_to_ass(style.get("outline_past", self.color_outline))
        
        self.border = style.get("border", 2)
        self.shadow = style.get("shadow_blur") or style.get("shadow", 0)
        self.size = style.get("font_size", 48)
        self.alignment = int(style.get("alignment", 2))
        self.italic = style.get("italic", 0)
        self.bold = style.get("bold", 1)
        self.border_style = style.get("border_style", 1)
        self.margin_v = style.get("margin_v", 40)
        
        self.header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{self.font},{self.size},{self.color_primary},&H000000FF,{self.color_outline},{self.color_back},{self.bold},{self.italic},0,0,100,100,0,0,{self.border_style},{self.border},{self.shadow},{self.alignment},20,20,{self.margin_v},0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def render(self) -> str:
        """
        Main method to render the subtitle.
        Should return the full ASS file content as a string.
        """
        raise NotImplementedError("Subclasses must implement render()")

    def get_center_coordinates(self):
        screen_h = 1080
        cx = 1920 // 2
        
        if self.alignment == 8: cy = 150
        elif self.alignment == 5: cy = screen_h // 2
        else: cy = screen_h - 150
        return cx, cy

    def _base_loop(self, effect_func) -> str:
        """
        Helper for word-by-word effects.
        effect_func(word, start_ms, end_ms, duration, cx, cy) -> List[str]
        """
        lines = []
        cx, cy = self.get_center_coordinates()

        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            duration = end_ms - start_ms
            
            new_lines = effect_func(word, start_ms, end_ms, duration, cx, cy)
            lines.extend(new_lines)
        return self.header + "\n".join(lines)
