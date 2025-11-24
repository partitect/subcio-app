"""
Test script for PyonFX effects integration
"""

from pathlib import Path
import sys
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from styles.effects import (
    PyonFXRenderer,
    PyonFXStyleBuilder,
    create_pyonfx_subtitle,
)


def test_bulge_effect():
    """Test Bulge effect rendering"""
    words = [
        {"start": 0.0, "end": 1.0, "text": "Bulge"},
        {"start": 1.0, "end": 2.0, "text": "Effect"},
        {"start": 2.0, "end": 3.0, "text": "Demo"},
    ]
    
    style = {
        "effect_type": "bulge",
        "font": "Arial",
        "font_size": 72,
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "bold": 1,
        "border": 2,
        "effect_config": {
            "intensity": 1.5,
        }
    }
    
    renderer = PyonFXRenderer(words, style)
    ass_content = renderer.render()
    
    output_path = Path(__file__).parent / "test_bulge_output.ass"
    output_path.write_text(ass_content)
    print(f"✓ Bulge effect test: {output_path}")
    return ass_content


def test_shake_effect():
    """Test Shake effect rendering"""
    words = [
        {"start": 0.0, "end": 1.5, "text": "Shake"},
        {"start": 1.5, "end": 3.0, "text": "Effect"},
    ]
    
    style = {
        "effect_type": "shake",
        "font": "Arial",
        "font_size": 64,
        "primary_color": "&H00FF0000",
        "outline_color": "&H00FFFFFF",
        "bold": 1,
        "border": 3,
        "effect_config": {
            "intensity": 10.0,
            "frequency": 20.0,
        }
    }
    
    renderer = PyonFXRenderer(words, style)
    ass_content = renderer.render()
    
    output_path = Path(__file__).parent / "test_shake_output.ass"
    output_path.write_text(ass_content)
    print(f"✓ Shake effect test: {output_path}")
    return ass_content


def test_wave_effect():
    """Test Wave effect rendering"""
    words = [
        {"start": 0.0, "end": 2.0, "text": "Wave"},
        {"start": 2.0, "end": 4.0, "text": "Animation"},
    ]
    
    style = {
        "effect_type": "wave",
        "font": "Arial",
        "font_size": 60,
        "primary_color": "&H0000FF00",
        "outline_color": "&H00000000",
        "bold": 0,
        "border": 1,
        "effect_config": {
            "amplitude": 30.0,
            "wavelength": 100.0,
        }
    }
    
    renderer = PyonFXRenderer(words, style)
    ass_content = renderer.render()
    
    output_path = Path(__file__).parent / "test_wave_output.ass"
    output_path.write_text(ass_content)
    print(f"✓ Wave effect test: {output_path}")
    return ass_content


def test_chromatic_effect():
    """Test Chromatic Aberration effect rendering"""
    words = [
        {"start": 0.0, "end": 1.5, "text": "Chromatic"},
        {"start": 1.5, "end": 3.0, "text": "Aberration"},
    ]
    
    style = {
        "effect_type": "chromatic",
        "font": "Arial",
        "font_size": 56,
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00FF00FF",
        "bold": 1,
        "border": 2,
        "effect_config": {
            "shift_amount": 4.0,
        }
    }
    
    renderer = PyonFXRenderer(words, style)
    ass_content = renderer.render()
    
    output_path = Path(__file__).parent / "test_chromatic_output.ass"
    output_path.write_text(ass_content)
    print(f"✓ Chromatic effect test: {output_path}")
    return ass_content


def test_style_builder():
    """Test PyonFXStyleBuilder"""
    base_style = {
        "font": "Verdana",
        "font_size": 48,
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "bold": 1,
    }
    
    styles = {
        "bulge": PyonFXStyleBuilder.build_bulge_style(base_style),
        "shake": PyonFXStyleBuilder.build_shake_style(base_style),
        "wave": PyonFXStyleBuilder.build_wave_style(base_style),
        "chromatic": PyonFXStyleBuilder.build_chromatic_style(base_style),
    }
    
    print("✓ Style Builder test: Created styles")
    for effect_type, style in styles.items():
        assert style["effect_type"] == effect_type
        assert "effect_config" in style
        print(f"  - {effect_type}: {json.dumps(style['effect_config'], indent=2)}")
    
    return styles


def test_create_pyonfx_subtitle():
    """Test convenience function"""
    words = [
        {"start": 0.0, "end": 1.0, "text": "Hello"},
        {"start": 1.0, "end": 2.0, "text": "PyonFX"},
    ]
    
    ass_content = create_pyonfx_subtitle(
        words=words,
        effect_type="wave",
        font_name="Arial",
        font_size=80,
    )
    
    output_path = Path(__file__).parent / "test_convenience_output.ass"
    output_path.write_text(ass_content)
    print(f"✓ Convenience function test: {output_path}")
    return ass_content


if __name__ == "__main__":
    print("=" * 50)
    print("PyonFX Effects Integration Tests")
    print("=" * 50)
    
    try:
        test_bulge_effect()
        test_shake_effect()
        test_wave_effect()
        test_chromatic_effect()
        test_style_builder()
        test_create_pyonfx_subtitle()
        
        print("\n" + "=" * 50)
        print("✓ All tests passed!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
