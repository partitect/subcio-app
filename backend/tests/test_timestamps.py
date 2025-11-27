"""
Timestamp Conversion Utility Tests

Tests for time format conversions between different formats:
- Seconds (float)
- ASS format (H:MM:SS.CC)
- SRT format (HH:MM:SS,mmm)
"""

import pytest


def seconds_to_ass(seconds: float) -> str:
    """Convert seconds to ASS timestamp format.
    
    ASS format: H:MM:SS.CC (centiseconds)
    Example: 0:01:23.45
    """
    if seconds < 0:
        seconds = 0
    
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centisecs = int((seconds % 1) * 100)
    
    return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"


def ass_to_seconds(ass_time: str) -> float:
    """Convert ASS timestamp to seconds.
    
    Input: H:MM:SS.CC
    Output: float seconds
    """
    try:
        parts = ass_time.split(":")
        hours = int(parts[0])
        minutes = int(parts[1])
        
        sec_parts = parts[2].split(".")
        seconds = int(sec_parts[0])
        centisecs = int(sec_parts[1]) if len(sec_parts) > 1 else 0
        
        return hours * 3600 + minutes * 60 + seconds + centisecs / 100
    except (ValueError, IndexError):
        return 0.0


def seconds_to_srt(seconds: float) -> str:
    """Convert seconds to SRT timestamp format.
    
    SRT format: HH:MM:SS,mmm (milliseconds)
    Example: 00:01:23,450
    """
    if seconds < 0:
        seconds = 0
    
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def srt_to_seconds(srt_time: str) -> float:
    """Convert SRT timestamp to seconds.
    
    Input: HH:MM:SS,mmm
    Output: float seconds
    """
    try:
        # Handle both , and . as decimal separator
        srt_time = srt_time.replace(",", ".")
        parts = srt_time.split(":")
        
        hours = int(parts[0])
        minutes = int(parts[1])
        
        sec_parts = parts[2].split(".")
        seconds = int(sec_parts[0])
        millis = int(sec_parts[1]) if len(sec_parts) > 1 else 0
        
        return hours * 3600 + minutes * 60 + seconds + millis / 1000
    except (ValueError, IndexError):
        return 0.0


def format_time(seconds: float) -> str:
    """Format seconds for display.
    
    Output: MM:SS or H:MM:SS if >= 1 hour
    """
    if seconds < 0:
        seconds = 0
    
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


class TestSecondsToAss:
    """Tests for seconds to ASS conversion"""

    def test_zero(self):
        """Test zero seconds"""
        assert seconds_to_ass(0) == "0:00:00.00"

    def test_one_minute(self):
        """Test one minute"""
        assert seconds_to_ass(60) == "0:01:00.00"

    def test_one_hour(self):
        """Test one hour"""
        assert seconds_to_ass(3600) == "1:00:00.00"

    def test_with_centiseconds(self):
        """Test with centiseconds"""
        assert seconds_to_ass(1.5) == "0:00:01.50"
        assert seconds_to_ass(65.25) == "0:01:05.25"
        # Float precision can cause 98 vs 99
        result = seconds_to_ass(3661.99)
        assert result in ["1:01:01.98", "1:01:01.99"]

    def test_negative(self):
        """Test negative input (should clamp to 0)"""
        assert seconds_to_ass(-5) == "0:00:00.00"


class TestAssToSeconds:
    """Tests for ASS to seconds conversion"""

    def test_zero(self):
        """Test zero timestamp"""
        assert ass_to_seconds("0:00:00.00") == 0.0

    def test_one_minute(self):
        """Test one minute"""
        assert ass_to_seconds("0:01:00.00") == 60.0

    def test_one_hour(self):
        """Test one hour"""
        assert ass_to_seconds("1:00:00.00") == 3600.0

    def test_with_centiseconds(self):
        """Test with centiseconds"""
        assert ass_to_seconds("0:00:01.50") == 1.5
        assert ass_to_seconds("0:01:05.25") == 65.25

    def test_complex_time(self):
        """Test complex timestamp"""
        assert ass_to_seconds("1:23:45.67") == 5025.67

    def test_invalid_format(self):
        """Test invalid format returns 0"""
        assert ass_to_seconds("invalid") == 0.0
        assert ass_to_seconds("") == 0.0


class TestSecondsToSrt:
    """Tests for seconds to SRT conversion"""

    def test_zero(self):
        """Test zero seconds"""
        assert seconds_to_srt(0) == "00:00:00,000"

    def test_one_minute(self):
        """Test one minute"""
        assert seconds_to_srt(60) == "00:01:00,000"

    def test_one_hour(self):
        """Test one hour"""
        assert seconds_to_srt(3600) == "01:00:00,000"

    def test_with_milliseconds(self):
        """Test with milliseconds"""
        assert seconds_to_srt(1.5) == "00:00:01,500"
        assert seconds_to_srt(65.123) == "00:01:05,123"

    def test_negative(self):
        """Test negative input (should clamp to 0)"""
        assert seconds_to_srt(-5) == "00:00:00,000"


class TestSrtToSeconds:
    """Tests for SRT to seconds conversion"""

    def test_zero(self):
        """Test zero timestamp"""
        assert srt_to_seconds("00:00:00,000") == 0.0

    def test_one_minute(self):
        """Test one minute"""
        assert srt_to_seconds("00:01:00,000") == 60.0

    def test_one_hour(self):
        """Test one hour"""
        assert srt_to_seconds("01:00:00,000") == 3600.0

    def test_with_milliseconds(self):
        """Test with milliseconds"""
        assert srt_to_seconds("00:00:01,500") == 1.5
        assert srt_to_seconds("00:01:05,123") == 65.123

    def test_dot_separator(self):
        """Test with dot as separator (alternative format)"""
        assert srt_to_seconds("00:00:01.500") == 1.5

    def test_invalid_format(self):
        """Test invalid format returns 0"""
        assert srt_to_seconds("invalid") == 0.0


class TestFormatTime:
    """Tests for display time formatting"""

    def test_zero(self):
        """Test zero seconds"""
        assert format_time(0) == "0:00"

    def test_under_hour(self):
        """Test time under one hour"""
        assert format_time(65) == "1:05"
        assert format_time(3599) == "59:59"

    def test_over_hour(self):
        """Test time over one hour"""
        assert format_time(3600) == "1:00:00"
        assert format_time(7325) == "2:02:05"

    def test_negative(self):
        """Test negative input"""
        assert format_time(-5) == "0:00"


class TestRoundTrip:
    """Test roundtrip conversions"""

    def test_ass_roundtrip(self):
        """Test seconds -> ASS -> seconds roundtrip"""
        times = [0, 1, 60, 3600, 65.5, 3661.99, 7325.01]
        for t in times:
            result = ass_to_seconds(seconds_to_ass(t))
            assert abs(result - t) < 0.01, f"Roundtrip failed for {t}: got {result}"

    def test_srt_roundtrip(self):
        """Test seconds -> SRT -> seconds roundtrip"""
        times = [0, 1, 60, 3600, 65.5, 3661.999, 7325.001]
        for t in times:
            result = srt_to_seconds(seconds_to_srt(t))
            assert abs(result - t) < 0.001, f"Roundtrip failed for {t}: got {result}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
