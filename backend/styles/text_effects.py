from .base import StyleRenderer
from .registry import StyleRegistry
from .utils import ms_to_ass, hex_to_ass
import random

@StyleRegistry.register("tiktok_group")
class TikTokGroupRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            
            text_parts = []
            
            if i > 0:
                prev_word = self.words[i-1]['text']
                text_parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{prev_word}")
            
            curr_word = word['text']
            text_parts.append(f"{{\\alpha&H00&\\fscx120\\fscy120\\1c&HFFFF00&\\blur3}}{curr_word}")
            
            if i < len(self.words) - 1:
                next_word = self.words[i+1]['text']
                text_parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{next_word}")
            
            full_text = " ".join(text_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}")
        
        return self.header + "\n".join(lines)

@StyleRegistry.register("karaoke_classic")
class KaraokeClassicRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            
            text_parts = []
            if i > 0:
                text_parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{self.words[i-1]['text']}")
            text_parts.append(f"{{\\alpha&H00&\\fscx130\\fscy130\\1c&HFFFF00&\\blur4}}{word['text']}")
            if i < len(self.words) - 1:
                text_parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{self.words[i+1]['text']}")
            
            full_text = " ".join(text_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full_text}")
        
        return self.header + "\n".join(lines)

@StyleRegistry.register("karaoke_pro")
class KaraokeProRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
        window_size = 12
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            
            start_idx = max(0, i - window_size // 2)
            end_idx = min(len(self.words), start_idx + window_size)
            
            if end_idx - start_idx < window_size:
                start_idx = max(0, end_idx - window_size)
            
            visible_words = self.words[start_idx:end_idx]
            line_parts = []
            
            for w_idx in range(start_idx, end_idx):
                w = self.words[w_idx]
                w_text = w['text']
                
                if w_idx < i:
                    style = f"{{\\1c{self.color_past}\\3c{self.outline_past}}}"
                elif w_idx == i:
                    p_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
                    o_color = hex_to_ass(self.style.get("outline_color", "&H00000000"))
                    style = f"{{\\1c{p_color}\\3c{o_color}\\t(0,100,\\fscx115\\fscy115)\\t(100,{dur},\\fscx100\\fscy100)}}"
                else:
                    style = f"{{\\1c{self.color_future}\\3c{self.outline_future}}}"
                
                line_parts.append(f"{style}{w_text}")
            
            full_text = " ".join(line_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(0,0)}}{full_text}")
            
        return self.header + "\n".join(lines)

@StyleRegistry.register("dynamic_highlight")
class DynamicHighlightRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
        normal_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        highlight_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        
        min_words = 2
        max_words = 4
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            
            words_before = min(i, max_words - 1)
            words_after = min(len(self.words) - i - 1, max_words - 1)
            
            total_words = 1 + words_before + words_after
            if total_words > max_words:
                excess = total_words - max_words
                if words_after > words_before:
                    words_after -= excess
                else:
                    words_before -= excess
            elif total_words < min_words:
                needed = min_words - total_words
                if i > 0 and words_before < max_words - 1:
                    add_before = min(needed, i - words_before)
                    words_before += add_before
                    needed -= add_before
                if needed > 0 and words_after < max_words - 1:
                    add_after = min(needed, len(self.words) - i - 1 - words_after)
                    words_after += add_after
            
            text_parts = []
            
            for j in range(i - words_before, i):
                if j >= 0:
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            
            transition_time = min(dur, 300)
            current_word_tag = f"{{\\1c{normal_color}\\t(0,{transition_time//2},\\1c{highlight_color})\\t({dur-transition_time//2},{dur},\\1c{normal_color})}}{word['text']}"
            text_parts.append(current_word_tag)
            
            for j in range(i + 1, i + 1 + words_after):
                if j < len(self.words):
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            
            full_text = " ".join(text_parts)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}")
        
        return self.header + "\n".join(lines)

@StyleRegistry.register("tiktok_box_group")
class TikTokBoxGroupRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        screen_w = 1920
        max_line_width = screen_w - 200
        
        active_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        passive_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        box_color = hex_to_ass(self.style.get("active_bg_color", "&H00FFFF00"))
        
        try:
            active_scale = int(self.style.get("active_scale", 110))
        except:
            active_scale = 110
        passive_scale = 90
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            
            words_group = []
            if i > 0:
                words_group.append({'text': self.words[i-1]['text'], 'active': False})
            words_group.append({'text': word['text'], 'active': True})
            if i < len(self.words) - 1:
                words_group.append({'text': self.words[i+1]['text'], 'active': False})
            
            char_width = 55
            spacing = 80
            total_width = sum([len(w['text']) * char_width + spacing for w in words_group])
            
            if total_width > max_line_width:
                line_spacing = 120
                start_y = cy - (len(words_group) - 1) * line_spacing // 2
                
                for idx, w in enumerate(words_group):
                    word_y = start_y + idx * line_spacing
                    word_x = cx
                    
                    if w['active']:
                        text_width = len(w['text']) * char_width
                        box_w = text_width + 60
                        box_h = 100
                        radius = 15
                        box_shape = f"m {radius} 0 l {box_w-radius} 0 b {box_w} 0 {box_w} {radius} {box_w} {radius} l {box_w} {box_h-radius} b {box_w} {box_h} {box_w-radius} {box_h} {box_w-radius} {box_h} l {radius} {box_h} b 0 {box_h} 0 {box_h-radius} 0 {box_h-radius} l 0 {radius} b 0 0 {radius} 0 {radius} 0"
                        
                        if not box_color.startswith("&HFF"):
                            lines.append(f"Dialogue: 0,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{word_y})\\p1\\1c{box_color}\\alpha&H20&\\blur2\\t(0,120,\\fscx105\\fscy105)\\t(120,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}")
                        
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{word_y})\\1c{active_color}\\b1\\fscx{active_scale}\\fscy{active_scale}\\t(0,120,\\fscx{active_scale+10}\\fscy{active_scale+10})\\t(120,{dur},\\fscx{active_scale}\\fscy{active_scale})}}{w['text']}")
                    else:
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{word_y})\\1c{passive_color}\\alpha&H60&\\fscx{passive_scale}\\fscy{passive_scale}}}{w['text']}")
            else:
                start_x = cx - total_width // 2
                current_x = start_x
                
                for w in words_group:
                    word_width = len(w['text']) * char_width
                    word_x = current_x + word_width // 2
                    
                    if w['active']:
                        text_width = len(w['text']) * char_width
                        box_w = text_width + 60
                        box_h = 100
                        radius = 15
                        box_shape = f"m {radius} 0 l {box_w-radius} 0 b {box_w} 0 {box_w} {radius} {box_w} {radius} l {box_w} {box_h-radius} b {box_w} {box_h} {box_w-radius} {box_h} {box_w-radius} {box_h} l {radius} {box_h} b 0 {box_h} 0 {box_h-radius} 0 {box_h-radius} l 0 {radius} b 0 0 {radius} 0 {radius} 0"
                        
                        if not box_color.startswith("&HFF"):
                            lines.append(f"Dialogue: 0,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{cy})\\p1\\1c{box_color}\\alpha&H20&\\blur2\\t(0,120,\\fscx105\\fscy105)\\t(120,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}")
                        
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{cy})\\1c{active_color}\\b1\\fscx{active_scale}\\fscy{active_scale}\\t(0,120,\\fscx{active_scale+10}\\fscy{active_scale+10})\\t(120,{dur},\\fscx{active_scale}\\fscy{active_scale})}}{w['text']}")
                    else:
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{cy})\\1c{passive_color}\\alpha&H60&\\fscx{passive_scale}\\fscy{passive_scale}}}{w['text']}")
                    
                    current_x += word_width + spacing
        
        return self.header + "\n".join(lines)

@StyleRegistry.register("karaoke_sentence")
class SentenceKaraokeRenderer(StyleRenderer):
    def render(self) -> str:
        from .utils import group_words_smart, get_text_width
        from pathlib import Path
        import os
        
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
        # Group words into chunks (2-3 words)
        sentences = group_words_smart(self.words, max_per_group=3, max_gap=1.5)
        
        active_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        passive_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        font_size = int(self.style.get("font_size", 60))
        font_name = self.style.get("font", "Arial")
        
        # Resolve font path
        fonts_dir = Path(__file__).resolve().parent.parent / "fonts"
        font_path = None
        
        # 1. Try exact match
        possible_fonts = list(fonts_dir.glob("*"))
        for f in possible_fonts:
            if f.stem.lower() == font_name.lower():
                font_path = str(f)
                break
        
        # 2. If not found, try to find a default fallback that actually exists
        if not font_path:
            # Try some common ones that might be in the dir
            for fallback in ["black_default.ttf", "komika.ttf", "Roboto-Bold.ttf"]:
                fallback_path = fonts_dir / fallback
                if fallback_path.exists():
                    font_path = str(fallback_path)
                    break
            
            # If still nothing, just pick the first ttf
            if not font_path:
                ttfs = list(fonts_dir.glob("*.ttf"))
                if ttfs:
                    font_path = str(ttfs[0])
        
        print(f"DEBUG: Using font for measurement: {font_path}")

        # Reduce spacing since we have accurate width now
        spacing = int(self.style.get("letter_spacing", 0)) + 20 
        
        for sent in sentences:
            start_ms = int(sent['start'] * 1000)
            end_ms = int(sent['end'] * 1000)
            
            # 1. Calculate total width of the sentence to center it
            total_width = 0
            word_widths = []
            
            for w in sent['words']:
                # Measure width using the resolved font
                # IMPORTANT: Multiply by 1.2 to account for the 115% scaling animation!
                # We reserve space for the MAX size of the word.
                base_width = get_text_width(w['text'], font_path, font_size)
                w_width = int(base_width * 1.2) 
                
                word_widths.append(w_width)
                total_width += w_width
            
            # Add spacing between words
            if len(sent['words']) > 1:
                total_width += (len(sent['words']) - 1) * spacing
            
            # 2. Calculate starting X position
            current_x = cx - (total_width // 2)
            
            # 3. Generate a separate Dialogue line for EACH word
            # This ensures that when one word scales up, it doesn't push others
            
            for i, w in enumerate(sent['words']):
                w_width = word_widths[i]
                # Center of the current word
                word_cx = current_x + (w_width // 2)
                
                w_start = int(w['start'] * 1000)
                w_end = int(w['end'] * 1000)
                
                # Relative times for animation
                rel_start = max(0, w_start - start_ms)
                rel_end = min(end_ms - start_ms, w_end - start_ms)
                
                # Animation: Pop in (50ms), Hold, Pop out (50ms)
                t_in_start = rel_start
                t_in_end = min(rel_start + 80, rel_end)
                
                t_out_start = max(rel_start, w_end - start_ms - 80)
                t_out_end = w_end - start_ms
                
                # Active State tags (Scale up + Color change)
                # Note: We use \an5 (center alignment) so scaling happens from center
                active_tags = f"\\1c{active_color}\\fscx115\\fscy115"
                passive_tags = f"\\1c{passive_color}\\fscx100\\fscy100"
                
                # Construct the text with animation
                # Initial state -> Animate to Active -> Animate back to Passive
                text = (
                    f"{{\\an5\\pos({word_cx},{cy})\\fad(150,150)"
                    f"\\1c{passive_color}"
                    f"\\t({t_in_start},{t_in_end},{active_tags})"
                    f"\\t({t_out_start},{t_out_end},{passive_tags})"
                    f"}}{w['text']}"
                )
                
                lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{text}")
                
                # Advance X position for next word
                current_x += w_width + spacing
            
        return self.header + "\n".join(lines)
