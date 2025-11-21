import math
import random
from typing import List, Dict

def ms_to_ass(ms: int) -> str:
    """Converts milliseconds to ASS timestamp format H:MM:SS.cc"""
    s = ms / 1000.0
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    cs = int((s - int(s)) * 100)
    return f"{h}:{m:02d}:{sec:02d}.{cs:02d}"

def hex_to_ass(val: str) -> str:
    """Converts #RRGGBB to ASS &H00BBGGRR format."""
    if not val: return "&H00FFFFFF"
    if val.startswith("&H"): return val
    val = val.lstrip("#")
    if len(val) == 6:
        r, g, b = val[0:2], val[2:4], val[4:6]
        return f"&H00{b}{g}{r}" # Note BGR order
    return "&H00FFFFFF"

class AdvancedRenderer:
    def __init__(self, words: List[Dict], style: Dict):
        self.words = words
        self.style = style
        self.header = self._build_header()
        
    def _build_header(self) -> str:
        font = (self.style.get("font") or "Inter").split(",")[0].strip()
        primary = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        outline = hex_to_ass(self.style.get("outline_color", "&H00000000"))
        font_size = self.style.get("font_size", 60)
        
        return f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default, {font}, {font_size}, {primary}, &H000000FF, {outline}, &H00000000, -1, 0, 0, 0, 100, 100, 0, 0, 1, 2, 0, 5, 10, 10, 10, 1
"""

    def render(self) -> str:
        preset_id = self.style.get("id", "word-pop")
        method_name = f"render_{preset_id.replace('-', '_')}"
        
        if hasattr(self, method_name):
            return getattr(self, method_name)()
        else:
            return self.render_word_pop() # Fallback

    def _base_loop(self, effect_func):
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        
        # Calculate position based on alignment
        # Alignment: 2 = Bottom, 8 = Top, 5 = Center
        alignment = int(self.style.get("alignment", 2))
        
        # Screen dimensions (PlayResY = 1080)
        screen_h = 1080
        cx = 1920 // 2
        
        # Determine Y position (cy)
        if alignment == 8: # Top
            cy = 150 # Near top
        elif alignment == 5: # Center
            cy = screen_h // 2
        else: # Bottom (2) or default
            cy = screen_h - 150 # Near bottom (default 930)

        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            duration = end_ms - start_ms
            
            # Call the specific effect function with dynamic position
            new_lines = effect_func(word, start_ms, end_ms, duration, cx, cy)
            lines.extend(new_lines)
        return self.header + "\n".join(lines)

    # --- 1. Fire Storm ---
    def render_fire_storm(self) -> str:
        star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main Text
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)\\blur5\\t(0,{dur},\\fscx110\\fscy110\\blur10)}}{word['text']}")
            
            # Particles
            for _ in range(12):
                angle = random.uniform(0, 360)
                speed = random.uniform(30, 120)
                sx = cx + random.uniform(-40, 40)
                sy = cy + random.uniform(-10, 10)
                ex = sx + math.cos(math.radians(angle)) * speed
                ey = sy + math.sin(math.radians(angle)) * speed
                p_start = start + random.randint(0, max(0, dur - 200))
                p_end = p_start + random.randint(300, 600)
                color = random.choice(["&H0000FF&", "&H00FFFF&", "&HFFFFFF&"])
                
                res.append(f"Dialogue: 0,{ms_to_ass(p_start)},{ms_to_ass(p_end)},Default,,0,0,0,,{{\\an5\\move({int(sx)},{int(sy)},{int(ex)},{int(ey)})\\fad(0,200)\\blur2\\1c{color}\\bord0\\p1\\t(\\fscx0\\fscy0)}}{star_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 2. Cyber Glitch ---
    def render_cyber_glitch(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            # RGB Split Layers
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx-3},{cy})\\1c&H0000FF&\\t(\\pos({cx+3},{cy}))}}{word['text']}")
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx+3},{cy})\\1c&HFF0000&\\t(\\pos({cx-3},{cy}))}}{word['text']}")
            
            # Jittery Main Layer
            jitter = ""
            curr = 0
            while curr < dur:
                step = random.randint(40, 90)
                sc = random.randint(90, 110)
                jitter += f"\\t({curr},{curr+step},\\fscx{sc}\\fscy{sc})"
                curr += step
            res.append(f"Dialogue: 2,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy}){jitter}}}{word['text']}")
            return res
        return self._base_loop(effect)

    # --- 3. Neon Pulse ---
    def render_neon_pulse(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Pulse up and down
            mid = dur // 2
            anim = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){anim}}}{word['text']}"]
        return self._base_loop(effect)

    # --- 4. Kinetic Bounce ---
    def render_kinetic_bounce(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Drop from top, bounce
            # Start high, hit Cy, squash, recover
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy-100},{cx},{cy},0,150)\\t(150,250,\\fscx120\\fscy80)\\t(250,400,\\fscx100\\fscy100)}}{word['text']}"]
        return self._base_loop(effect)

    # --- 5. Cinematic Blur ---
    def render_cinematic_blur(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Blur in, sharp, blur out
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\blur20\\t(0,150,\\blur0)\\t({dur-150},{dur},\\blur20)\\fad(100,100)}}{word['text']}"]
        return self._base_loop(effect)

    # --- 6. Thunder Strike ---
    def render_thunder_strike(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Flash border color
            flash = f"\\t(0,50,\\3c&HFFFFFF&)\\t(50,100,\\3c&H000000&)\\t(100,150,\\3c&HFFFFFF&)\\t(150,200,\\3c&H000000&)"
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){flash}\\fscx110\\fscy110}}{word['text']}"]
        return self._base_loop(effect)

    # --- 7. Typewriter Pro ---
    def render_typewriter_pro(self) -> str:
        # This is tricky in word-based, but we can simulate by just appearing abruptly
        # or using \clip to reveal. Let's use a simple pop-in per word for now as "word-writer"
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\frz90\\t(0,100,\\frz0)}}{word['text']}"]
        return self._base_loop(effect)

    # --- 8. Rainbow Wave ---
    def render_rainbow_wave(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Cycle colors: Red -> Green -> Blue -> Red
            rainbow = "\\t(0,33,\\1c&H00FF00&)\\t(33,66,\\1c&HFF0000&)\\t(66,100,\\1c&H0000FF&)"
            # Note: ASS color interpolation is linear, so this is approximate
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){rainbow}}}{word['text']}"]
        return self._base_loop(effect)

    # --- 9. Earthquake Shake ---
    def render_earthquake_shake(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Violent rotation shake
            shake = ""
            curr = 0
            while curr < dur:
                angle = random.randint(-5, 5)
                step = 40
                shake += f"\\t({curr},{curr+step},\\frz{angle})"
                curr += step
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy}){shake}}}{word['text']}"]
        return self._base_loop(effect)

    # --- 10. Word Pop (Default/Clean) ---
    def render_word_pop(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Simple clean pop
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,80,\\fscx110\\fscy110)\\t(80,150,\\fscx100\\fscy100)}}{word['text']}"]
        return self._base_loop(effect)

    # --- 11. Retro Arcade ---
    def render_retro_arcade(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Instant appearance, no fade, maybe a blink at end
            # Green text, pixel font assumed
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})}}{word['text']}"]
        return self._base_loop(effect)

    # --- 12. Horror Creepy ---
    def render_horror_creepy(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Shaky, red, blur in
            shake = ""
            curr = 0
            while curr < dur:
                ox = random.randint(-2, 2)
                oy = random.randint(-2, 2)
                shake += f"\\t({curr},{curr+50},\\fscx{random.randint(95,105)}\\fscy{random.randint(95,105)}\\pos({cx+ox},{cy+oy}))"
                curr += 50
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\blur3\\t(0,200,\\blur0){shake}}}{word['text']}"]
        return self._base_loop(effect)

    # --- 13. Luxury Gold ---
    def render_luxury_gold(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Elegant fade in, slight scale up, gold color (handled by style prop mostly)
            # We add a shine effect using clip or just a highlight color transform
            shine = "\\t(0,100,\\1c&HFFFFFF&)\\t(100,300,\\1c&H00D7FF&)" # White to Gold
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100){shine}}}{word['text']}"]
        return self._base_loop(effect)

    # --- 14. Comic Book ---
    def render_comic_book(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Pop in with rotation, thick border
            rot = random.randint(-5, 5)
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\frz{rot}\\fscx50\\fscy50\\t(0,100,\\fscx110\\fscy110)\\t(100,150,\\fscx100\\fscy100)}}{word['text']}"]
        return self._base_loop(effect)

    # --- 15. News Ticker ---
    def render_news_ticker(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            # Typewriter style or just simple appear with a background box
            # ASS doesn't support auto-background box easily without drawing shapes.
            # We will just do a clean slide up.
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy+20},{cx},{cy},0,100)}}{word['text']}"]
        return self._base_loop(effect)
