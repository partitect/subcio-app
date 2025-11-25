"""
PyonFX Effects Integration

This module provides an example of how to integrate PyonFX effects
into the PyCaps subtitle generation engine.

PyonFX is a Python library built on top of Aegisub for advanced subtitle animation.
"""

from typing import Dict, List, Any, Tuple
from pathlib import Path
from ..utils import hex_to_ass
from .pyonfx_render_mixin import PyonFXRenderMixin
from .pyonfx_render_impls import RENDER_DISPATCH


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


class PyonFXRenderer(PyonFXRenderMixin):
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
    
    def render(self) -> str:
        """Render all words with PyonFX effects applied"""
        handler = RENDER_DISPATCH.get(self.effect_type)
        if handler:
            return handler(self)

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
