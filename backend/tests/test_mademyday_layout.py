from pathlib import Path
import re
import sys
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.styles.text_effects import MadeMyDayRenderer


class MadeMyDayLayoutTest(unittest.TestCase):
    def test_positions_do_not_overlap_with_stub_widths(self):
        # Fixed widths ensure deterministic layout calculation
        mock_width = 120
        font_size = 60
        words = [
            {"text": "ŞARKIYI", "start": 0.0, "end": 1.0},
            {"text": "ANLATTIM", "start": 1.0, "end": 2.0},
            {"text": "BUGÜN", "start": 2.0, "end": 3.0},
        ]
        style = {
            "font": "Nunito",
            "font_size": font_size,
            "primary_color": "&H00FFFFFF",
            "secondary_color": "&H0000FFFF",
        }

        with mock.patch("backend.styles.text_effects.get_text_width", return_value=mock_width):
            renderer = MadeMyDayRenderer(words, style)
            content = renderer.render()

        dialogues = [line for line in content.splitlines() if line.startswith("Dialogue: 1")]
        self.assertEqual(len(dialogues), 3, "Should render one dialogue line per word")

        positions = []
        for line in dialogues:
            m = re.search(r"\\pos\(([-\d]+),([-\d]+)\)", line)
            self.assertIsNotNone(m, "Each dialogue must include a position")
            positions.append(int(m.group(1)))

        positions_sorted = sorted(positions)

        # Validate that centers are separated enough to avoid overlap
        min_gap = int(font_size * 1.0)
        for a, b in zip(positions_sorted, positions_sorted[1:]):
            self.assertGreaterEqual(b - a, min_gap, "Words should not visually overlap")


if __name__ == "__main__":
    unittest.main()
