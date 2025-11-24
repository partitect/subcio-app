from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.styles.text_effects import resolve_font


class FontResolutionTest(unittest.TestCase):
    def test_resolve_font_matches_common_names(self):
        fonts_dir = Path(__file__).resolve().parent.parent / "fonts"
        sample_fonts = [
            "Loved by the King",  # file has -Regular suffix
            "Luckiest Guy",       # compound words without spaces in filename
            "Rubik Wet Paint",    # contains spaces
            "Nunito",             # simple single-word font
        ]

        for name in sample_fonts:
            path, display = resolve_font(fonts_dir, name)
            self.assertTrue(path, f"Font path should resolve for {name}")
            self.assertTrue(Path(path).exists(), f"Resolved path for {name} must exist")
            self.assertTrue(display, "Display name should not be empty")


if __name__ == "__main__":
    unittest.main()
