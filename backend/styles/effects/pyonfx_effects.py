"""
PyonFX Effects Integration

This module provides an example of how to integrate PyonFX effects
into the PyCaps subtitle generation engine.

PyonFX is a Python library built on top of Aegisub for advanced subtitle animation.
"""

from typing import Dict, List, Any, Tuple
from pathlib import Path
import math
import re


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


class PyonFXRenderer:
    """
    Renderer for PyonFX effects within ASS subtitle format
    """
    
    EFFECTS = {
        "bulge": BulgeEffect,
        "shake": ShakeEffect,
        "wave": WaveEffect,
        "chromatic": ChromaticAberrationEffect,
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
        else:
            self.effect = effect_class()
    
    def render_ass_header(self) -> str:
        """Generate ASS file header"""
        return """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
Title: PyonFX Effect Subtitle

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,""" + self.style.get("font", "Arial") + f""",{self.style.get("font_size", 64)},{self.style.get("primary_color", "&H00FFFFFF")},&H000000FF,{self.style.get("outline_color", "&H00000000")},{self.style.get("back_color", "&H00000000")},{self.style.get("bold", 1)},{self.style.get("italic", 0)},0,0,100,100,0,0,1,{self.style.get("border", 2)},0,{self.style.get("alignment", 2)},{self.style.get("margin_l", 10)},{self.style.get("margin_r", 10)},{self.style.get("margin_v", 10)},0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    def render(self) -> str:
        """Render all words with PyonFX effects applied"""
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
