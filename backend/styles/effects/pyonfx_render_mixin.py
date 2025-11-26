from typing import Any, List
from ..utils import hex_to_ass


class PyonFXRenderMixin:
    def _get_center_coordinates(self) -> tuple[int, int]:
        """Dikey konum hesaplama.
        
        margin_v aralığı: -100 (alt) → 0 (orta) → +100 (üst)
        Ekran: 1920x1080, güvenli alan: Y=80 ile Y=1000 arası
        """
        screen_h = 1080
        screen_w = 1920
        cx = screen_w // 2
        
        margin_v = int(self.style.get("margin_v", 0))
        
        # Güvenli Y aralığı (kenarlardan 80px boşluk)
        min_y = 80   # Üst sınır
        max_y = 1000  # Alt sınır
        center_y = screen_h // 2  # 540
        
        # margin_v: -100 → max_y (alt), 0 → center_y (orta), +100 → min_y (üst)
        # Linear interpolation
        if margin_v >= 0:
            # 0 → center_y, +100 → min_y
            cy = center_y - int((margin_v / 100) * (center_y - min_y))
        else:
            # 0 → center_y, -100 → max_y
            cy = center_y + int((abs(margin_v) / 100) * (max_y - center_y))
        
        # Güvenlik sınırları
        cy = max(min_y, min(max_y, cy))
        
        # X pozisyonu (yatay hizalama için)
        alignment = int(self.style.get("alignment", 5))
        margin_l = int(self.style.get("margin_l", 10))
        margin_r = int(self.style.get("margin_r", 10))
        if alignment in [1, 4, 7]:  # Left
            cx = margin_l + 100
        elif alignment in [3, 6, 9]:  # Right
            cx = screen_w - margin_r - 100
        
        return cx, cy

    def render_ass_header(self) -> str:
        """Generate ASS file header"""
        primary = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        secondary = hex_to_ass(self.style.get("secondary_color", "&H00000000"))
        outline = hex_to_ass(self.style.get("outline_color", "&H00000000"))
        back = hex_to_ass(self.style.get("back_color", self.style.get("shadow_color", "&H00000000")))
        border = self.style.get("border", 2)
        shadow = self.style.get("shadow_blur", self.style.get("shadow", 0))
        return """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
Title: PyonFX Effect Subtitle

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,""" + self.style.get("font", "Arial") + f""",{self.style.get("font_size", 64)},{primary},{secondary},{outline},{back},{self.style.get("bold", 1)},{self.style.get("italic", 0)},0,0,100,100,0,0,1,{border},{shadow},{self.style.get("alignment", 2)},{self.style.get("margin_l", 10)},{self.style.get("margin_r", 10)},{self.style.get("margin_v", 10)},0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def _build_effect_tags(self, duration_ms: int) -> str:
        """Build ASS animation tags for the effect"""
        tags = ""

        if self.effect_type == "bulge":
            tags = f"{{\\t(0,{duration_ms},\\fscx110\\fscy110)\\t({duration_ms // 2},{duration_ms},\\fscx100\\fscy100)\\blur0.2}}"
        elif self.effect_type == "shake":
            shake_intensity = self.effect_config.get("intensity", 8.0)
            frequency = self.effect_config.get("frequency", 15.0)
            step = max(10, int(1000 / frequency))
            tags = f"{{\\blur0.3\\t(0,{step},\\blur0.5)\\t({step},{step*2},\\blur0.2)\\t({step*2},{step*3},\\blur0.5)\\t({step*3},{step*4},\\blur0.2)\\t({step*4},{duration_ms},\\blur0.3)}}"
        elif self.effect_type == "wave":
            tags = f"{{\\t(0,{duration_ms},\\fscx105\\fscy95)\\t({duration_ms // 2},{duration_ms},\\fscx100\\fscy100)}}"
        elif self.effect_type == "chromatic":
            tags = f"{{\\blur0.5\\t(0,{duration_ms},\\1c&H0000FF&)\\t({duration_ms // 2},{duration_ms},\\1c&H00FFFF&)}}"
        return tags

    @staticmethod
    def _ms_to_timestamp(ms: int) -> str:
        """Convert milliseconds to ASS timestamp format"""
        hours = ms // 3_600_000
        minutes = (ms % 3_600_000) // 60_000
        seconds = (ms % 60_000) // 1_000
        centiseconds = (ms % 1_000) // 10
        return f"{hours:d}:{minutes:02d}:{seconds:02d}.{centiseconds:02d}"

# Example usage function
