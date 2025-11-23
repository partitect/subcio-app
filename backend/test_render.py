from render_engine import AdvancedRenderer
import json

# Mock data
words = [
    {"start": 0.0, "end": 0.5, "text": "Hello"},
    {"start": 0.5, "end": 1.0, "text": "World"},
    {"start": 1.0, "end": 1.5, "text": "This"},
    {"start": 1.5, "end": 2.0, "text": "Is"},
    {"start": 2.0, "end": 2.5, "text": "A"},
    {"start": 2.5, "end": 3.0, "text": "Test"},
]

styles_to_test = [
    "word_pop",
    "fire_storm",
    "tiktok_group",
    "cyber_glitch"
]

print("Starting Render Engine Test...")

for style_id in styles_to_test:
    print(f"\nTesting style: {style_id}")
    style = {
        "id": style_id,
        "font": "Arial",
        "font_size": 60,
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF"
    }
    
    try:
        renderer = AdvancedRenderer(words, style)
        output = renderer.render()
        if output.startswith("[Script Info]"):
            print(f"SUCCESS: {style_id} generated {len(output)} bytes")
        else:
            print(f"FAILURE: {style_id} generated invalid output")
    except Exception as e:
        print(f"ERROR: {style_id} failed with {str(e)}")
        import traceback
        traceback.print_exc()

print("\nTest Complete.")
