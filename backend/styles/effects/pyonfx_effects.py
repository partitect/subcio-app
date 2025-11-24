"""
PyonFX Effects Integration

This module provides an example of how to integrate PyonFX effects
into the PyCaps subtitle generation engine.

PyonFX is a Python library built on top of Aegisub for advanced subtitle animation.
"""

from typing import Dict, List, Any, Tuple
from pathlib import Path
import math
import random
import re
from ..utils import hex_to_ass


class BulgeEffect:
    """
    Bulge/Magnifier Effect from PyonFX
    Creates a bulging distortion on text at the center point
    """
    
    def __init__(self, intensity: float = 1.0):
        """
        Args:
            intensity: How strong the bulge effect is (0.0 - 2.0)
        """
        self.intensity = max(0, min(2.0, intensity))
    
    def magnifier_filter(self, x: float, y: float, center_x: float, center_y: float, radius: float) -> Tuple[float, float]:
        """
        Apply magnifier/bulge distortion to a point
        
        Args:
            x, y: Point coordinates
            center_x, center_y: Center of bulge effect
            radius: Radius of bulge effect
            
        Returns:
            Tuple of (new_x, new_y) with distortion applied
        """
        if radius <= 0:
            return x, y
            
        d = math.sqrt((x - center_x)**2 + (y - center_y)**2)
        
        if d < radius:
            # Apply magnifier distortion
            angle = (math.pi / 2) * math.sin(d / radius)
            pct = radius * math.sin(angle) / d if d > 0 else 1
            new_x = center_x + (x - center_x) * pct
            new_y = center_y + (y - center_y) * pct
            return new_x, new_y
        else:
            return x, y
    
    def apply(self, text: str, font_size: int, time_progress: float) -> Dict[str, Any]:
        """
        Apply bulge effect to text
        
        Args:
            text: Text to apply effect to
            font_size: Font size in points
            time_progress: Animation progress (0.0 to 1.0)
            
        Returns:
            Dictionary with ASS formatting tags
        """
        # Bulge intensity varies with time
        time_factor = 1.0 - abs(time_progress - 0.5) * 2
        factor = self.intensity * font_size * time_factor
        
        return {
            "blur": 0.2,  # Slight blur for effect
            "scale": 100 + (time_factor * 10),  # Subtle scale animation
        }


class ShakeEffect:
    """
    Shake/Vibrate Effect
    Makes text shake/vibrate rapidly
    """
    
    def __init__(self, intensity: float = 5.0, frequency: float = 10.0):
        """
        Args:
            intensity: How far the text shakes (pixels)
            frequency: How fast it shakes (Hz)
        """
        self.intensity = intensity
        self.frequency = frequency
    
    def apply(self, time_ms: float, text: str) -> Dict[str, Any]:
        """
        Apply shake effect
        
        Args:
            time_ms: Time in milliseconds
            text: Text to apply effect to
            
        Returns:
            Dictionary with position offset
        """
        # Calculate shake offset based on time
        angle = (time_ms / 1000.0) * self.frequency * 2 * math.pi
        offset_x = math.sin(angle) * self.intensity
        offset_y = math.cos(angle * 1.3) * (self.intensity * 0.7)
        
        return {
            "offset_x": offset_x,
            "offset_y": offset_y,
            "blur": 0.3,
        }


class WaveEffect:
    """
    Wave/Ripple Effect
    Creates a wave motion across text characters
    """
    
    def __init__(self, amplitude: float = 20.0, wavelength: float = 100.0):
        """
        Args:
            amplitude: Height of wave (pixels)
            wavelength: Distance between wave peaks (pixels)
        """
        self.amplitude = amplitude
        self.wavelength = wavelength
    
    def apply(self, position: int, total_positions: int, time_ms: float, text: str) -> Dict[str, Any]:
        """
        Apply wave effect per character
        
        Args:
            position: Character position in text
            total_positions: Total number of characters
            time_ms: Time in milliseconds
            text: Character text
            
        Returns:
            Dictionary with animation tags
        """
        # Phase based on character position
        phase = (position / total_positions) * 2 * math.pi
        
        # Time-based motion
        time_phase = (time_ms / 1000.0) * 3  # 3 Hz
        
        # Calculate vertical offset
        y_offset = math.sin(phase + time_phase) * self.amplitude
        
        return {
            "offset_y": y_offset,
            "scale": 100,
        }


class ChromaticAberrationEffect:
    """
    Chromatic Aberration Effect
    Splits color channels creating a glitch/distortion effect
    """
    
    def __init__(self, shift_amount: float = 2.0):
        """
        Args:
            shift_amount: How much channels are shifted (pixels)
        """
        self.shift_amount = shift_amount
    
    def apply(self, time_ms: float) -> Dict[str, Any]:
        """
        Apply chromatic aberration
        
        Returns:
            Dictionary with color and position tags
        """
        # Oscillate the shift
        oscillation = math.sin((time_ms / 1000.0) * 4) * self.shift_amount
        
        return {
            "blur": 0.5,
            "color_shift": oscillation,
            "effects": [
                {"primary_shift": oscillation, "type": "red"},
                {"primary_shift": -oscillation * 0.5, "type": "blue"},
            ]
        }


class PyonFXStyleBuilder:
    """
    Helper class to build PyonFX-based subtitle styles
    """
    
    @staticmethod
    def build_bulge_style(base_style: Dict[str, Any]) -> Dict[str, Any]:
        """Build a style using the Bulge effect"""
        style = base_style.copy()
        style["effect_type"] = "bulge"
        style["effect_config"] = {
            "intensity": 1.5,
            "blur": 0.2,
        }
        return style
    
    @staticmethod
    def build_shake_style(base_style: Dict[str, Any]) -> Dict[str, Any]:
        """Build a style using the Shake effect"""
        style = base_style.copy()
        style["effect_type"] = "shake"
        style["effect_config"] = {
            "intensity": 8.0,
            "frequency": 15.0,
        }
        return style
    
    @staticmethod
    def build_wave_style(base_style: Dict[str, Any]) -> Dict[str, Any]:
        """Build a style using the Wave effect"""
        style = base_style.copy()
        style["effect_type"] = "wave"
        style["effect_config"] = {
            "amplitude": 25.0,
            "wavelength": 80.0,
        }
        return style
    
    @staticmethod
    def build_chromatic_style(base_style: Dict[str, Any]) -> Dict[str, Any]:
        """Build a style using Chromatic Aberration effect"""
        style = base_style.copy()
        style["effect_type"] = "chromatic"
        style["effect_config"] = {
            "shift_amount": 3.0,
        }
        return style


class FireStormEffect:
    """
    Fire Storm Effect (ported from render_engine FireStormRenderer)
    Generates outward star particles with a light text glow.
    """
    def __init__(self, particle_count: int = 12):
        self.particle_count = max(1, particle_count)


class CyberGlitchEffect:
    """
    Cyber Glitch Effect (ported from render_engine CyberGlitchRenderer)
    Layered RGB offsets with jittery scale pulses.
    """
    def __init__(self):
        pass


class BubbleFloralEffect:
    """
    Bubble Floral Effect (ported from render_engine BubbleFloralRenderer)
    Floating text with drifting bubbles.
    """
    def __init__(self, bubble_count: int = 8):
        self.bubble_count = max(1, bubble_count)


class ThunderStrikeEffect:
    """
    Thunder Strike Effect (ported from render_engine ThunderStrikeRenderer)
    Quick flashing outline over the text.
    """
    def __init__(self):
        pass


class RainbowWaveEffect:
    """
    Rainbow Wave Effect (ported from render_engine RainbowWaveRenderer)
    Color cycling over the text.
    """
    def __init__(self):
        pass


class EarthquakeShakeEffect:
    """
    Earthquake Shake Effect (ported from render_engine EarthquakeShakeRenderer)
    Rapid rotation jitter.
    """
    def __init__(self, angle_range: int = 5, step_ms: int = 40):
        self.angle_range = max(0, angle_range)
        self.step_ms = max(1, step_ms)


class HorrorCreepyEffect:
    """
    Horror Creepy Effect (ported from render_engine HorrorCreepyRenderer)
    Small random shakes with blur pulses.
    """
    def __init__(self, step_ms: int = 50):
        self.step_ms = max(1, step_ms)


class LuxuryGoldEffect:
    """
    Luxury Gold Effect (ported from render_engine LuxuryGoldRenderer)
    Simple shine color transform.
    """
    def __init__(self):
        pass


class ComicBookEffect:
    """
    Comic Book Effect (ported from render_engine ComicBookRenderer)
    Small rotation with squash-and-stretch bounce.
    """
    def __init__(self):
        pass


class PulseEffect:
    """
    Pulse Effect (ported from render_engine PulseRenderer)
    Main text pulse plus expanding rings.
    """
    def __init__(self, ring_count: int = 3):
        self.ring_count = max(0, ring_count)


class ColorfulEffect:
    """
    Colorful Effect (ported from render_engine ColorfulRenderer)
    Color cycling text with small particles.
    """
    def __init__(self):
        pass


class GhostStarEffect:
    """
    Ghost Star Effect (ported from render_engine GhostStarRenderer)
    Blurry text with orbiting stars.
    """
    def __init__(self):
        pass


class MatrixRainEffect:
    """
    Matrix Rain Effect (ported from render_engine MatrixRainRenderer)
    Falling green characters.
    """
    def __init__(self):
        pass


class ElectricShockEffect:
    """
    Electric Shock Effect (ported from render_engine ElectricShockRenderer)
    Yellow shake with lightning bolts.
    """
    def __init__(self):
        pass


class SmokeTrailEffect:
    """
    Smoke Trail Effect (ported from render_engine SmokeTrailRenderer)
    Fade-out text with rising smoke blobs.
    """
    def __init__(self):
        pass


class PixelGlitchEffect:
    """
    Pixel Glitch Effect (ported from render_engine PixelGlitchRenderer)
    RGB offset copies with positional glitches.
    """
    def __init__(self):
        pass


class NeonSignEffect:
    """
    Neon Sign Effect (ported from render_engine NeonSignRenderer)
    Flickering neon glow.
    """
    def __init__(self):
        pass


class FadeInOutEffect:
    """
    Fade In/Out Effect (ported from render_engine FadeInOutRenderer)
    Sentence-level fade.
    """
    def __init__(self):
        pass


class SlideUpEffect:
    """
    Slide Up Effect (ported from render_engine SlideUpRenderer)
    Sentence-level slide from below.
    """
    def __init__(self):
        pass


class ZoomBurstEffect:
    """
    Zoom Burst Effect (ported from render_engine ZoomBurstRenderer)
    Sentence zoom-in burst.
    """
    def __init__(self):
        pass


class BounceInEffect:
    """
    Bounce In Effect (ported from render_engine BounceInRenderer)
    Sentence bounce from above.
    """
    def __init__(self):
        pass


class TikTokYellowBoxEffect:
    """
    TikTok Yellow Box Effect (ported from render_engine TikTokYellowBoxRenderer)
    Rounded yellow box with scaling text.
    """
    def __init__(self):
        pass


class FallingHeartEffect:
    """
    Falling Heart Effect (ported from render_engine FallingHeartRenderer)
    Hearts falling around the text.
    """
    def __init__(self):
        pass


class ThunderStormEffect:
    """
    Thunder Storm Effect (ported from render_engine ThunderStormRenderer)
    Storm clouds, flashes, lightning, sparks, rain.
    """
    def __init__(self):
        pass


class IceCrystalEffect:
    """
    Ice Crystal Effect (ported from render_engine IceCrystalRenderer)
    Frozen text with exploding crystals and snowflakes.
    """
    def __init__(self):
        pass


class CosmicStarsEffect:
    """
    Cosmic Stars Effect (ported from render_engine CosmicStarsRenderer)
    Cosmic glow, orbiting stars, stardust.
    """
    def __init__(self):
        pass


class OceanWaveEffect:
    """
    Ocean Wave Effect (ported from render_engine OceanWaveRenderer)
    Water glow, wavy text, bubbles/foam.
    """
    def __init__(self):
        pass


class ButterflyDanceEffect:
    """
    Butterfly Dance Effect (ported from render_engine ButterflyDanceRenderer)
    Flowers, butterflies, petals.
    """
    def __init__(self):
        pass


class PyonFXRenderer:
    """
    Renderer for PyonFX effects within ASS subtitle format
    """
    
    EFFECTS = {
        "bulge": BulgeEffect,
        "shake": ShakeEffect,
        "wave": WaveEffect,
        "chromatic": ChromaticAberrationEffect,
        "fire_storm": FireStormEffect,
        "cyber_glitch": CyberGlitchEffect,
        "bubble_floral": BubbleFloralEffect,
        "thunder_strike": ThunderStrikeEffect,
        "rainbow_wave": RainbowWaveEffect,
        "earthquake_shake": EarthquakeShakeEffect,
        "horror_creepy": HorrorCreepyEffect,
        "luxury_gold": LuxuryGoldEffect,
        "comic_book": ComicBookEffect,
        "pulse": PulseEffect,
        "colorful": ColorfulEffect,
        "ghost_star": GhostStarEffect,
        "matrix_rain": MatrixRainEffect,
        "electric_shock": ElectricShockEffect,
        "smoke_trail": SmokeTrailEffect,
        "pixel_glitch": PixelGlitchEffect,
        "neon_sign": NeonSignEffect,
        "fade_in_out": FadeInOutEffect,
        "slide_up": SlideUpEffect,
        "zoom_burst": ZoomBurstEffect,
        "bounce_in": BounceInEffect,
        "tiktok_yellow_box": TikTokYellowBoxEffect,
        "falling_heart": FallingHeartEffect,
        "thunder_storm": ThunderStormEffect,
        "ice_crystal": IceCrystalEffect,
        "cosmic_stars": CosmicStarsEffect,
        "ocean_wave": OceanWaveEffect,
        "butterfly_dance": ButterflyDanceEffect,
    }
    
    def __init__(self, words: List[Dict[str, Any]], style: Dict[str, Any]):
        """
        Args:
            words: List of word segments with timing
            style: Style dictionary with effect_type and effect_config
        """
        self.words = words
        self.style = style
        self.effect_type = style.get("effect_type", "bulge")
        self.effect_config = style.get("effect_config", {})
        
        # Initialize effect
        effect_class = self.EFFECTS.get(self.effect_type, BulgeEffect)
        if self.effect_type == "bulge":
            self.effect = effect_class(self.effect_config.get("intensity", 1.5))
        elif self.effect_type == "shake":
            self.effect = effect_class(
                self.effect_config.get("intensity", 8.0),
                self.effect_config.get("frequency", 15.0)
            )
        elif self.effect_type == "wave":
            self.effect = effect_class(
                self.effect_config.get("amplitude", 25.0),
                self.effect_config.get("wavelength", 80.0)
            )
        elif self.effect_type == "chromatic":
            self.effect = effect_class(self.effect_config.get("shift_amount", 3.0))
        elif self.effect_type == "fire_storm":
            self.effect = effect_class(self.effect_config.get("particle_count", 12))
        elif self.effect_type == "cyber_glitch":
            self.effect = effect_class()
        elif self.effect_type == "bubble_floral":
            self.effect = effect_class(self.effect_config.get("bubble_count", 8))
        elif self.effect_type == "thunder_strike":
            self.effect = effect_class()
        elif self.effect_type == "rainbow_wave":
            self.effect = effect_class()
        elif self.effect_type == "earthquake_shake":
            self.effect = effect_class(
                self.effect_config.get("angle_range", 5),
                self.effect_config.get("step_ms", 40),
            )
        elif self.effect_type == "horror_creepy":
            self.effect = effect_class(self.effect_config.get("step_ms", 50))
        elif self.effect_type == "luxury_gold":
            self.effect = effect_class()
        elif self.effect_type == "comic_book":
            self.effect = effect_class()
        elif self.effect_type == "pulse":
            self.effect = effect_class(self.effect_config.get("ring_count", 3))
        elif self.effect_type == "colorful":
            self.effect = effect_class()
        elif self.effect_type == "ghost_star":
            self.effect = effect_class()
        elif self.effect_type == "matrix_rain":
            self.effect = effect_class()
        elif self.effect_type == "electric_shock":
            self.effect = effect_class()
        elif self.effect_type == "smoke_trail":
            self.effect = effect_class()
        elif self.effect_type == "pixel_glitch":
            self.effect = effect_class()
        elif self.effect_type == "neon_sign":
            self.effect = effect_class()
        elif self.effect_type == "fade_in_out":
            self.effect = effect_class()
        elif self.effect_type == "slide_up":
            self.effect = effect_class()
        elif self.effect_type == "zoom_burst":
            self.effect = effect_class()
        elif self.effect_type == "bounce_in":
            self.effect = effect_class()
        elif self.effect_type == "tiktok_yellow_box":
            self.effect = effect_class()
        elif self.effect_type == "falling_heart":
            self.effect = effect_class()
        elif self.effect_type == "thunder_storm":
            self.effect = effect_class()
        elif self.effect_type == "ice_crystal":
            self.effect = effect_class()
        elif self.effect_type == "cosmic_stars":
            self.effect = effect_class()
        elif self.effect_type == "ocean_wave":
            self.effect = effect_class()
        elif self.effect_type == "butterfly_dance":
            self.effect = effect_class()
        else:
            self.effect = effect_class()
    
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
    
    def render(self) -> str:
        """Render all words with PyonFX effects applied"""
        if self.effect_type == "fire_storm":
            return self._render_fire_storm()
        if self.effect_type == "cyber_glitch":
            return self._render_cyber_glitch()
        if self.effect_type == "bubble_floral":
            return self._render_bubble_floral()
        if self.effect_type == "thunder_strike":
            return self._render_thunder_strike()
        if self.effect_type == "rainbow_wave":
            return self._render_rainbow_wave()
        if self.effect_type == "earthquake_shake":
            return self._render_earthquake_shake()
        if self.effect_type == "horror_creepy":
            return self._render_horror_creepy()
        if self.effect_type == "luxury_gold":
            return self._render_luxury_gold()
        if self.effect_type == "comic_book":
            return self._render_comic_book()
        if self.effect_type == "pulse":
            return self._render_pulse()
        if self.effect_type == "colorful":
            return self._render_colorful()
        if self.effect_type == "ghost_star":
            return self._render_ghost_star()
        if self.effect_type == "matrix_rain":
            return self._render_matrix_rain()
        if self.effect_type == "electric_shock":
            return self._render_electric_shock()
        if self.effect_type == "smoke_trail":
            return self._render_smoke_trail()
        if self.effect_type == "pixel_glitch":
            return self._render_pixel_glitch()
        if self.effect_type == "neon_sign":
            return self._render_neon_sign()
        if self.effect_type == "fade_in_out":
            return self._render_fade_in_out()
        if self.effect_type == "slide_up":
            return self._render_slide_up()
        if self.effect_type == "zoom_burst":
            return self._render_zoom_burst()
        if self.effect_type == "bounce_in":
            return self._render_bounce_in()
        if self.effect_type == "tiktok_yellow_box":
            return self._render_tiktok_yellow_box()
        if self.effect_type == "falling_heart":
            return self._render_falling_heart()
        if self.effect_type == "thunder_storm":
            return self._render_thunder_storm()
        if self.effect_type == "ice_crystal":
            return self._render_ice_crystal()
        if self.effect_type == "cosmic_stars":
            return self._render_cosmic_stars()
        if self.effect_type == "ocean_wave":
            return self._render_ocean_wave()
        if self.effect_type == "butterfly_dance":
            return self._render_butterfly_dance()
        lines = [self.render_ass_header()]
        
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", 0) * 1000)
            duration_ms = max(1, end_ms - start_ms)
            
            # Format timestamps
            start_ts = self._ms_to_timestamp(start_ms)
            end_ts = self._ms_to_timestamp(end_ms)
            
            # Apply effect
            text = word.get("text", "").replace("{", r"\{").replace("}", r"\}")
            
            # Build effect tags based on effect type
            effect_tags = self._build_effect_tags(duration_ms)
            
            # Create dialogue line
            line = f"Dialogue: 0,{start_ts},{end_ts},Default,,0,0,0,,{effect_tags}{text}"
            lines.append(line)
        
        return "\n".join(lines)

    def _get_center_coordinates(self) -> tuple[int, int]:
        """Match StyleRenderer center logic from render_engine."""
        screen_h = 1080
        cx = 1920 // 2
        alignment = int(self.style.get("alignment", 2))
        if alignment == 8:
            cy = 150
        elif alignment == 5:
            cy = screen_h // 2
        else:
            cy = screen_h - 150
        return cx, cy

    def _render_fire_storm(self) -> str:
        """Port of FireStormRenderer using PyonFX pipeline."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        particle_count = int(self.effect_config.get("particle_count", getattr(self.effect, "particle_count", 12)))
        colors = self.effect_config.get("colors", ["&H0000FF&", "&H00FFFF&", "&HFFFFFF&"])
        # Star path from original preset
        star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            duration = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            # Base glowing text
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(100,100)\\blur5\\t(0,{duration},\\fscx110\\fscy110\\blur10)}}{safe_text}"
            )

            # Particles
            for _ in range(particle_count):
                angle = math.radians(random.uniform(0, 360))
                speed = random.uniform(
                    float(self.effect_config.get("min_speed", 30.0)),
                    float(self.effect_config.get("max_speed", 120.0)),
                )
                sx = cx + random.uniform(-40, 40)
                sy = cy + random.uniform(-10, 10)
                ex = sx + math.cos(angle) * speed
                ey = sy + math.sin(angle) * speed
                p_start = start_ms + random.randint(0, max(0, duration - 200))
                p_end = p_start + random.randint(300, 600)
                color = random.choice(colors)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({int(sx)},{int(sy)},{int(ex)},{int(ey)})\\fad(0,200)\\blur2\\1c{color}\\bord0\\p1\\t(\\fscx0\\fscy0)}}"
                    f"{star_shape}{{\\p0}}"
                )

        return "\n".join(lines)

    def _render_cyber_glitch(self) -> str:
        """Port of CyberGlitchRenderer with configurable jitter/scale."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()

        offset_px = int(self.effect_config.get("offset_px", 3))
        jitter_min = int(self.effect_config.get("jitter_min_ms", 40))
        jitter_max = int(self.effect_config.get("jitter_max_ms", 90))
        scale_min = int(self.effect_config.get("scale_min", 90))
        scale_max = int(self.effect_config.get("scale_max", 110))

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            # Blue channel (left -> right)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx - offset_px},{cy})\\1c&H0000FF&\\t(\\pos({cx + offset_px},{cy}))}}{safe_text}"
            )
            # Red channel (right -> left)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + offset_px},{cy})\\1c&HFF0000&\\t(\\pos({cx - offset_px},{cy}))}}{safe_text}"
            )

            # Main jitter line
            jitter_tags = ""
            curr = 0
            while curr < dur:
                step = random.randint(jitter_min, max(jitter_min, jitter_max))
                sc = random.randint(scale_min, max(scale_min, scale_max))
                jitter_tags += f"\\t({curr},{curr + step},\\fscx{sc}\\fscy{sc})"
                curr += step

            lines.append(
                f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy}){jitter_tags}}}{safe_text}"
            )

        return "\n".join(lines)

    def _render_bubble_floral(self) -> str:
        """Port of BubbleFloralRenderer with drifting bubbles."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()

        bubble_shape = "m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15"
        bubble_count = int(self.effect_config.get("bubble_count", getattr(self.effect, "bubble_count", 8)))
        drift_y_min = int(self.effect_config.get("drift_y_min", 100))
        drift_y_max = int(self.effect_config.get("drift_y_max", 200))
        bubble_size_min = int(self.effect_config.get("bubble_size_min", 10))
        bubble_size_max = int(self.effect_config.get("bubble_size_max", 30))

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            rotation = random.choice([-15, 15])
            # Main text float-in
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\move({cx},{cy + 20},{cx},{cy})\\frz{rotation}\\t(\\frz0)\\fad(100,100)"
                f"\\1c{hex_to_ass(self.style.get('primary_color', '&H00FFFFFF'))}"
                f"\\3c{hex_to_ass(self.style.get('outline_color', '&H00000000'))}}}{safe_text}"
            )

            # Bubbles
            for _ in range(bubble_count):
                bx = cx + random.randint(-50, 50)
                by = cy + random.randint(-100, 50)
                ey = by - random.randint(drift_y_min, drift_y_max)
                b_start = start_ms + random.randint(0, dur // 2)
                b_end = b_start + random.randint(800, 1200)
                size = random.randint(bubble_size_min, bubble_size_max)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(b_start)},{self._ms_to_timestamp(b_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({bx},{by},{bx},{ey})\\fscx{size}\\fscy{size}\\1c&HFFFFFF&\\3c&HFFFFFF&\\blur5\\fad(100,200)\\p1}}"
                    f"{bubble_shape}{{\\p0}}"
                )

        return "\n".join(lines)

    def _render_thunder_strike(self) -> str:
        """Port of ThunderStrikeRenderer: flashing outline."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        flash = self.effect_config.get(
            "flash_tags",
            "\\t(0,50,\\3c&HFFFFFF&)\\t(50,100,\\3c&H000000&)\\t(100,150,\\3c&HFFFFFF&)\\t(150,200,\\3c&H000000&)",
        )

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(50,50){flash}\\fscx110\\fscy110}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_rainbow_wave(self) -> str:
        """Port of RainbowWaveRenderer: simple color cycle."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        colors = self.effect_config.get("colors", ["&H00FF00&", "&HFF0000&", "&H0000FF&"])
        # Build transform sequence evenly over duration thirds
        def build_rainbow(dur: int) -> str:
            if not colors:
                return ""
            step = max(1, dur // max(1, len(colors)))
            tags = ""
            for i, col in enumerate(colors):
                t_start = i * step
                t_end = min(dur, (i + 1) * step)
                tags += f"\\t({t_start},{t_end},\\1c{hex_to_ass(col)})"
            return tags

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(50,50){build_rainbow(dur)}}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_earthquake_shake(self) -> str:
        """Port of EarthquakeShakeRenderer: rotation jitter."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        angle_range = int(self.effect_config.get("angle_range", getattr(self.effect, "angle_range", 5)))
        step_ms = int(self.effect_config.get("step_ms", getattr(self.effect, "step_ms", 40)))

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            shake = ""
            curr = 0
            while curr < dur:
                angle = random.randint(-angle_range, angle_range)
                step = step_ms
                shake += f"\\t({curr},{curr + step},\\frz{angle})"
                curr += step

            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy}){shake}}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_horror_creepy(self) -> str:
        """Port of HorrorCreepyRenderer: jitter with blur pulses."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        step_ms = int(self.effect_config.get("step_ms", getattr(self.effect, "step_ms", 50)))

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            shake = ""
            curr = 0
            while curr < dur:
                ox = random.randint(-2, 2)
                oy = random.randint(-2, 2)
                fscx = random.randint(95, 105)
                fscy = random.randint(95, 105)
                shake += f"\\t({curr},{curr + step_ms},\\fscx{fscx}\\fscy{fscy}\\pos({cx + ox},{cy + oy}))"
                curr += step_ms

            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\blur3\\t(0,200,\\blur0){shake}}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_luxury_gold(self) -> str:
        """Port of LuxuryGoldRenderer: simple shine color transform."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        shine = self.effect_config.get(
            "shine_tags",
            "\\t(0,100,\\1c&HFFFFFF&)\\t(100,300,\\1c&H00D7FF&)",
        )

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(100,100){shine}}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_comic_book(self) -> str:
        """Port of ComicBookRenderer: rotate and bounce scale."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            rot = random.randint(-5, 5)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\frz{rot}\\fscx50\\fscy50"
                f"\\t(0,100,\\fscx110\\fscy110)\\t(100,150,\\fscx100\\fscy100)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_pulse(self) -> str:
        """Port of PulseRenderer: pulse + expanding rings."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        ring_count = int(self.effect_config.get("ring_count", getattr(self.effect, "ring_count", 3)))
        ring_shape = "m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            mid = dur // 2
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            pulse_tags = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(50,50){pulse_tags}}}{safe_text}"
            )

            for i in range(ring_count):
                ring_start = start_ms + i * 100
                ring_end = ring_start + 600
                scale_start = 100 + i * 20
                scale_end = 350 + i * 50
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(ring_start)},{self._ms_to_timestamp(ring_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx},{cy})\\1a&HFF&\\3c&HFFFFFF&\\bord2\\fscx{scale_start}\\fscy{scale_start}"
                    f"\\t(\\fscx{scale_end}\\fscy{scale_end}\\alpha&HFF&)\\p1}}{ring_shape}{{\\p0}}"
                )
        return "\n".join(lines)
    
    def _build_effect_tags(self, duration_ms: int) -> str:
        """Build ASS animation tags for the effect"""
        tags = ""
        
        if self.effect_type == "bulge":
            # Bulge grows and shrinks
            tags = f"{{\\t(0,{duration_ms},\\fscx110\\fscy110)\\t({duration_ms // 2},{duration_ms},\\fscx100\\fscy100)\\blur0.2}}"
        elif self.effect_type == "shake":
            # Rapid shake animation using color flashes
            shake_intensity = self.effect_config.get("intensity", 8.0)
            frequency = self.effect_config.get("frequency", 15.0)
            # Convert frequency to step size (Hz to milliseconds)
            step = max(10, int(1000 / frequency))
            # Create shake effect with rapid color/blur changes for visual vibration
            tags = f"{{\\blur0.3\\t(0,{step},\\blur0.5)\\t({step},{step*2},\\blur0.2)\\t({step*2},{step*3},\\blur0.5)\\t({step*3},{step*4},\\blur0.2)\\t({step*4},{duration_ms},\\blur0.3)}}"
        elif self.effect_type == "wave":
            # Wave motion
            tags = f"{{\\t(0,{duration_ms},\\fscx105\\fscy95)\\t({duration_ms // 2},{duration_ms},\\fscx100\\fscy100)}}"
        elif self.effect_type == "chromatic":
            # Chromatic aberration with color shift
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
def create_pyonfx_subtitle(
    words: List[Dict[str, Any]],
    effect_type: str = "bulge",
    font_name: str = "Arial",
    font_size: int = 64,
) -> str:
    """
    Create a subtitle file with PyonFX effects
    
    Args:
        words: List of word dictionaries with 'start', 'end', 'text'
        effect_type: Type of effect ('bulge', 'shake', 'wave', 'chromatic')
        font_name: Font to use
        font_size: Font size in points
        
    Returns:
        ASS subtitle file content
    """
    style = {
        "effect_type": effect_type,
        "font": font_name,
        "font_size": font_size,
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "bold": 1,
        "border": 2,
    }
    
    renderer = PyonFXRenderer(words, style)
    return renderer.render()
