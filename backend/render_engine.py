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
        font = (style.get("font") or "Inter").split(",")[0].strip()
        color_primary = hex_to_ass(style.get("primary_color", "&H00FFFFFF"))
        color_outline = hex_to_ass(style.get("outline_color", "&H00000000"))
        color_back = hex_to_ass(style.get("back_color", "&H00000000"))
        border = style.get("border", 2)
        shadow = style.get("shadow_blur") or style.get("shadow", 0)
        size = style.get("font_size", 48)
        alignment = style.get("alignment", 2)
        italic = style.get("italic", 0)
        bold = style.get("bold", 1)
        border_style = style.get("border_style", 1)
        margin_v = style.get("margin_v", 40)
        
        self.header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{size},{color_primary},&H000000FF,{color_outline},{color_back},{bold},{italic},0,0,100,100,0,0,{border_style},{border},{shadow},{alignment},20,20,{margin_v},0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def _base_loop(self, effect_func) -> str:
        lines = []
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        
        if alignment == 8: cy = 150
        elif alignment == 5: cy = screen_h // 2
        else: cy = screen_h - 150

        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            duration = end_ms - start_ms
            
            new_lines = effect_func(word, start_ms, end_ms, duration, cx, cy)
            lines.extend(new_lines)
        return self.header + "\n".join(lines)

    def render(self) -> str:
        style_id = self.style.get("id", "default").replace("-", "_")
        method_name = f"render_{style_id}"
        
        if hasattr(self, method_name):
            return getattr(self, method_name)()
        
        # Fallbacks
        if style_id == "neon_glow": return self.render_neon_pulse()
        if style_id == "welcome_my_life": return self.render_word_pop()
        
        return self.render_word_pop()

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

    # --- 16. Pulse (Karaoke) ---
    def render_pulse(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main text with pulsing effect
            mid = dur // 2
            pulse = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){pulse}}}{word['text']}")
            
            # Add expanding rings
            for i in range(3):
                ring_start = start + i * 100
                ring_end = ring_start + 600
                scale_start = 100 + i * 20
                scale_end = 350 + i * 50
                res.append(f"Dialogue: 0,{ms_to_ass(ring_start)},{ms_to_ass(ring_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1a&HFF&\\3c&HFFFFFF&\\bord2\\fscx{scale_start}\\fscy{scale_start}\\t(\\fscx{scale_end}\\fscy{scale_end}\\alpha&HFF&)\\p1}}m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 17. Bubble Floral ---
    def render_bubble_floral(self) -> str:
        bubble_shape = "m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main text with rotation
            rotation = random.choice([-15, 15])
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy+20},{cx},{cy})\\frz{rotation}\\t(\\frz0)\\fad(100,100)}}{word['text']}")
            
            # Bubbles rising up
            for _ in range(8):
                bx = cx + random.randint(-50, 50)
                by = cy + random.randint(-100, 50)
                ey = by - random.randint(100, 200)
                b_start = start + random.randint(0, dur // 2)
                b_end = b_start + random.randint(800, 1200)
                size = random.randint(10, 30)
                res.append(f"Dialogue: 0,{ms_to_ass(b_start)},{ms_to_ass(b_end)},Default,,0,0,0,,{{\\an5\\move({bx},{by},{bx},{ey})\\fscx{size}\\fscy{size}\\1c&HFFFFFF&\\3c&HFFFFFF&\\blur5\\fad(100,200)\\p1}}{bubble_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 18. Falling Heart ---
    def render_falling_heart(self) -> str:
        heart_shape = "m 18 40 b 23 29 35 27 35 16 b 36 8 23 0 18 11 b 14 0 0 8 1 16 b 1 27 14 29 18 40"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main text falling and rotating
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy-50},{cx},{cy})\\frz{random.randint(-20, 20)}\\t(\\frz0)\\fad(300,100)}}{word['text']}")
            
            # Falling hearts
            for _ in range(15):
                hx = cx + random.randint(-80, 80)
                hy = cy - random.randint(50, 100)
                ey = cy + random.randint(50, 150)
                h_start = start + random.randint(0, dur)
                h_end = h_start + random.randint(1000, 1500)
                size = random.randint(20, 40)
                rotation = random.choice([-500, 500, -700, 700])
                color = random.choice(["&HFF69B4&", "&HFF1493&", "&HFF00FF&"])
                res.append(f"Dialogue: 0,{ms_to_ass(h_start)},{ms_to_ass(h_end)},Default,,0,0,0,,{{\\an5\\move({hx},{hy},{hx + random.randint(-50, 50)},{ey})\\fscx{size}\\fscy{size}\\1c{color}\\blur5\\frz0\\t(\\frz{rotation})\\fad(300,300)\\p1}}{heart_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 19. Colorful (Rainbow Cycle) ---
    def render_colorful(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Cycle through rainbow colors
            colors = ["&H0000FF&", "&H00FFFF&", "&H00FF00&", "&HFFFF00&", "&HFF0000&", "&HFF00FF&"]
            step = dur // len(colors)
            
            color_transforms = ""
            for i, color in enumerate(colors):
                t_start = i * step
                t_end = (i + 1) * step
                color_transforms += f"\\t({t_start},{t_end},\\1c{color})"
            
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx110\\fscy110\\blur3{color_transforms}\\fad(100,100)}}{word['text']}")
            
            # Color particles
            for _ in range(10):
                px = cx + random.randint(-60, 60)
                py = cy + random.randint(-40, 40)
                ex = px + random.randint(-100, 100)
                ey = py + random.randint(-100, 100)
                p_start = start + random.randint(0, dur // 2)
                p_end = p_start + random.randint(400, 800)
                p_color = random.choice(colors)
                res.append(f"Dialogue: 0,{ms_to_ass(p_start)},{ms_to_ass(p_end)},Default,,0,0,0,,{{\\an5\\move({px},{py},{ex},{ey})\\1c{p_color}\\fscx15\\fscy15\\blur4\\fad(0,200)\\p1}}m 0 0 l 10 0 10 10 0 10{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 20. Ghost Star ---
    def render_ghost_star(self) -> str:
        star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            # Main text with glow
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\blur8\\fscx105\\fscy105\\t(\\blur2\\fscx100\\fscy100)\\fad(150,150)}}{word['text']}")
            
            # Ghost stars floating around
            for _ in range(12):
                sx = cx + random.randint(-100, 100)
                sy = cy + random.randint(-80, 80)
                angle = random.uniform(0, 360)
                distance = random.uniform(80, 150)
                ex = sx + math.cos(math.radians(angle)) * distance
                ey = sy + math.sin(math.radians(angle)) * distance
                s_start = start + random.randint(0, dur)
                s_end = s_start + random.randint(800, 1200)
                size = random.randint(15, 35)
                star_color = random.choice(["&HFFFFFF&", "&HFFFF00&", "&H00FFFF&"])
                res.append(f"Dialogue: 0,{ms_to_ass(s_start)},{ms_to_ass(s_end)},Default,,0,0,0,,{{\\an5\\move({int(sx)},{int(sy)},{int(ex)},{int(ey)})\\fscx{size}\\fscy{size}\\1c{star_color}\\blur6\\frz0\\t(\\frz360)\\fad(200,300)\\p1}}{star_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 21. TikTok Group (2-3 words, active highlighted) ---
    def render_tiktok_group(self) -> str:
        """Shows 2-3 words at once with active word highlighted"""
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        
        if alignment == 8:
            cy = 150
        elif alignment == 5:
            cy = screen_h // 2
        else:
            cy = screen_h - 150
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            
            # Build the text group: previous + CURRENT + next
            text_parts = []
            
            # Previous word (dimmed)
            if i > 0:
                prev_word = self.words[i-1]['text']
                text_parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{prev_word}")
            
            # Current word (highlighted)
            curr_word = word['text']
            text_parts.append(f"{{\\alpha&H00&\\fscx120\\fscy120\\1c&HFFFF00&\\blur3}}{curr_word}")
            
            # Next word (dimmed)
            if i < len(self.words) - 1:
                next_word = self.words[i+1]['text']
                text_parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{next_word}")
            
            # Join with spaces
            full_text = " ".join(text_parts)
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # --- 22. Matrix Rain ---
    def render_matrix_rain(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&H00FF00&\\fad(100,100)}}{word['text']}")
            
            chars = "01アイウエオカキクケコ"
            for _ in range(15):
                char = random.choice(chars)
                x = cx + random.randint(-200, 200)
                y_start = cy - random.randint(200, 400)
                y_end = cy + random.randint(100, 300)
                c_start = start + random.randint(0, dur)
                c_end = c_start + random.randint(500, 1000)
                res.append(f"Dialogue: 0,{ms_to_ass(c_start)},{ms_to_ass(c_end)},Default,,0,0,0,,{{\\an5\\move({x},{y_start},{x},{y_end})\\1c&H00FF00&\\alpha&H80&\\fscx50\\fscy50\\fad(0,200)}}{char}")
            return res
        return self._base_loop(effect)

    # --- 23. Electric Shock ---
    def render_electric_shock(self) -> str:
        lightning_shape = "m 0 0 l 5 20 l -3 20 l 8 40 l -10 25 l 0 25"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            shake = "".join([f"\\t({i*50},{(i+1)*50},\\frz{random.randint(-3,3)})" for i in range(min(dur//50, 10))])
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&HFFFF00&{shake}}}{word['text']}")
            
            for _ in range(6):
                lx = cx + random.randint(-80, 80)
                ly = cy + random.randint(-60, 60)
                l_start = start + random.randint(0, dur//2)
                l_end = l_start + random.randint(50, 150)
                rotation = random.randint(0, 360)
                res.append(f"Dialogue: 0,{ms_to_ass(l_start)},{ms_to_ass(l_end)},Default,,0,0,0,,{{\\an5\\pos({lx},{ly})\\frz{rotation}\\1c&HFFFF00&\\fscx80\\fscy80\\fad(0,50)\\p1}}{lightning_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 24. Smoke Trail ---
    def render_smoke_trail(self) -> str:
        smoke_shape = "m 0 0 b 10 -5 20 -5 30 0 b 20 5 10 5 0 0"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,300)\\t({max(dur-200,0)},{dur},\\alpha&HFF&\\blur10)}}{word['text']}")
            
            for _ in range(10):
                sx = cx + random.randint(-40, 40)
                sy = cy + random.randint(-20, 20)
                ey = sy - random.randint(50, 100)
                s_start = start + random.randint(max(dur//2,0), dur)
                s_end = s_start + random.randint(800, 1200)
                size = random.randint(30, 60)
                res.append(f"Dialogue: 0,{ms_to_ass(s_start)},{ms_to_ass(s_end)},Default,,0,0,0,,{{\\an5\\move({sx},{sy},{sx + random.randint(-30,30)},{ey})\\fscx{size}\\fscy{size}\\1c&HCCCCCC&\\alpha&H40&\\blur8\\t(\\alpha&HFF&\\fscx{size*2}\\fscy{size*2})\\p1}}{smoke_shape}{{\\p0}}")
            return res
        return self._base_loop(effect)

    # --- 25. Pixel Glitch ---
    def render_pixel_glitch(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            colors = ["&HFF0000&", "&H00FF00&", "&H0000FF&", "&HFFFFFF&"]
            for i, color in enumerate(colors):
                offset_x = random.randint(-5, 5)
                offset_y = random.randint(-3, 3)
                glitch_count = min(dur//100, 8)
                glitch_times = "".join([f"\\t({j*100},{(j+1)*100},\\pos({cx + random.randint(-10,10)},{cy + random.randint(-5,5)}))" for j in range(glitch_count)])
                res.append(f"Dialogue: {i},{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + offset_x},{cy + offset_y})\\1c{color}\\alpha&H60&{glitch_times}}}{word['text']}")
            return res
        return self._base_loop(effect)

    # --- 26. Neon Sign ---
    def render_neon_sign(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            flicker = ""
            t = 0
            while t < min(dur, 1000):
                if random.random() < 0.3:
                    flicker += f"\\t({t},{t+50},\\alpha&HFF&)\\t({t+50},{t+100},\\alpha&H00&)"
                    t += 100
                else:
                    t += 100
            
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&HFF00FF&\\3c&HFF00FF&\\bord3\\blur5{flicker}}}{word['text']}")
            return res
        return self._base_loop(effect)

    # --- 27. Karaoke Classic (3 words) ---
    def render_karaoke_classic(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
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

    # --- 28. Fade In Out (sentence) ---
    def render_fade_in_out(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        sentence_length = 5
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(400,400)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # --- 29. Slide Up ---
    def render_slide_up(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        sentence_length = 4
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\move({cx},{cy + 100},{cx},{cy},0,300)\\fad(100,200)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # --- 30. Zoom Burst ---
    def render_zoom_burst(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        sentence_length = 4
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx0\\fscy0\\t(0,300,\\fscx100\\fscy100)\\fad(0,200)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # --- 31. Bounce In ---
    def render_bounce_in(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        sentence_length = 4
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            # Bounce effect with multiple transforms
            bounce = "\\t(0,150,\\fscx120\\fscy120)\\t(150,250,\\fscx95\\fscy95)\\t(250,350,\\fscx105\\fscy105)\\t(350,400,\\fscx100\\fscy100)"
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\move({cx},{cy - 100},{cx},{cy},0,400){bounce}\\fad(0,200)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # --- 32. TikTok Yellow Box (Single Word) ---
    def render_tiktok_yellow_box(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            text = word['text']
            
            # Calculate box dimensions based on text length
            char_width = 35  # Approximate width per character
            text_width = len(text) * char_width
            box_w = text_width + 60  # Add padding
            box_h = 90
            
            # Create rounded rectangle shape (approximation with bezier curves)
            radius = 15
            box_shape = f"m {radius} 0 l {box_w-radius} 0 b {box_w} 0 {box_w} {radius} {box_w} {radius} l {box_w} {box_h-radius} b {box_w} {box_h} {box_w-radius} {box_h} {box_w-radius} {box_h} l {radius} {box_h} b 0 {box_h} 0 {box_h-radius} 0 {box_h-radius} l 0 {radius} b 0 0 {radius} 0 {radius} 0"
            
            # Background box (yellow with slight transparency)
            box_start = start
            box_end = end
            res.append(f"Dialogue: 0,{ms_to_ass(box_start)},{ms_to_ass(box_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\p1\\1c&H00FFFF&\\alpha&H20&\\blur2\\fscx100\\fscy100\\t(0,150,\\fscx105\\fscy105)\\t(150,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}")
            
            # Text (black, bold)
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&H000000&\\b1\\fscx110\\fscy110\\t(0,150,\\fscx120\\fscy120)\\t(150,{dur},\\fscx110\\fscy110)}}{text}")
            
            return res
        return self._base_loop(effect)

    # --- 33. TikTok Box Group (3 Words with Line Wrap) ---
    def render_tiktok_box_group(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        screen_w = 1920
        cx = screen_w // 2
        cy = screen_h - 150 if alignment == 2 else (150 if alignment == 8 else screen_h // 2)
        
        max_line_width = screen_w - 200  # Leave margins
        
        # Get Dynamic Styles
        active_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF")) # Default Yellowish
        passive_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        box_color = hex_to_ass(self.style.get("active_bg_color", "&H00FFFF00")) # Default Cyan-ish box if not set
        
        # Scale logic
        try:
            active_scale = int(self.style.get("active_scale", 110))
        except:
            active_scale = 110
            
        passive_scale = 90
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            
            # Build word group
            words_group = []
            
            # Previous word
            if i > 0:
                prev_word = self.words[i-1]['text']
                words_group.append({'text': prev_word, 'active': False})
            
            # Current word
            curr_word = word['text']
            words_group.append({'text': curr_word, 'active': True})
            
            # Next word
            if i < len(self.words) - 1:
                next_word = self.words[i+1]['text']
                words_group.append({'text': next_word, 'active': False})
            
            # Calculate layout
            char_width = 55
            spacing = 80
            total_width = sum([len(w['text']) * char_width + spacing for w in words_group])
            
            if total_width > max_line_width:
                # Multi-line layout
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
                        
                        # Box (Background)
                        # Only show box if color is not fully transparent
                        if not box_color.startswith("&HFF"): 
                            lines.append(f"Dialogue: 0,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{word_y})\\p1\\1c{box_color}\\alpha&H20&\\blur2\\t(0,120,\\fscx105\\fscy105)\\t(120,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}")
                        
                        # Active Text
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{word_y})\\1c{active_color}\\b1\\fscx{active_scale}\\fscy{active_scale}\\t(0,120,\\fscx{active_scale+10}\\fscy{active_scale+10})\\t(120,{dur},\\fscx{active_scale}\\fscy{active_scale})}}{w['text']}")
                    else:
                        # Passive Text
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{word_y})\\1c{passive_color}\\alpha&H60&\\fscx{passive_scale}\\fscy{passive_scale}}}{w['text']}")
            else:
                # Single line layout
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
                        
                        # Box
                        if not box_color.startswith("&HFF"):
                            lines.append(f"Dialogue: 0,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{cy})\\p1\\1c{box_color}\\alpha&H20&\\blur2\\t(0,120,\\fscx105\\fscy105)\\t(120,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}")
                        
                        # Active Text
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{cy})\\1c{active_color}\\b1\\fscx{active_scale}\\fscy{active_scale}\\t(0,120,\\fscx{active_scale+10}\\fscy{active_scale+10})\\t(120,{dur},\\fscx{active_scale}\\fscy{active_scale})}}{w['text']}")
                    else:
                        # Passive Text
                        lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({word_x},{cy})\\1c{passive_color}\\alpha&H60&\\fscx{passive_scale}\\fscy{passive_scale}}}{w['text']}")
                    
                    current_x += word_width + spacing
        
        return self.header + "\n".join(lines)

    # --- DYNAMIC HIGHLIGHT (2-4 Words with Color Transition) ---
    def render_dynamic_highlight(self) -> str:
        """
        Shows 2-4 words at once. Most words are in normal color/style,
        but the currently spoken word is highlighted with a different color.
        Color transition is smooth (with effect).
        """
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        
        if alignment == 8:
            cy = 150
        elif alignment == 5:
            cy = screen_h // 2
        else:
            cy = screen_h - 150
        
        # Get colors from style
        normal_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        highlight_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        
        # Scale logic
        try:
            active_scale = int(self.style.get("active_scale", 110))
        except:
            active_scale = 110
        
        # Determine group size (2-4 words)
        min_words = 2
        max_words = 4
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            
            # Build word group
            words_group = []
            
            # Calculate how many words to show before and after
            words_before = min(i, max_words - 1)
            words_after = min(len(self.words) - i - 1, max_words - 1)
            
            # Adjust to keep total between min_words and max_words
            total_words = 1 + words_before + words_after
            if total_words > max_words:
                # Reduce to fit max_words
                excess = total_words - max_words
                if words_after > words_before:
                    words_after -= excess
                else:
                    words_before -= excess
            elif total_words < min_words:
                # Try to add more words
                needed = min_words - total_words
                if i > 0 and words_before < max_words - 1:
                    add_before = min(needed, i - words_before)
                    words_before += add_before
                    needed -= add_before
                if needed > 0 and words_after < max_words - 1:
                    add_after = min(needed, len(self.words) - i - 1 - words_after)
                    words_after += add_after
            
            # Build the text with inline color tags
            text_parts = []
            
            # Add previous words (normal color)
            for j in range(i - words_before, i):
                if j >= 0:
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            
            # Current word (highlighted with smooth transition AND scale)
            transition_time = min(dur, 300)
            
            # We combine color transition (\t) with scale (\fscx\fscy)
            # Note: \t works for color, but for scale we might need a separate \t or just set it if we want it static.
            # Let's make it "pop" a bit.
            
            # Initial state: normal color, normal scale (100)
            # Target state: highlight color, active_scale
            
            # Since we are inside a single line, we can't easily animate scale of just ONE word without affecting spacing dynamically in a complex way (ASS is tricky with inline scaling affecting flow).
            # However, for simple "pop", we can use inline tags.
            
            current_word_tag = f"{{\\1c{normal_color}\\t(0,{transition_time//2},\\1c{highlight_color}\\fscx{active_scale}\\fscy{active_scale})\\t({dur-transition_time//2},{dur},\\1c{normal_color}\\fscx100\\fscy100)}}{word['text']}"
            text_parts.append(current_word_tag)
            
            # Add next words (normal color)
            for j in range(i + 1, i + 1 + words_after):
                if j < len(self.words):
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            
            # Join with spaces
            full_text = " ".join(text_parts)
            
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}")
        
        return self.header + "\n".join(lines)

    # --- 36. ICE CRYSTAL ❄️ ---
    def render_ice_crystal(self) -> str:
        crystal_shape = "m 0 -20 l 5 -5 20 0 5 5 0 20 -5 5 -20 0 -5 -5"
        snowflake = "m 0 -15 l 0 15 m -15 0 l 15 0 m -10 -10 l 10 10 m -10 10 l 10 -10"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            
            # Layer 1: Ice Glow
            ice_colors = ["&HFFFF00&", "&HFFAA00&", "&HFF8800&"]
            for i, color in enumerate(ice_colors):
                offset = (i - 1) * 3
                res.append(f"Dialogue: 0,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + offset},{cy + offset})\\1c{color}\\blur18\\alpha&H70&}}{word['text']}")
            
            # Layer 2: Frozen Text
            for i in range(3):
                res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + i},{cy + i})\\1c&HFFFFFF&\\bord2\\3c&HDDFFFF&\\blur1\\fscx110\\fscy110}}{word['text']}")
            
            # Layer 3: Exploding Crystals
            for i in range(30):
                angle = (i * 360 / 30) + random.randint(-10, 10)
                distance_start = 30
                distance_end = random.randint(120, 200)
                angle_rad = math.radians(angle)
                cx_start = cx + int(math.cos(angle_rad) * distance_start)
                cy_start = cy + int(math.sin(angle_rad) * distance_start)
                cx_end = cx + int(math.cos(angle_rad) * distance_end)
                cy_end = cy + int(math.sin(angle_rad) * distance_end)
                c_start = start + random.randint(0, dur//3)
                c_end = c_start + random.randint(600, 1000)
                scale = random.randint(20, 50)
                res.append(f"Dialogue: 0,{ms_to_ass(c_start)},{ms_to_ass(c_end)},Default,,0,0,0,,{{\\an5\\move({cx_start},{cy_start},{cx_end},{cy_end})\\fscx{scale}\\fscy{scale}\\1c&HFFFFFF&\\blur4\\frz{random.randint(0,360)}\\t(\\frz{random.randint(360,720)})\\t(\\alpha&HFF&)\\p1}}{crystal_shape}{{\\p0}}")
            
            # Layer 4: Frost Particles
            for _ in range(25):
                px = cx + random.randint(-150, 150)
                py = cy + random.randint(-100, 100)
                p_start = start + random.randint(0, dur)
                p_end = p_start + random.randint(400, 800)
                p_size = random.randint(5, 15)
                res.append(f"Dialogue: 0,{ms_to_ass(p_start)},{ms_to_ass(p_end)},Default,,0,0,0,,{{\\an5\\pos({px},{py})\\fscx{p_size}\\fscy{p_size}\\1c&HDDFFFF&\\blur2\\t(0,{(p_end-p_start)//2},\\alpha&H00&)\\t({(p_end-p_start)//2},{p_end-p_start},\\alpha&HFF&)}}●")
            
            # Layer 5: Snowflakes
            for _ in range(12):
                sx = cx + random.randint(-100, 100)
                sy = cy + random.randint(-80, 80)
                s_start = start + random.randint(0, dur//2)
                s_end = s_start + random.randint(1000, 1500)
                s_size = random.randint(25, 45)
                res.append(f"Dialogue: 0,{ms_to_ass(s_start)},{ms_to_ass(s_end)},Default,,0,0,0,,{{\\an5\\pos({sx},{sy})\\fscx{s_size}\\fscy{s_size}\\1c&HFFFFFF&\\blur3\\frz0\\t(\\frz360)\\p1}}{snowflake}{{\\p0}}")
            
            # Layer 6: Ice Shards
            shard_shape = "m 0 0 l 3 -25 l 6 0"
            for i in range(8):
                angle = i * 45
                shard_x = cx + int(math.cos(math.radians(angle)) * 60)
                shard_y = cy + int(math.sin(math.radians(angle)) * 60)
                sh_start = start
                sh_end = start + 400
                res.append(f"Dialogue: 0,{ms_to_ass(sh_start)},{ms_to_ass(sh_end)},Default,,0,0,0,,{{\\an5\\pos({shard_x},{shard_y})\\frz{angle}\\fscx80\\fscy80\\1c&HFFFFFF&\\blur2\\t(\\fscx0\\fscy0\\alpha&HFF&)\\p1}}{shard_shape}{{\\p0}}")
            
            return res
        return self._base_loop(effect)

    # --- 37. THUNDER STORM ⚡ ---
    def render_thunder_storm(self) -> str:
        lightning = "m 0 0 l 5 20 l -3 20 l 8 40 l -10 25 l 0 25"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            
            # Layer 1: Storm Clouds
            for i in range(5):
                cloud_x = cx + random.randint(-150, 150)
                cloud_y = cy - random.randint(80, 120)
                cloud_size = random.randint(60, 100)
                res.append(f"Dialogue: 0,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cloud_x},{cloud_y})\\fscx{cloud_size}\\fscy{cloud_size}\\1c&H404040&\\alpha&H60&\\blur20}}●")
            
            # Layer 2: Electric Text
            for flash in range(3):
                flash_start = start + flash * (dur // 3)
                flash_end = flash_start + 100
                res.append(f"Dialogue: 1,{ms_to_ass(flash_start)},{ms_to_ass(flash_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&\\bord3\\3c&HFFFF00&\\blur5}}{word['text']}")
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&H00FFFF&\\bord2\\3c&H0000FF&\\blur2}}{word['text']}")
            
            # Layer 3: Lightning Bolts
            for _ in range(15):
                lx = cx + random.randint(-120, 120)
                ly = cy - random.randint(100, 150)
                l_start = start + random.randint(0, dur)
                l_end = l_start + random.randint(50, 150)
                rotation = random.randint(-30, 30)
                scale = random.randint(80, 150)
                res.append(f"Dialogue: 0,{ms_to_ass(l_start)},{ms_to_ass(l_end)},Default,,0,0,0,,{{\\an5\\pos({lx},{ly})\\frz{rotation}\\fscx{scale}\\fscy{scale}\\1c&HFFFF00&\\blur3\\fad(0,50)\\p1}}{lightning}{{\\p0}}")
            
            # Layer 4: Electric Sparks
            for _ in range(30):
                sx = cx + random.randint(-100, 100)
                sy = cy + random.randint(-60, 60)
                s_end_x = sx + random.randint(-40, 40)
                s_end_y = sy + random.randint(-40, 40)
                s_start = start + random.randint(0, dur)
                s_end = s_start + random.randint(100, 300)
                res.append(f"Dialogue: 0,{ms_to_ass(s_start)},{ms_to_ass(s_end)},Default,,0,0,0,,{{\\an5\\move({sx},{sy},{s_end_x},{s_end_y})\\1c&H00FFFF&\\blur2\\fscx5\\fscy5}}●")
            
            # Layer 5: Rain
            for _ in range(20):
                rx = cx + random.randint(-200, 200)
                ry_start = cy - random.randint(150, 200)
                ry_end = cy + random.randint(100, 150)
                r_start = start + random.randint(0, dur)
                r_end = r_start + random.randint(400, 600)
                res.append(f"Dialogue: 0,{ms_to_ass(r_start)},{ms_to_ass(r_end)},Default,,0,0,0,,{{\\an5\\move({rx},{ry_start},{rx},{ry_end})\\1c&H808080&\\alpha&H80&\\fscx2\\fscy30\\blur1}}|")
            
            # Layer 6: Flash
            for i in range(4):
                flash_start = start + i * (dur // 4)
                flash_end = flash_start + 80
                res.append(f"Dialogue: 0,{ms_to_ass(flash_start)},{ms_to_ass(flash_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx400\\fscy400\\1c&HFFFFFF&\\alpha&H00&\\blur30\\t(\\alpha&HFF&)}}●")
            
            return res
        return self._base_loop(effect)

    # --- 38. OCEAN WAVE 🌊 ---
    def render_ocean_wave(self) -> str:
        bubble = "m 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 0 20 0 20 16 b 20 16 20 16 20 16 b 20 33 0 33 0 16"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            
            # Layer 1: Water Glow
            water_colors = ["&HFF8800&", "&HFFAA00&", "&HFFCC00&"]
            for i, color in enumerate(water_colors):
                offset = (i - 1) * 3
                res.append(f"Dialogue: 0,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + offset},{cy + offset})\\1c{color}\\blur20\\alpha&H70&}}{word['text']}")
            
            # Layer 2: Wavy Text
            wave_count = 5
            for i in range(wave_count):
                wave_offset = int(math.sin((i / wave_count) * math.pi * 2) * 10)
                res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy + wave_offset})\\1c&H00CCFF&\\bord2\\3c&H0088FF&\\blur1}}{word['text']}")
            
            # Layer 3: Wave Particles
            for i in range(40):
                angle = (i * 360 / 40)
                radius = random.randint(60, 120)
                angle_rad = math.radians(angle)
                wx = cx + int(math.cos(angle_rad) * radius)
                wy = cy + int(math.sin(angle_rad) * radius) + int(math.sin(angle_rad * 3) * 20)
                w_start = start + random.randint(0, dur//2)
                w_end = w_start + random.randint(800, 1200)
                w_size = random.randint(15, 35)
                res.append(f"Dialogue: 0,{ms_to_ass(w_start)},{ms_to_ass(w_end)},Default,,0,0,0,,{{\\an5\\pos({wx},{wy})\\fscx{w_size}\\fscy{w_size}\\1c&H00AAFF&\\blur4\\t(\\alpha&HFF&)}}●")
            
            # Layer 4: Bubbles
            for _ in range(20):
                bx = cx + random.randint(-100, 100)
                by_start = cy + random.randint(40, 80)
                by_end = cy - random.randint(80, 120)
                b_start = start + random.randint(0, dur)
                b_end = b_start + random.randint(1000, 1500)
                b_size = random.randint(20, 40)
                res.append(f"Dialogue: 0,{ms_to_ass(b_start)},{ms_to_ass(b_end)},Default,,0,0,0,,{{\\an5\\move({bx},{by_start},{bx + random.randint(-20,20)},{by_end})\\fscx{b_size}\\fscy{b_size}\\1c&H00DDFF&\\blur5\\t(\\alpha&HFF&)\\p1}}{bubble}{{\\p0}}")
            
            # Layer 5: Foam
            for _ in range(15):
                fx = cx + random.randint(-120, 120)
                fy = cy + random.randint(-40, 40)
                f_start = start + random.randint(0, dur)
                f_end = f_start + random.randint(400, 700)
                f_size = random.randint(10, 25)
                res.append(f"Dialogue: 0,{ms_to_ass(f_start)},{ms_to_ass(f_end)},Default,,0,0,0,,{{\\an5\\pos({fx},{fy})\\fscx{f_size}\\fscy{f_size}\\1c&HFFFFFF&\\alpha&H40&\\blur8\\t(\\fscx{f_size*2}\\alpha&HFF&)}}●")
            
            # Layer 6: Wave Lines
            for i in range(3):
                wave_y = cy + (i - 1) * 40
                w_start = start + i * (dur // 3)
                w_end = w_start + 500
                res.append(f"Dialogue: 0,{ms_to_ass(w_start)},{ms_to_ass(w_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{wave_y})\\fscx300\\fscy15\\1c&H00AAFF&\\alpha&H80&\\blur10\\t(\\fscx400\\alpha&HFF&)}}～")
            
            return res
        return self._base_loop(effect)

    # --- 39. COSMIC STARS 🌟 ---
    def render_cosmic_stars(self) -> str:
        star = "m 0 -20 l 5 -5 20 0 5 5 0 20 -5 5 -20 0 -5 -5"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            
            # Layer 1: Cosmic Glow
            cosmic_colors = ["&HFF00FF&", "&HFF00AA&", "&HFF0066&"]
            for i, color in enumerate(cosmic_colors):
                offset = (i - 1) * 4
                res.append(f"Dialogue: 0,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + offset},{cy + offset})\\1c{color}\\blur25\\alpha&H60&\\t(0,{dur//2},\\blur30)\\t({dur//2},{dur},\\blur25)}}{word['text']}")
            
            # Layer 2: Galaxy Text
            galaxy_colors = [("&HFF00FF&", 0, 0), ("&HFF00AA&", 2, 1), ("&HFF0066&", 4, 2)]
            for color, ox, oy in galaxy_colors:
                res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + ox},{cy + oy})\\1c{color}\\bord2\\3c&HFFFFFF&\\blur2\\fscx115\\fscy115}}{word['text']}")
            
            # Layer 3: Orbiting Stars
            for i in range(25):
                orbit_angle_start = (i * 360 / 25) + random.randint(-20, 20)
                orbit_angle_end = orbit_angle_start + random.choice([360, -360, 720])
                radius = random.randint(80, 150)
                angle_start_rad = math.radians(orbit_angle_start)
                angle_end_rad = math.radians(orbit_angle_end)
                sx_start = cx + int(math.cos(angle_start_rad) * radius)
                sy_start = cy + int(math.sin(angle_start_rad) * radius)
                sx_end = cx + int(math.cos(angle_end_rad) * radius)
                sy_end = cy + int(math.sin(angle_end_rad) * radius)
                s_start = start + random.randint(0, dur//3)
                s_end = s_start + random.randint(1000, 1500)
                s_size = random.randint(25, 50)
                star_color = random.choice(["&HFFFFFF&", "&HFFFF00&", "&HFF00FF&", "&H00FFFF&"])
                res.append(f"Dialogue: 0,{ms_to_ass(s_start)},{ms_to_ass(s_end)},Default,,0,0,0,,{{\\an5\\move({sx_start},{sy_start},{sx_end},{sy_end})\\fscx{s_size}\\fscy{s_size}\\1c{star_color}\\blur5\\frz0\\t(\\frz360)\\t(\\alpha&HFF&)\\p1}}{star}{{\\p0}}")
            
            # Layer 4: Stardust
            for _ in range(40):
                dx = cx + random.randint(-150, 150)
                dy = cy + random.randint(-100, 100)
                d_start = start + random.randint(0, dur)
                d_end = d_start + random.randint(300, 600)
                d_size = random.randint(3, 10)
                dust_color = random.choice(["&HFFFFFF&", "&HFFCCFF&", "&HCCFFFF&"])
                res.append(f"Dialogue: 0,{ms_to_ass(d_start)},{ms_to_ass(d_end)},Default,,0,0,0,,{{\\an5\\pos({dx},{dy})\\fscx{d_size}\\fscy{d_size}\\1c{dust_color}\\blur2\\t(0,{(d_end-d_start)//2},\\alpha&H00&)\\t({(d_end-d_start)//2},{d_end-d_start},\\alpha&HFF&)}}✦")
            
            # Layer 5: Nebula Clouds
            for _ in range(8):
                nx = cx + random.randint(-120, 120)
                ny = cy + random.randint(-80, 80)
                n_start = start
                n_end = end
                n_size = random.randint(80, 140)
                nebula_color = random.choice(["&HFF00FF&", "&HFF0088&", "&H8800FF&"])
                res.append(f"Dialogue: 0,{ms_to_ass(n_start)},{ms_to_ass(n_end)},Default,,0,0,0,,{{\\an5\\pos({nx},{ny})\\fscx{n_size}\\fscy{n_size}\\1c{nebula_color}\\alpha&HC0&\\blur30}}●")
            
            # Layer 6: Shooting Stars
            for _ in range(6):
                shoot_x_start = cx + random.randint(-200, 200)
                shoot_y_start = cy - random.randint(100, 150)
                shoot_x_end = shoot_x_start + random.randint(100, 200)
                shoot_y_end = shoot_y_start + random.randint(100, 200)
                sh_start = start + random.randint(0, dur)
                sh_end = sh_start + random.randint(400, 700)
                res.append(f"Dialogue: 0,{ms_to_ass(sh_start)},{ms_to_ass(sh_end)},Default,,0,0,0,,{{\\an5\\move({shoot_x_start},{shoot_y_start},{shoot_x_end},{shoot_y_end})\\1c&HFFFFFF&\\blur8\\fscx80\\fscy3\\frz45\\t(\\alpha&HFF&)}}━")
            
            return res
        return self._base_loop(effect)

    # --- 40. BUTTERFLY DANCE 🦋 ---
    def render_butterfly_dance(self) -> str:
        butterfly = "m 10 15 b 5 10 0 5 0 0 b 0 5 5 10 10 15 m 10 15 b 15 10 20 5 20 0 b 20 5 15 10 10 15"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            
            # Layer 1: Flower Glow
            flower_colors = ["&HFF69B4&", "&HFF1493&", "&HFF00FF&"]
            for i, color in enumerate(flower_colors):
                offset = (i - 1) * 3
                res.append(f"Dialogue: 0,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + offset},{cy + offset})\\1c{color}\\blur18\\alpha&H70&}}{word['text']}")
            
            # Layer 2: Spring Text
            spring_colors = [("&HFF1493&", 0, 0), ("&HFF69B4&", 2, 1), ("&HFFC0CB&", 4, 2)]
            for color, ox, oy in spring_colors:
                res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx + ox},{cy + oy})\\1c{color}\\bord2\\3c&H00FF00&\\blur1\\fscx110\\fscy110}}{word['text']}")
            
            # Layer 3: Flying Butterflies
            for i in range(18):
                # Butterfly flight path (figure-8 pattern)
                t_start = i / 18
                angle1 = t_start * 360 * 2
                angle2 = (t_start + 0.5) * 360 * 2
                radius = 100
                bx_start = cx + int(math.cos(math.radians(angle1)) * radius)
                by_start = cy + int(math.sin(math.radians(angle1) * 2) * 50)
                bx_end = cx + int(math.cos(math.radians(angle2)) * radius)
                by_end = cy + int(math.sin(math.radians(angle2) * 2) * 50)
                b_start = start + random.randint(0, dur//2)
                b_end = b_start + random.randint(1200, 1800)
                b_size = random.randint(30, 50)
                butterfly_color = random.choice(["&HFF69B4&", "&HFF00FF&", "&H00FFFF&", "&HFFFF00&"])
                wing_flap = "\\t(0,150,\\fscx110\\fscy90)\\t(150,300,\\fscx100\\fscy100)\\t(300,450,\\fscx110\\fscy90)\\t(450,600,\\fscx100\\fscy100)"
                res.append(f"Dialogue: 0,{ms_to_ass(b_start)},{ms_to_ass(b_end)},Default,,0,0,0,,{{\\an5\\move({bx_start},{by_start},{bx_end},{by_end})\\fscx{b_size}\\fscy{b_size}\\1c{butterfly_color}\\blur4{wing_flap}\\frz{random.randint(0,360)}\\p1}}{butterfly}{{\\p0}}")
            
            # Layer 4: Flower Petals
            for _ in range(25):
                px = cx + random.randint(-120, 120)
                py_start = cy - random.randint(80, 120)
                py_end = cy + random.randint(80, 120)
                p_start = start + random.randint(0, dur)
                p_end = p_start + random.randint(1500, 2000)
                p_size = random.randint(15, 30)
                petal_color = random.choice(["&HFFC0CB&", "&HFF69B4&", "&HFFFFFF&"])
                res.append(f"Dialogue: 0,{ms_to_ass(p_start)},{ms_to_ass(p_end)},Default,,0,0,0,,{{\\an5\\move({px},{py_start},{px + random.randint(-40,40)},{py_end})\\fscx{p_size}\\fscy{p_size}\\1c{petal_color}\\blur5\\frz0\\t(\\frz{random.randint(360,720)})\\t(\\alpha&HFF&)}}🌸")
            
            # Layer 5: Sparkle Trail
            for _ in range(30):
                sx = cx + random.randint(-150, 150)
                sy = cy + random.randint(-100, 100)
                s_start = start + random.randint(0, dur)
                s_end = s_start + random.randint(300, 600)
                s_size = random.randint(8, 18)
                res.append(f"Dialogue: 0,{ms_to_ass(s_start)},{ms_to_ass(s_end)},Default,,0,0,0,,{{\\an5\\pos({sx},{sy})\\fscx{s_size}\\fscy{s_size}\\1c&HFFFF00&\\blur3\\t(0,{(s_end-s_start)//2},\\alpha&H00&)\\t({(s_end-s_start)//2},{s_end-s_start},\\alpha&HFF&)\\frz0\\t(\\frz360)}}✨")
            
            # Layer 6: Garden Breeze
            for i in range(5):
                breeze_y = cy + (i - 2) * 30
                br_start = start + i * (dur // 5)
                br_end = br_start + 600
                res.append(f"Dialogue: 0,{ms_to_ass(br_start)},{ms_to_ass(br_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{breeze_y})\\fscx250\\fscy10\\1c&H00FF00&\\alpha&HD0&\\blur12\\t(\\fscx350\\alpha&HFF&)}}～")
            
            return res
        return self._base_loop(effect)

    # --- DYNAMIC HIGHLIGHT (2-4 Words with Color Transition) ---
    def render_dynamic_highlight(self) -> str:
        """
        Shows 2-4 words at once. Most words are in normal color/style,
        but the currently spoken word is highlighted with a different color.
        Color transition is smooth (with effect).
        No position animation - only color changes.
        """
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        
        alignment = int(self.style.get("alignment", 2))
        screen_h = 1080
        cx = 1920 // 2
        
        if alignment == 8:
            cy = 150
        elif alignment == 5:
            cy = screen_h // 2
        else:
            cy = screen_h - 150
        
        # Get colors from style
        normal_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
        highlight_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
        
        # Determine group size (2-4 words)
        min_words = 2
        max_words = 4
        
        for i, word in enumerate(self.words):
            start_ms = int(word['start'] * 1000)
            end_ms = int(word['end'] * 1000)
            dur = end_ms - start_ms
            
            # Build word group
            words_group = []
            
            # Calculate how many words to show before and after
            words_before = min(i, max_words - 1)
            words_after = min(len(self.words) - i - 1, max_words - 1)
            
            # Adjust to keep total between min_words and max_words
            total_words = 1 + words_before + words_after
            if total_words > max_words:
                # Reduce to fit max_words
                excess = total_words - max_words
                if words_after > words_before:
                    words_after -= excess
                else:
                    words_before -= excess
            elif total_words < min_words:
                # Try to add more words
                needed = min_words - total_words
                if i > 0 and words_before < max_words - 1:
                    add_before = min(needed, i - words_before)
                    words_before += add_before
                    needed -= add_before
                if needed > 0 and words_after < max_words - 1:
                    add_after = min(needed, len(self.words) - i - 1 - words_after)
                    words_after += add_after
            
            # Build the text with inline color tags
            text_parts = []
            
            # Add previous words (normal color)
            for j in range(i - words_before, i):
                if j >= 0:
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            
            # Current word (highlighted with smooth transition)
            # Transition: normal -> highlight -> normal
            transition_time = min(dur, 300)  # Max 300ms for transition
            
            # CORRECTED F-STRING ESCAPE SEQUENCES
            # {{\\1c...}} -> {\1c...}
            current_word_tag = f"{{\\1c{normal_color}\\t(0,{transition_time//2},\\1c{highlight_color})\\t({dur-transition_time//2},{dur},\\1c{normal_color})}}{word['text']}"
            text_parts.append(current_word_tag)
            
            # Add next words (normal color)
            for j in range(i + 1, i + 1 + words_after):
                if j < len(self.words):
                    text_parts.append(f"{{\\1c{normal_color}}}{self.words[j]['text']}")
            
            # Join with spaces
            full_text = " ".join(text_parts)
            
            # Create dialogue line (no position animation, just color transitions)
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}")
        
        return self.header + "\n".join(lines)


