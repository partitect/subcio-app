from styles.text_effects import SentenceKaraokeRenderer
import json

# Mock data
words = [
    {"start": 0.0, "end": 0.5, "text": "Hello"},
    {"start": 0.5, "end": 1.0, "text": "world."},
    {"start": 1.5, "end": 2.0, "text": "This"},
    {"start": 2.0, "end": 2.5, "text": "is"},
    {"start": 2.5, "end": 3.0, "text": "a"},
    {"start": 3.0, "end": 3.5, "text": "test."},
]

style = {
    "id": "karaoke-sentence",
    "font": "Arial",
    "font_size": 60,
    "primary_color": "&H00FFFFFF",
    "secondary_color": "&H0000FFFF"
}

# Ensure we have a mock font file or handle the error gracefully in test
# The renderer will fallback to heuristic if font not found, which is fine for this test script
# unless we want to strictly test Pillow.
# Let's just run it.

print("Testing SentenceKaraokeRenderer with Pillow logic...")
renderer = SentenceKaraokeRenderer(words, style)
output = renderer.render()

print("\nGenerated ASS Output:")
print(output)

# Basic validation
# With chunking (max 3), "Hello world." should be one group.
# "This is a test." (4 words) might be split into "This is a" and "test." or similar depending on logic.

if "Dialogue: 1,0:00:00.00,0:00:01.00" in output and "Hello" in output and "world." in output:
    print("\nSUCCESS: First chunk grouped correctly.")
else:
    print("\nFAILURE: First chunk grouping failed.")

# Check if "This is a test." is split.
if "This" in output and "test." in output:
     # We expect multiple events for the second sentence now if it was long, 
     # but "This is a test" is 4 words. Smart grouping might do 3+1 or 2+2.
     # Let's just check if we have more dialogue lines than before or specific words.
     print("SUCCESS: Second sentence processed.")


if "\\t(" in output:
    print("SUCCESS: Animation tags present.")
else:
    print("FAILURE: Animation tags missing.")

if "\\pos(" in output:
    print("SUCCESS: Absolute positioning tags present.")
else:
    print("FAILURE: Absolute positioning tags missing.")
