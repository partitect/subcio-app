"""
Color Conversion Utility Tests

Tests for ASS <-> HEX color conversions
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Test color conversion functions
# These should match the frontend implementations


def ass_to_hex(ass_color: str) -> str:
    """Convert ASS color format to HEX.
    
    ASS format: &HBBGGRR or &HBBGGRR& or &HAABBGGRR
    Output: #RRGGBB
    """
    if not ass_color:
        return "#ffffff"
    
    # Remove & and H prefixes
    clean = ass_color.replace("&", "").replace("H", "").lstrip("0")
    
    # Handle different lengths
    if len(clean) == 0:
        return "#000000"
    elif len(clean) <= 6:
        clean = clean.zfill(6)
        # BGR -> RGB
        b, g, r = clean[0:2], clean[2:4], clean[4:6]
        return f"#{r}{g}{b}"
    else:
        # AABBGGRR format
        clean = clean.zfill(8)
        a, b, g, r = clean[0:2], clean[2:4], clean[4:6], clean[6:8]
        return f"#{r}{g}{b}"


def hex_to_ass(hex_color: str) -> str:
    """Convert HEX color to ASS format.
    
    Input: #RRGGBB or #RGB
    Output: &HBBGGRR
    """
    if not hex_color:
        return "&HFFFFFF"
    
    # Remove # prefix
    clean = hex_color.lstrip("#")
    
    # Expand short format
    if len(clean) == 3:
        clean = "".join([c * 2 for c in clean])
    
    if len(clean) != 6:
        return "&HFFFFFF"
    
    r, g, b = clean[0:2], clean[2:4], clean[4:6]
    return f"&H{b}{g}{r}".upper()


class TestAssToHex:
    """Tests for ASS to HEX conversion"""

    def test_basic_white(self):
        """Test white color conversion"""
        assert ass_to_hex("&HFFFFFF").lower() == "#ffffff"
        assert ass_to_hex("&HFFFFFF&").lower() == "#ffffff"

    def test_basic_black(self):
        """Test black color conversion"""
        assert ass_to_hex("&H000000") == "#000000"
        assert ass_to_hex("&H00000000") == "#000000"

    def test_primary_colors(self):
        """Test primary color conversions"""
        # ASS BGR -> HEX RGB
        assert ass_to_hex("&HFF0000").lower() == "#0000ff"  # Blue in ASS -> Blue in HEX
        assert ass_to_hex("&H00FF00").lower() == "#00ff00"  # Green
        assert ass_to_hex("&H0000FF").lower() == "#ff0000"  # Red in ASS (BGR) -> Red in HEX

    def test_with_alpha(self):
        """Test color with alpha channel"""
        # AABBGGRR format
        assert ass_to_hex("&H00FFFFFF").lower() == "#ffffff"
        assert ass_to_hex("&H80FF0000").lower() == "#0000ff"

    def test_empty_input(self):
        """Test empty input handling"""
        assert ass_to_hex("") == "#ffffff"
        assert ass_to_hex(None) == "#ffffff"

    def test_short_format(self):
        """Test short format handling"""
        # Short formats get padded - result depends on implementation
        result = ass_to_hex("&HFFF")
        assert result.startswith("#") and len(result) == 7


class TestHexToAss:
    """Tests for HEX to ASS conversion"""

    def test_basic_white(self):
        """Test white color conversion"""
        assert hex_to_ass("#ffffff") == "&HFFFFFF"
        assert hex_to_ass("#FFFFFF") == "&HFFFFFF"

    def test_basic_black(self):
        """Test black color conversion"""
        assert hex_to_ass("#000000") == "&H000000"

    def test_primary_colors(self):
        """Test primary color conversions"""
        assert hex_to_ass("#ff0000") == "&H0000FF"  # Red HEX -> Red ASS (BGR)
        assert hex_to_ass("#00ff00") == "&H00FF00"  # Green
        assert hex_to_ass("#0000ff") == "&HFF0000"  # Blue HEX -> Blue ASS

    def test_short_format(self):
        """Test short HEX format (#RGB)"""
        assert hex_to_ass("#fff") == "&HFFFFFF"
        assert hex_to_ass("#f00") == "&H0000FF"
        assert hex_to_ass("#0f0") == "&H00FF00"

    def test_empty_input(self):
        """Test empty input handling"""
        assert hex_to_ass("") == "&HFFFFFF"
        assert hex_to_ass(None) == "&HFFFFFF"

    def test_without_hash(self):
        """Test input without # prefix"""
        assert hex_to_ass("ffffff") == "&HFFFFFF"


class TestRoundTrip:
    """Test roundtrip conversions"""

    def test_hex_roundtrip(self):
        """Test HEX -> ASS -> HEX roundtrip"""
        colors = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#abcdef"]
        for color in colors:
            result = ass_to_hex(hex_to_ass(color))
            assert result.lower() == color.lower(), f"Roundtrip failed for {color}: got {result}"

    def test_ass_roundtrip(self):
        """Test ASS -> HEX -> ASS roundtrip"""
        colors = ["&HFFFFFF", "&H000000", "&HFF0000", "&H00FF00", "&H0000FF"]
        for color in colors:
            result = hex_to_ass(ass_to_hex(color))
            assert result.upper() == color.upper(), f"Roundtrip failed for {color}: got {result}"


class TestCssColor:
    """Test CSS color conversion"""

    def test_ass_to_css(self):
        """Test converting ASS to CSS rgba format"""
        def ass_to_css_color(ass_color: str, alpha: int = 100) -> str:
            """Convert ASS color to CSS rgba"""
            hex_color = ass_to_hex(ass_color)
            r = int(hex_color[1:3], 16)
            g = int(hex_color[3:5], 16)
            b = int(hex_color[5:7], 16)
            a = alpha / 100
            return f"rgba({r}, {g}, {b}, {a})"

        assert ass_to_css_color("&HFFFFFF", 100) == "rgba(255, 255, 255, 1.0)"
        assert ass_to_css_color("&H000000", 50) == "rgba(0, 0, 0, 0.5)"
        assert ass_to_css_color("&H0000FF", 100) == "rgba(255, 0, 0, 1.0)"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
