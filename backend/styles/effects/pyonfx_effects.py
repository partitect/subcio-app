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


class NeonPulseEffect:
    """Simple neon pulse scale/blur."""
    def __init__(self):
        pass


class KineticBounceEffect:
    """Bounce in with squash/stretch."""
    def __init__(self):
        pass


class CinematicBlurEffect:
    """Blur in/out around timing."""
    def __init__(self):
        pass


class TypewriterProEffect:
    """Rotate-in typewriter emphasis."""
    def __init__(self):
        pass


class WordPopEffect:
    """Scale pop on each word."""
    def __init__(self):
        pass


class RetroArcadeEffect:
    """Static retro placeholder."""
    def __init__(self):
        pass


class NewsTickerEffect:
    """Slide-up ticker feel."""
    def __init__(self):
        pass


class TikTokGroupEffect:
    """Group previous/current/next words."""
    def __init__(self):
        pass


class Spin3DEffect:
    """3D-ish spin via rotations."""
    def __init__(self):
        pass


class ShearForceEffect:
    """Shear/leaned text bounce."""
    def __init__(self):
        pass


class DoubleShadowEffect:
    """Two shadow layers."""
    def __init__(self):
        pass


class KaraokeClassicEffect:
    """Classic karaoke focus."""
    def __init__(self):
        pass


class KaraokeProEffect:
    """Pro karaoke with past/future colors."""
    def __init__(self):
        pass


class KaraokeSentenceEffect:
    """Sentence-group karaoke."""
    def __init__(self):
        pass


class DynamicHighlightEffect:
    """Highlights current word with secondary color."""
    def __init__(self):
        pass


class TikTokBoxGroupEffect:
    """Grouped box highlight."""
    def __init__(self):
        pass


class SakuraDreamEffect:
    """Petal drift aesthetic."""
    def __init__(self):
        pass


class PhoenixFlamesEffect:
    """Flame sparks rising."""
    def __init__(self):
        pass


class WelcomeMyLifeEffect:
    """Gentle pop-in."""
    def __init__(self):
        pass


class MadeMyDayEffect:
    """Active word emphasis."""
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
        "neon_pulse": NeonPulseEffect,
        "kinetic_bounce": KineticBounceEffect,
        "cinematic_blur": CinematicBlurEffect,
        "typewriter_pro": TypewriterProEffect,
        "word_pop": WordPopEffect,
        "retro_arcade": RetroArcadeEffect,
        "news_ticker": NewsTickerEffect,
        "tiktok_group": TikTokGroupEffect,
        "spin_3d": Spin3DEffect,
        "shear_force": ShearForceEffect,
        "double_shadow": DoubleShadowEffect,
        "karaoke_classic": KaraokeClassicEffect,
        "karaoke_pro": KaraokeProEffect,
        "karaoke_sentence": KaraokeSentenceEffect,
        "dynamic_highlight": DynamicHighlightEffect,
        "tiktok_box_group": TikTokBoxGroupEffect,
        "sakura_dream": SakuraDreamEffect,
        "phoenix_flames": PhoenixFlamesEffect,
        "welcome_my_life": WelcomeMyLifeEffect,
        "mademyday": MadeMyDayEffect,
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
        if self.effect_type == "neon_pulse":
            return self._render_neon_pulse()
        if self.effect_type == "kinetic_bounce":
            return self._render_kinetic_bounce()
        if self.effect_type == "cinematic_blur":
            return self._render_cinematic_blur()
        if self.effect_type == "typewriter_pro":
            return self._render_typewriter_pro()
        if self.effect_type == "word_pop":
            return self._render_word_pop()
        if self.effect_type == "retro_arcade":
            return self._render_retro_arcade()
        if self.effect_type == "news_ticker":
            return self._render_news_ticker()
        if self.effect_type == "tiktok_group":
            return self._render_tiktok_group()
        if self.effect_type == "spin_3d":
            return self._render_spin_3d()
        if self.effect_type == "shear_force":
            return self._render_shear_force()
        if self.effect_type == "double_shadow":
            return self._render_double_shadow()
        if self.effect_type == "karaoke_classic":
            return self._render_karaoke_classic()
        if self.effect_type == "karaoke_pro":
            return self._render_karaoke_pro()
        if self.effect_type == "karaoke_sentence":
            return self._render_karaoke_sentence()
        if self.effect_type == "dynamic_highlight":
            return self._render_dynamic_highlight()
        if self.effect_type == "tiktok_box_group":
            return self._render_tiktok_box_group()
        if self.effect_type == "sakura_dream":
            return self._render_sakura_dream()
        if self.effect_type == "phoenix_flames":
            return self._render_phoenix_flames()
        if self.effect_type == "welcome_my_life":
            return self._render_welcome_my_life()
        if self.effect_type == "mademyday":
            return self._render_mademyday()
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

    def _render_colorful(self) -> str:
        """Port of ColorfulRenderer with color cycle + particles."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        colors = self.effect_config.get(
            "colors",
            ["&H0000FF&", "&H00FFFF&", "&H00FF00&", "&HFFFF00&", "&HFF0000&", "&HFF00FF&"],
        )

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            step = max(1, dur // max(1, len(colors)))

            color_transforms = ""
            for i, color in enumerate(colors):
                t_start = i * step
                t_end = min(dur, (i + 1) * step)
                color_transforms += f"\\t({t_start},{t_end},\\1c{hex_to_ass(color)})"

            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fscx110\\fscy110\\blur3{color_transforms}\\fad(100,100)}}{safe_text}"
            )

            for _ in range(10):
                px = cx + random.randint(-60, 60)
                py = cy + random.randint(-40, 40)
                ex = px + random.randint(-100, 100)
                ey = py + random.randint(-100, 100)
                p_start = start_ms + random.randint(0, dur // 2)
                p_end = p_start + random.randint(400, 800)
                p_color = hex_to_ass(random.choice(colors))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({px},{py},{ex},{ey})\\1c{p_color}\\fscx15\\fscy15\\blur4\\fad(0,200)\\p1}}"
                    f"m 0 0 l 10 0 10 10 0 10{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_ghost_star(self) -> str:
        """Port of GhostStarRenderer with orbiting stars."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\blur8\\fscx105\\fscy105\\t(\\blur2\\fscx100\\fscy100)\\fad(150,150)}}{safe_text}"
            )

            for _ in range(12):
                sx = cx + random.randint(-100, 100)
                sy = cy + random.randint(-80, 80)
                angle = random.uniform(0, 360)
                distance = random.uniform(80, 150)
                ex = sx + math.cos(math.radians(angle)) * distance
                ey = sy + math.sin(math.radians(angle)) * distance
                s_start = start_ms + random.randint(0, dur)
                s_end = s_start + random.randint(800, 1200)
                size = random.randint(15, 35)
                star_color = hex_to_ass(random.choice(["&HFFFFFF&", "&HFFFF00&", "&H00FFFF&"]))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({int(sx)},{int(sy)},{int(ex)},{int(ey)})\\fscx{size}\\fscy{size}\\1c{star_color}"
                    f"\\blur6\\frz0\\t(\\frz360)\\fad(200,300)\\p1}}{star_shape}{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_matrix_rain(self) -> str:
        """Port of MatrixRainRenderer: falling glyphs."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        base_color = hex_to_ass(self.style.get("primary_color", "&H00FF00"))
        chars = "01??????????"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c{base_color}\\fad(100,100)}}{safe_text}"
            )

            for _ in range(15):
                char = random.choice(chars)
                x = cx + random.randint(-200, 200)
                y_start = cy - random.randint(200, 400)
                y_end = cy + random.randint(100, 300)
                c_start = start_ms + random.randint(0, dur)
                c_end = c_start + random.randint(500, 1000)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(c_start)},{self._ms_to_timestamp(c_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({x},{y_start},{x},{y_end})\\1c{base_color}\\alpha&H80&\\fscx50\\fscy50\\fad(0,200)}}{char}"
                )
        return "\n".join(lines)

    def _render_electric_shock(self) -> str:
        """Port of ElectricShockRenderer: shake + lightning bolts."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        lightning_shape = "m 0 0 l 5 20 l -3 20 l 8 40 l -10 25 l 0 25"
        base_color = hex_to_ass(self.style.get("primary_color", "&H00FFFF00"))

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            shake = "".join(
                [f"\\t({i*50},{(i+1)*50},\\frz{random.randint(-3,3)})" for i in range(min(dur // 50, 10))]
            )
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c{base_color}{shake}}}{safe_text}"
            )

            for _ in range(6):
                lx = cx + random.randint(-80, 80)
                ly = cy + random.randint(-60, 60)
                l_start = start_ms + random.randint(0, max(1, dur // 2))
                l_end = l_start + random.randint(50, 150)
                rotation = random.randint(0, 360)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(l_start)},{self._ms_to_timestamp(l_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({lx},{ly})\\frz{rotation}\\1c{base_color}\\fscx80\\fscy80\\fad(0,50)\\p1}}"
                    f"{lightning_shape}{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_smoke_trail(self) -> str:
        """Port of SmokeTrailRenderer: fade-out text with rising smoke."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        smoke_shape = "m 0 0 b 10 -5 20 -5 30 0 b 20 5 10 5 0 0"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(100,300)\\t({max(dur-200,0)},{dur},\\alpha&HFF&\\blur10)}}{safe_text}"
            )

            for _ in range(10):
                sx = cx + random.randint(-40, 40)
                sy = cy + random.randint(-20, 20)
                ey = sy - random.randint(50, 100)
                s_start = start_ms + random.randint(max(dur // 2, 0), dur)
                s_end = s_start + random.randint(800, 1200)
                size = random.randint(30, 60)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({sx},{sy},{sx + random.randint(-30,30)},{ey})\\fscx{size}\\fscy{size}\\1c&HCCCCCC&"
                    f"\\alpha&H40&\\blur8\\t(\\alpha&HFF&\\fscx{size*2}\\fscy{size*2})\\p1}}{smoke_shape}{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_pixel_glitch(self) -> str:
        """Port of PixelGlitchRenderer: layered channel glitches."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        colors = self.effect_config.get("colors", ["&HFF0000&", "&H00FF00&", "&H0000FF&", "&HFFFFFF&"])

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            for i, color in enumerate(colors):
                offset_x = random.randint(-5, 5)
                offset_y = random.randint(-3, 3)
                glitch_count = min(dur // 100, 8)
                glitch_times = "".join(
                    [
                        f"\\t({j*100},{(j+1)*100},\\pos({cx + random.randint(-10,10)},{cy + random.randint(-5,5)}))"
                        for j in range(glitch_count)
                    ]
                )
                lines.append(
                    f"Dialogue: {i},{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + offset_x},{cy + offset_y})\\1c{hex_to_ass(color)}\\alpha&H60&{glitch_times}}}{safe_text}"
                )
        return "\n".join(lines)

    def _render_neon_sign(self) -> str:
        """Port of NeonSignRenderer: flickering glow."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        primary = hex_to_ass(self.style.get("primary_color", "&H00FF00FF"))
        outline = hex_to_ass(self.style.get("outline_color", "&H00FF00FF"))

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            flicker = ""
            t = 0
            while t < min(dur, 1000):
                if random.random() < 0.3:
                    flicker += f"\\t({t},{t+50},\\alpha&HFF&)\\t({t+50},{t+100},\\alpha&H00&)"
                    t += 100
                else:
                    t += 100

            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c{primary}\\3c{outline}\\bord3\\blur5{flicker}}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_fade_in_out(self) -> str:
        """Port of FadeInOutRenderer: sentence-level fade."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        sentence_length = int(self.effect_config.get("sentence_length", 5))

        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
            start_ms = int(sent_words[0].get("start", 0) * 1000)
            end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
            full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(400,400)}}{full_text}"
            )
        return "\n".join(lines)

    def _render_slide_up(self) -> str:
        """Port of SlideUpRenderer: sentence slide from below."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        sentence_length = int(self.effect_config.get("sentence_length", 4))

        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
            start_ms = int(sent_words[0].get("start", 0) * 1000)
            end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
            full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\move({cx},{cy + 100},{cx},{cy},0,300)\\fad(100,200)}}{full_text}"
            )
        return "\n".join(lines)

    def _render_zoom_burst(self) -> str:
        """Port of ZoomBurstRenderer: zoom-in burst per sentence."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        sentence_length = int(self.effect_config.get("sentence_length", 4))

        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
            start_ms = int(sent_words[0].get("start", 0) * 1000)
            end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
            full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fscx0\\fscy0\\t(0,300,\\fscx100\\fscy100)\\fad(0,200)}}{full_text}"
            )
        return "\n".join(lines)

    def _render_bounce_in(self) -> str:
        """Port of BounceInRenderer: bounce-in sentence animation."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        sentence_length = int(self.effect_config.get("sentence_length", 4))
        bounce = "\\t(0,150,\\fscx120\\fscy120)\\t(150,250,\\fscx95\\fscy95)\\t(250,350,\\fscx105\\fscy105)\\t(350,400,\\fscx100\\fscy100)"

        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
            start_ms = int(sent_words[0].get("start", 0) * 1000)
            end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
            full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\move({cx},{cy - 100},{cx},{cy},0,400){bounce}\\fad(0,200)}}{full_text}"
            )
        return "\n".join(lines)

    def _render_tiktok_yellow_box(self) -> str:
        """Port of TikTokYellowBoxRenderer: rounded box + scaling text."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        char_width = 35

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            text_width = len(text) * char_width
            box_w = text_width + 60
            box_h = 90
            radius = 15
            box_shape = (
                f"m {radius} 0 l {box_w-radius} 0 b {box_w} 0 {box_w} {radius} {box_w} {radius} "
                f"l {box_w} {box_h-radius} b {box_w} {box_h} {box_w-radius} {box_h} {box_w-radius} {box_h} "
                f"l {radius} {box_h} b 0 {box_h} 0 {box_h-radius} 0 {box_h-radius} l 0 {radius} b 0 0 {radius} 0 {radius} 0"
            )

            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\p1\\1c&H00FFFF&\\alpha&H20&\\blur2\\fscx100\\fscy100"
                f"\\t(0,150,\\fscx105\\fscy105)\\t(150,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}"
            )

            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&H000000&\\b1\\fscx110\\fscy110"
                f"\\t(0,150,\\fscx120\\fscy120)\\t(150,{dur},\\fscx110\\fscy110)}}{text}"
            )
        return "\n".join(lines)

    def _render_falling_heart(self) -> str:
        """Port of FallingHeartRenderer: text drop + raining hearts."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        heart_shape = "m 18 40 b 23 29 35 27 35 16 b 36 8 23 0 18 11 b 14 0 0 8 1 16 b 1 27 14 29 18 40"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\move({cx},{cy-50},{cx},{cy})\\frz{random.randint(-20, 20)}\\t(\\frz0)\\fad(300,100)}}{safe_text}"
            )

            for _ in range(15):
                hx = cx + random.randint(-80, 80)
                hy = cy - random.randint(50, 100)
                ey = cy + random.randint(50, 150)
                h_start = start_ms + random.randint(0, dur)
                h_end = h_start + random.randint(1000, 1500)
                size = random.randint(20, 40)
                rotation = random.choice([-500, 500, -700, 700])
                color = hex_to_ass(random.choice(["&HFF69B4&", "&HFF1493&", "&HFF00FF&"]))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(h_start)},{self._ms_to_timestamp(h_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({hx},{hy},{hx + random.randint(-50, 50)},{ey})\\fscx{size}\\fscy{size}\\1c{color}"
                    f"\\blur5\\frz0\\t(\\frz{rotation})\\fad(300,300)\\p1}}{heart_shape}{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_thunder_storm(self) -> str:
        """Port of ThunderStormRenderer: multi-layer storm."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        lightning = "m 0 0 l 5 20 l -3 20 l 8 40 l -10 25 l 0 25"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            # Clouds
            for _ in range(5):
                cloud_x = cx + random.randint(-150, 150)
                cloud_y = cy - random.randint(80, 120)
                cloud_size = random.randint(60, 100)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cloud_x},{cloud_y})\\fscx{cloud_size}\\fscy{cloud_size}\\1c&H404040&\\alpha&H60&\\blur20}}?"
                )

            # Electric flashes + base text
            for flash in range(3):
                flash_start = start_ms + flash * (dur // 3)
                flash_end = flash_start + 100
                lines.append(
                    f"Dialogue: 1,{self._ms_to_timestamp(flash_start)},{self._ms_to_timestamp(flash_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&\\bord3\\3c&HFFFF00&\\blur5}}{safe_text}"
                )
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&H00FFFF&\\bord2\\3c&H0000FF&\\blur2}}{safe_text}"
            )

            # Lightning bolts
            for _ in range(15):
                lx = cx + random.randint(-120, 120)
                ly = cy - random.randint(100, 150)
                l_start = start_ms + random.randint(0, dur)
                l_end = l_start + random.randint(50, 150)
                rotation = random.randint(-30, 30)
                scale = random.randint(80, 150)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(l_start)},{self._ms_to_timestamp(l_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({lx},{ly})\\frz{rotation}\\fscx{scale}\\fscy{scale}\\1c&HFFFF00&\\blur3\\fad(0,50)\\p1}}"
                    f"{lightning}{{\\p0}}"
                )

            # Sparks
            for _ in range(30):
                sx = cx + random.randint(-100, 100)
                sy = cy + random.randint(-60, 60)
                s_end_x = sx + random.randint(-40, 40)
                s_end_y = sy + random.randint(-40, 40)
                s_start = start_ms + random.randint(0, dur)
                s_end = s_start + random.randint(100, 300)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({sx},{sy},{s_end_x},{s_end_y})\\1c&H00FFFF&\\blur2\\fscx5\\fscy5}}?"
                )

            # Rain
            for _ in range(20):
                rx = cx + random.randint(-200, 200)
                ry_start = cy - random.randint(150, 200)
                ry_end = cy + random.randint(100, 150)
                r_start = start_ms + random.randint(0, dur)
                r_end = r_start + random.randint(400, 600)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(r_start)},{self._ms_to_timestamp(r_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({rx},{ry_start},{rx},{ry_end})\\1c&H808080&\\alpha&H80&\\fscx2\\fscy30\\blur1}}|"
                )

            # Flashes
            for i in range(4):
                flash_start = start_ms + i * (dur // 4)
                flash_end = flash_start + 80
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(flash_start)},{self._ms_to_timestamp(flash_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx},{cy})\\fscx400\\fscy400\\1c&HFFFFFF&\\alpha&H00&\\blur30\\t(\\alpha&HFF&)}}?"
                )
        return "\n".join(lines)

    def _render_ice_crystal(self) -> str:
        """Port of IceCrystalRenderer: icy glow + shards + snow."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        crystal_shape = "m 0 -20 l 5 -5 20 0 5 5 0 20 -5 5 -20 0 -5 -5"
        snowflake = "m 0 -15 l 0 15 m -15 0 l 15 0 m -10 -10 l 10 10 m -10 10 l 10 -10"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            ice_colors = ["&HFFFF00&", "&HFFAA00&", "&HFF8800&"]
            for i, color in enumerate(ice_colors):
                offset = (i - 1) * 3
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur18\\alpha&H70&}}{safe_text}"
                )

            for i in range(3):
                lines.append(
                    f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + i},{cy + i})\\1c&HFFFFFF&\\bord2\\3c&HDDFFFF&\\blur1\\fscx110\\fscy110}}{safe_text}"
                )

            for i in range(30):
                angle = (i * 360 / 30) + random.randint(-10, 10)
                distance_start = 30
                distance_end = random.randint(120, 200)
                angle_rad = math.radians(angle)
                cx_start = cx + int(math.cos(angle_rad) * distance_start)
                cy_start = cy + int(math.sin(angle_rad) * distance_start)
                cx_end = cx + int(math.cos(angle_rad) * distance_end)
                cy_end = cy + int(math.sin(angle_rad) * distance_end)
                c_start = start_ms + random.randint(0, dur // 3)
                c_end = c_start + random.randint(600, 1000)
                scale = random.randint(20, 50)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(c_start)},{self._ms_to_timestamp(c_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({cx_start},{cy_start},{cx_end},{cy_end})\\fscx{scale}\\fscy{scale}\\1c&HFFFFFF&\\blur4"
                    f"\\frz{random.randint(0,360)}\\t(\\frz{random.randint(360,720)})\\t(\\alpha&HFF&)\\p1}}{crystal_shape}{{\\p0}}"
                )

            for _ in range(25):
                px = cx + random.randint(-150, 150)
                py = cy + random.randint(-100, 100)
                p_start = start_ms + random.randint(0, dur)
                p_end = p_start + random.randint(400, 800)
                p_size = random.randint(5, 15)
                fade_mid = (p_end - p_start) // 2
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({px},{py})\\fscx{p_size}\\fscy{p_size}\\1c&HDDFFFF&\\blur2"
                    f"\\t(0,{fade_mid},\\alpha&H00&)\\t({fade_mid},{p_end - p_start},\\alpha&HFF&)}}?"
                )

            for _ in range(12):
                sx = cx + random.randint(-100, 100)
                sy = cy + random.randint(-80, 80)
                s_start = start_ms + random.randint(0, dur // 2)
                s_end = s_start + random.randint(1000, 1500)
                s_size = random.randint(25, 45)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({sx},{sy})\\fscx{s_size}\\fscy{s_size}\\1c&HFFFFFF&\\blur3\\frz0\\t(\\frz360)\\p1}}"
                    f"{snowflake}{{\\p0}}"
                )

            shard_shape = "m 0 0 l 3 -25 l 6 0"
            for i in range(8):
                angle = i * 45
                shard_x = cx + int(math.cos(math.radians(angle)) * 60)
                shard_y = cy + int(math.sin(math.radians(angle)) * 60)
                sh_start = start_ms
                sh_end = start_ms + 400
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(sh_start)},{self._ms_to_timestamp(sh_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({shard_x},{shard_y})\\frz{angle}\\fscx80\\fscy80\\1c&HFFFFFF&\\blur2"
                    f"\\t(\\fscx0\\fscy0\\alpha&HFF&)\\p1}}{shard_shape}{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_cosmic_stars(self) -> str:
        """Port of CosmicStarsRenderer: galaxy glow + orbiting stars."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        star_shape = "m 0 -20 l 5 -5 20 0 5 5 0 20 -5 5 -20 0 -5 -5"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            cosmic_colors = ["&HFF00FF&", "&HFF00AA&", "&HFF0066&"]
            for i, color in enumerate(cosmic_colors):
                offset = (i - 1) * 4
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur25\\alpha&H60&"
                    f"\\t(0,{dur//2},\\blur30)\\t({dur//2},{dur},\\blur25)}}{safe_text}"
                )

            galaxy_layers = [("&HFF00FF&", 0, 0), ("&HFF00AA&", 2, 1), ("&HFF0066&", 4, 2)]
            for color, ox, oy in galaxy_layers:
                lines.append(
                    f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + ox},{cy + oy})\\1c{hex_to_ass(color)}\\bord2\\3c&HFFFFFF&\\blur2\\fscx115\\fscy115}}"
                    f"{safe_text}"
                )

            for i in range(25):
                orbit_angle_start = (i * 360 / 25) + random.randint(-20, 20)
                orbit_angle_end = orbit_angle_start + random.choice([360, -360, 720])
                radius = random.randint(80, 150)
                angle_start_rad = math.radians(orbit_angle_start)
                angle_end_rad = math.radians(orbit_angle_end)
                sx_start = cx + int(math.cos(angle_start_rad) * radius)
                sy_start = cy + int(math.sin(angle_start_rad) * radius)
                sx_end = cx + int(math.cos(angle_end_rad) * radius)
                sy_end = cy + int(math.sin(angle_end_rad) * radius)
                s_start = start_ms + random.randint(0, dur // 3)
                s_end = s_start + random.randint(1000, 1500)
                s_size = random.randint(25, 50)
                star_color = hex_to_ass(random.choice(["&HFFFFFF&", "&HFFFF00&", "&HFF00FF&", "&H00FFFF&"]))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({sx_start},{sy_start},{sx_end},{sy_end})\\fscx{s_size}\\fscy{s_size}\\1c{star_color}\\blur5"
                    f"\\frz0\\t(\\frz360)\\t(\\alpha&HFF&)\\p1}}{star_shape}{{\\p0}}"
                )

            for _ in range(40):
                dx = cx + random.randint(-150, 150)
                dy = cy + random.randint(-100, 100)
                d_start = start_ms + random.randint(0, dur)
                d_end = d_start + random.randint(300, 600)
                d_size = random.randint(3, 10)
                dust_color = hex_to_ass(random.choice(["&HFFFFFF&", "&HFFCCFF&", "&HCCFFFF&"]))
                fade_mid = (d_end - d_start) // 2
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(d_start)},{self._ms_to_timestamp(d_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({dx},{dy})\\fscx{d_size}\\fscy{d_size}\\1c{dust_color}\\blur2"
                    f"\\t(0,{fade_mid},\\alpha&H00&)\\t({fade_mid},{d_end - d_start},\\alpha&HFF&)}}?"
                )

            for _ in range(8):
                nx = cx + random.randint(-120, 120)
                ny = cy + random.randint(-80, 80)
                n_size = random.randint(80, 140)
                nebula_color = hex_to_ass(random.choice(["&HFF00FF&", "&HFF0088&", "&H8800FF&"]))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({nx},{ny})\\fscx{n_size}\\fscy{n_size}\\1c{nebula_color}\\alpha&HC0&\\blur30}}?"
                )

            for _ in range(6):
                shoot_x_start = cx + random.randint(-200, 200)
                shoot_y_start = cy - random.randint(100, 150)
                shoot_x_end = shoot_x_start + random.randint(100, 200)
                shoot_y_end = shoot_y_start + random.randint(100, 200)
                sh_start = start_ms + random.randint(0, dur)
                sh_end = sh_start + random.randint(400, 700)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(sh_start)},{self._ms_to_timestamp(sh_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({shoot_x_start},{shoot_y_start},{shoot_x_end},{shoot_y_end})\\1c&HFFFFFF&\\blur8"
                    f"\\fscx80\\fscy3\\frz45\\t(\\alpha&HFF&)}}?"
                )
        return "\n".join(lines)

    def _render_ocean_wave(self) -> str:
        """Port of OceanWaveRenderer: water glow, bubbles, foam."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        bubble_shape = "m 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 0 20 0 20 16 b 20 16 20 16 20 16 b 20 33 0 33 0 16"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            water_colors = ["&HFF8800&", "&HFFAA00&", "&HFFCC00&"]
            for i, color in enumerate(water_colors):
                offset = (i - 1) * 3
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur20\\alpha&H70&}}{safe_text}"
                )

            wave_count = 5
            for i in range(wave_count):
                wave_offset = int(math.sin((i / wave_count) * math.pi * 2) * 10)
                lines.append(
                    f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx},{cy + wave_offset})\\1c&H00CCFF&\\bord2\\3c&H0088FF&\\blur1}}{safe_text}"
                )

            for i in range(40):
                angle = (i * 360 / 40)
                radius = random.randint(60, 120)
                angle_rad = math.radians(angle)
                wx = cx + int(math.cos(angle_rad) * radius)
                wy = cy + int(math.sin(angle_rad) * radius) + int(math.sin(angle_rad * 3) * 20)
                w_start = start_ms + random.randint(0, dur // 2)
                w_end = w_start + random.randint(800, 1200)
                w_size = random.randint(15, 35)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(w_start)},{self._ms_to_timestamp(w_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({wx},{wy})\\fscx{w_size}\\fscy{w_size}\\1c&H00AAFF&\\blur4\\t(\\alpha&HFF&)}}?"
                )

            for _ in range(20):
                bx = cx + random.randint(-100, 100)
                by_start = cy + random.randint(40, 80)
                by_end = cy - random.randint(80, 120)
                b_start = start_ms + random.randint(0, dur)
                b_end = b_start + random.randint(1000, 1500)
                b_size = random.randint(20, 40)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(b_start)},{self._ms_to_timestamp(b_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({bx},{by_start},{bx + random.randint(-20,20)},{by_end})\\fscx{b_size}\\fscy{b_size}"
                    f"\\1c&H00DDFF&\\blur5\\t(\\alpha&HFF&)\\p1}}{bubble_shape}{{\\p0}}"
                )

            for _ in range(15):
                fx = cx + random.randint(-120, 120)
                fy = cy + random.randint(-40, 40)
                f_start = start_ms + random.randint(0, dur)
                f_end = f_start + random.randint(400, 700)
                f_size = random.randint(10, 25)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(f_start)},{self._ms_to_timestamp(f_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({fx},{fy})\\fscx{f_size}\\fscy{f_size}\\1c&HFFFFFF&\\alpha&H40&\\blur8"
                    f"\\t(\\fscx{f_size*2}\\alpha&HFF&)}}?"
                )

            for i in range(3):
                wave_y = cy + (i - 1) * 40
                w_start = start_ms + i * (dur // 3)
                w_end = w_start + 500
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(w_start)},{self._ms_to_timestamp(w_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx},{wave_y})\\fscx300\\fscy15\\1c&H00AAFF&\\alpha&H80&\\blur10\\t(\\fscx400\\alpha&HFF&)}}~"
                )
        return "\n".join(lines)

    def _render_butterfly_dance(self) -> str:
        """Port of ButterflyDanceRenderer: butterflies, petals, glow."""
        lines: List[str] = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        butterfly_shape = "m 10 15 b 5 10 0 5 0 0 b 0 5 5 10 10 15 m 10 15 b 15 10 20 5 20 0 b 20 5 15 10 10 15"

        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

            flower_colors = ["&HFF69B4&", "&HFF1493&", "&HFF00FF&"]
            for i, color in enumerate(flower_colors):
                offset = (i - 1) * 3
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur18\\alpha&H70&}}{safe_text}"
                )

            spring_layers = [("&HFF1493&", 0, 0), ("&HFF69B4&", 2, 1), ("&HFFC0CB&", 4, 2)]
            for color, ox, oy in spring_layers:
                lines.append(
                    f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + ox},{cy + oy})\\1c{hex_to_ass(color)}\\bord2\\3c&H00FF00&\\blur1\\fscx110\\fscy110}}"
                    f"{safe_text}"
                )

            for i in range(18):
                t_start = i / 18
                angle1 = t_start * 360 * 2
                angle2 = (t_start + 0.5) * 360 * 2
                radius = 100
                bx_start = cx + int(math.cos(math.radians(angle1)) * radius)
                by_start = cy + int(math.sin(math.radians(angle1) * 2) * 50)
                bx_end = cx + int(math.cos(math.radians(angle2)) * radius)
                by_end = cy + int(math.sin(math.radians(angle2) * 2) * 50)
                b_start = start_ms + random.randint(0, dur // 2)
                b_end = b_start + random.randint(1200, 1800)
                b_size = random.randint(30, 50)
                butterfly_color = hex_to_ass(random.choice(["&HFF69B4&", "&HFF00FF&", "&H00FFFF&", "&HFFFF00&"]))
                wing_flap = "\\t(0,150,\\fscx110\\fscy90)\\t(150,300,\\fscx100\\fscy100)\\t(300,450,\\fscx110\\fscy90)\\t(450,600,\\fscx100\\fscy100)"
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(b_start)},{self._ms_to_timestamp(b_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({bx_start},{by_start},{bx_end},{by_end})\\fscx{b_size}\\fscy{b_size}\\1c{butterfly_color}"
                    f"\\blur4{wing_flap}\\frz{random.randint(0,360)}\\p1}}{butterfly_shape}{{\\p0}}"
                )

            for _ in range(25):
                px = cx + random.randint(-120, 120)
                py_start = cy - random.randint(80, 120)
                py_end = cy + random.randint(80, 120)
                p_start = start_ms + random.randint(0, dur)
                p_end = p_start + random.randint(1500, 2000)
                p_size = random.randint(15, 30)
                petal_color = hex_to_ass(random.choice(["&HFFC0CB&", "&HFF69B4&", "&HFFFFFF&"]))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({px},{py_start},{px + random.randint(-40,40)},{py_end})\\fscx{p_size}\\fscy{p_size}\\1c{petal_color}"
                    f"\\blur5\\frz0\\t(\\frz{random.randint(360,720)})\\t(\\alpha&HFF&)}}??"
                )

            for _ in range(30):
                sx = cx + random.randint(-150, 150)
                sy = cy + random.randint(-100, 100)
                s_start = start_ms + random.randint(0, dur)
                s_end = s_start + random.randint(300, 600)
                s_size = random.randint(8, 18)
                fade_mid = (s_end - s_start) // 2
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({sx},{sy})\\fscx{s_size}\\fscy{s_size}\\1c&HFFFF00&\\blur3"
                    f"\\t(0,{fade_mid},\\alpha&H00&)\\t({fade_mid},{s_end - s_start},\\alpha&HFF&)\\frz0\\t(\\frz360)}}?"
                )

            for i in range(5):
                breeze_y = cy + (i - 2) * 30
                br_start = start_ms + i * (dur // 5)
                br_end = br_start + 600
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(br_start)},{self._ms_to_timestamp(br_end)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx},{breeze_y})\\fscx250\\fscy10\\1c&H00FF00&\\alpha&HD0&\\blur12\\t(\\fscx350\\alpha&HFF&)}}~"
                )
        return "\n".join(lines)

    def _render_neon_pulse(self) -> str:
        """Simple neon-style pulse."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            mid = dur // 2
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            anim = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(50,50){anim}}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_kinetic_bounce(self) -> str:
        """Bounce-in with squash/stretch."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\move({cx},{cy-100},{cx},{cy},0,150)\\t(150,250,\\fscx120\\fscy80)\\t(250,400,\\fscx100\\fscy100)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_cinematic_blur(self) -> str:
        """Blur in/out around timing window."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\blur20\\t(0,150,\\blur0)\\t({max(dur-150,0)},{dur},\\blur20)\\fad(100,100)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_typewriter_pro(self) -> str:
        """Rotate-in typewriter effect."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\frz90\\t(0,100,\\frz0)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_word_pop(self) -> str:
        """Scale pop per word."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,80,\\fscx110\\fscy110)\\t(80,150,\\fscx100\\fscy100)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_retro_arcade(self) -> str:
        """Static retro placeholder."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_news_ticker(self) -> str:
        """Slide-up ticker feel."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\move({cx},{cy+20},{cx},{cy},0,100)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_tiktok_group(self) -> str:
        """Previous/current/next grouped emphasis."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        words = self.words
        for i, word in enumerate(words):
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            parts = []
            if i > 0:
                prev = (words[i - 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
                parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{prev}")
            curr = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\alpha&H00&\\fscx120\\fscy120\\1c&HFFFF00&\\blur3}}{curr}")
            if i < len(words) - 1:
                nxt = (words[i + 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
                parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{nxt}")
            full = " ".join(parts)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full}"
            )
        return "\n".join(lines)

    def _render_spin_3d(self) -> str:
        """Simple 3D spin using rotations."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\frx10\\fry20\\frz0\\t(0,{dur//2},\\frz360)\\t({dur//2},{dur},\\frz720)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_shear_force(self) -> str:
        """Sheared text with slight shake."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fax-0.3\\t(0,200,\\fax0.1)\\t(200,400,\\fax-0.1)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_double_shadow(self) -> str:
        """Primary text plus two shadow copies."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            # Shadow layers
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx+3},{cy+3})\\1c&H000000&\\alpha&H80&\\blur3}}{safe_text}"
            )
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx-3},{cy-3})\\1c&H808080&\\alpha&H80&\\blur3}}{safe_text}"
            )
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_karaoke_classic(self) -> str:
        """Current word bright, neighbors dimmed."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        words = self.words
        for i, word in enumerate(words):
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            parts = []
            if i > 0:
                prev = (words[i - 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
                parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{prev}")
            curr = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\alpha&H00&\\fscx130\\fscy130\\1c&HFFFF00&\\blur4}}{curr}")
            if i < len(words) - 1:
                nxt = (words[i + 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
                parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{nxt}")
            full = " ".join(parts)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full}"
            )
        return "\n".join(lines)

    def _render_karaoke_pro(self) -> str:
        """Past/future colorization with scale bump on current."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        words = self.words
        color_past = self.style.get("color_past", "&H00808080")
        color_future = self.style.get("color_future", "&H00808080")
        outline_past = self.style.get("outline_past", "&H00000000")
        outline_future = self.style.get("outline_future", "&H00000000")

        for i, word in enumerate(words):
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            line_parts = []
            for w_idx, w in enumerate(words):
                txt = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                if w_idx < i:
                    style = f"\\1c{hex_to_ass(color_past)}\\3c{hex_to_ass(outline_past)}"
                elif w_idx == i:
                    style = f"\\1c{hex_to_ass(self.style.get('primary_color', '&H00FFFFFF'))}\\3c{hex_to_ass(self.style.get('outline_color', '&H00000000'))}\\t(0,100,\\fscx115\\fscy115)\\t(100,{dur},\\fscx100\\fscy100)"
                else:
                    style = f"\\1c{hex_to_ass(color_future)}\\3c{hex_to_ass(outline_future)}"
                line_parts.append(f"{{{style}}}{txt}")
            full = " ".join(line_parts)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})}}{full}"
            )
        return "\n".join(lines)

    def _render_karaoke_sentence(self) -> str:
        """Group into short sentences (3 words) with fade."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        group_len = 3
        for g in range(0, len(self.words), group_len):
            group = self.words[g:g + group_len]
            if not group:
                continue
            start_ms = int(group[0].get("start", 0) * 1000)
            end_ms = int(group[-1].get("end", start_ms / 1000) * 1000)
            text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in group])
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(150,150)}}{text}"
            )
        return "\n".join(lines)

    def _render_dynamic_highlight(self) -> str:
        """Highlight current word using secondary color, neighbors normal."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        words = self.words
        primary = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        secondary = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        for i, word in enumerate(words):
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            parts = []
            if i > 0:
                prev_txt = (words[i - 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
                parts.append(f"{{\\1c{primary}}}{prev_txt}")
            current = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(
                f"{{\\1c{primary}\\t(0,150,\\1c{secondary})\\t({max(end_ms-start_ms-150,0)},{end_ms-start_ms},\\1c{primary})}}{current}"
            )
            if i < len(words) - 1:
                next_txt = (words[i + 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
                parts.append(f"{{\\1c{primary}}}{next_txt}")
            full = " ".join(parts)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full}"
            )
        return "\n".join(lines)

    def _render_tiktok_box_group(self) -> str:
        """Grouped rounded box around current word."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        char_width = 32
        for i, word in enumerate(self.words):
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            text_width = len(text) * char_width
            box_w = text_width + 80
            box_h = 100
            radius = 18
            box_shape = (
                f"m {radius} 0 l {box_w-radius} 0 b {box_w} 0 {box_w} {radius} {box_w} {radius} "
                f"l {box_w} {box_h-radius} b {box_w} {box_h} {box_w-radius} {box_h} {box_w-radius} {box_h} "
                f"l {radius} {box_h} b 0 {box_h} 0 {box_h-radius} 0 {box_h-radius} l 0 {radius} b 0 0 {radius} 0 {radius} 0"
            )
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\p1\\1c&H00FFFF&\\alpha&H30&\\blur2\\fscx100\\fscy100"
                f"\\t(0,150,\\fscx105\\fscy105)\\t(150,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}"
            )
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&H000000&\\b1\\fscx110\\fscy110"
                f"\\t(0,150,\\fscx120\\fscy120)\\t(150,{dur},\\fscx110\\fscy110)}}{text}"
            )
        return "\n".join(lines)

    def _render_sakura_dream(self) -> str:
        """Petal drift with soft glow."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        petal_shape = "m 0 0 b 10 -5 20 -5 30 0 b 20 5 10 5 0 0"
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&H00FF69B4&\\blur4\\fad(150,150)}}{safe_text}"
            )
            for _ in range(20):
                px = cx + random.randint(-150, 150)
                py = cy - random.randint(50, 150)
                py_end = py + random.randint(120, 220)
                p_start = start_ms + random.randint(0, dur)
                p_end = p_start + random.randint(800, 1400)
                size = random.randint(20, 40)
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({px},{py},{px + random.randint(-40,40)},{py_end})\\fscx{size}\\fscy{size}"
                    f"\\1c&H00FFC0CB&\\blur6\\frz{random.randint(0,360)}\\t(\\frz{random.randint(360,720)})\\fad(0,200)\\p1}}"
                    f"{petal_shape}{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_phoenix_flames(self) -> str:
        """Rising flame particles."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        flame_shape = "m 0 0 b 5 -10 10 -10 15 0 b 10 15 5 15 0 0"
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&H0000FF&\\bord2\\3c&H00FFFF00&\\blur1}}{safe_text}"
            )
            for _ in range(18):
                sx = cx + random.randint(-80, 80)
                sy = cy + random.randint(-20, 20)
                ex = sx + random.randint(-30, 30)
                ey = sy - random.randint(120, 200)
                f_start = start_ms + random.randint(0, dur)
                f_end = f_start + random.randint(700, 1200)
                size = random.randint(20, 50)
                color = hex_to_ass(random.choice(["&H00FF8800&", "&H00FFAA00&", "&H00FF4500&"]))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(f_start)},{self._ms_to_timestamp(f_end)},Default,,0,0,0,,"
                    f"{{\\an5\\move({sx},{sy},{ex},{ey})\\fscx{size}\\fscy{size}\\1c{color}\\blur4\\fad(0,200)\\p1}}"
                    f"{flame_shape}{{\\p0}}"
                )
        return "\n".join(lines)

    def _render_welcome_my_life(self) -> str:
        """Bold pop-in."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        for word in self.words:
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fscx0\\fscy0\\t(0,200,\\fscx110\\fscy110)\\t(200,{dur},\\fscx100\\fscy100)\\fad(100,100)}}{safe_text}"
            )
        return "\n".join(lines)

    def _render_mademyday(self) -> str:
        """Highlight active word with slight scale bump."""
        lines = [self.render_ass_header()]
        cx, cy = self._get_center_coordinates()
        words = self.words
        active_scale = 1.12
        for i, word in enumerate(words):
            start_ms = int(word.get("start", 0) * 1000)
            end_ms = int(word.get("end", start_ms / 1000) * 1000)
            dur = max(1, end_ms - start_ms)
            parts = []
            for w_idx, w in enumerate(words[max(0, i-1):min(len(words), i+2)]):
                real_idx = max(0, i-1) + w_idx
                txt = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                if real_idx == i:
                    parts.append(f"{{\\t(0,{dur//2},\\fscx{int(active_scale*100)}\\fscy{int(active_scale*100)})\\t({dur//2},{dur},\\fscx100\\fscy100)}}{txt}")
                else:
                    parts.append(f"{{\\alpha&H55&}}{txt}")
            full = " ".join(parts)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full}"
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
