from .base import StyleRenderer
from .registry import StyleRegistry
from .utils import ms_to_ass
import random
import math

@StyleRegistry.register("cyber_glitch")
class CyberGlitchRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx-3},{cy})\\1c&H0000FF&\\t(\\pos({cx+3},{cy}))}}{word['text']}")
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx+3},{cy})\\1c&HFF0000&\\t(\\pos({cx-3},{cy}))}}{word['text']}")
            
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

@StyleRegistry.register("thunder_strike")
class ThunderStrikeRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            flash = f"\\t(0,50,\\3c&HFFFFFF&)\\t(50,100,\\3c&H000000&)\\t(100,150,\\3c&HFFFFFF&)\\t(150,200,\\3c&H000000&)"
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){flash}\\fscx110\\fscy110}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("rainbow_wave")
class RainbowWaveRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            rainbow = "\\t(0,33,\\1c&H00FF00&)\\t(33,66,\\1c&HFF0000&)\\t(66,100,\\1c&H0000FF&)"
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){rainbow}}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("earthquake_shake")
class EarthquakeShakeRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            shake = ""
            curr = 0
            while curr < dur:
                angle = random.randint(-5, 5)
                step = 40
                shake += f"\\t({curr},{curr+step},\\frz{angle})"
                curr += step
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy}){shake}}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("horror_creepy")
class HorrorCreepyRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            shake = ""
            curr = 0
            while curr < dur:
                ox = random.randint(-2, 2)
                oy = random.randint(-2, 2)
                shake += f"\\t({curr},{curr+50},\\fscx{random.randint(95,105)}\\fscy{random.randint(95,105)}\\pos({cx+ox},{cy+oy}))"
                curr += 50
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\blur3\\t(0,200,\\blur0){shake}}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("luxury_gold")
class LuxuryGoldRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            shine = "\\t(0,100,\\1c&HFFFFFF&)\\t(100,300,\\1c&H00D7FF&)" 
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100){shine}}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("comic_book")
class ComicBookRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            rot = random.randint(-5, 5)
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\frz{rot}\\fscx50\\fscy50\\t(0,100,\\fscx110\\fscy110)\\t(100,150,\\fscx100\\fscy100)}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("pulse")
class PulseRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            mid = dur // 2
            pulse = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){pulse}}}{word['text']}")
            
            for i in range(3):
                ring_start = start + i * 100
                ring_end = ring_start + 600
                scale_start = 100 + i * 20
                scale_end = 350 + i * 50
                res.append(f"Dialogue: 0,{ms_to_ass(ring_start)},{ms_to_ass(ring_end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1a&HFF&\\3c&HFFFFFF&\\bord2\\fscx{scale_start}\\fscy{scale_start}\\t(\\fscx{scale_end}\\fscy{scale_end}\\alpha&HFF&)\\p1}}m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15{{\\p0}}")
            return res
        return self._base_loop(effect)

@StyleRegistry.register("bubble_floral")
class BubbleFloralRenderer(StyleRenderer):
    def render(self) -> str:
        bubble_shape = "m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            rotation = random.choice([-15, 15])
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy+20},{cx},{cy})\\frz{rotation}\\t(\\frz0)\\fad(100,100)}}{word['text']}")
            
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

@StyleRegistry.register("falling_heart")
class FallingHeartRenderer(StyleRenderer):
    def render(self) -> str:
        heart_shape = "m 18 40 b 23 29 35 27 35 16 b 36 8 23 0 18 11 b 14 0 0 8 1 16 b 1 27 14 29 18 40"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy-50},{cx},{cy})\\frz{random.randint(-20, 20)}\\t(\\frz0)\\fad(300,100)}}{word['text']}")
            
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

@StyleRegistry.register("colorful")
class ColorfulRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            colors = ["&H0000FF&", "&H00FFFF&", "&H00FF00&", "&HFFFF00&", "&HFF0000&", "&HFF00FF&"]
            step = dur // len(colors)
            
            color_transforms = ""
            for i, color in enumerate(colors):
                t_start = i * step
                t_end = (i + 1) * step
                color_transforms += f"\\t({t_start},{t_end},\\1c{color})"
            
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx110\\fscy110\\blur3{color_transforms}\\fad(100,100)}}{word['text']}")
            
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

@StyleRegistry.register("ghost_star")
class GhostStarRenderer(StyleRenderer):
    def render(self) -> str:
        star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\blur8\\fscx105\\fscy105\\t(\\blur2\\fscx100\\fscy100)\\fad(150,150)}}{word['text']}")
            
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

@StyleRegistry.register("matrix_rain")
class MatrixRainRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("electric_shock")
class ElectricShockRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("smoke_trail")
class SmokeTrailRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("pixel_glitch")
class PixelGlitchRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("neon_sign")
class NeonSignRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("fade_in_out")
class FadeInOutRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
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

@StyleRegistry.register("slide_up")
class SlideUpRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
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

@StyleRegistry.register("zoom_burst")
class ZoomBurstRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
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

@StyleRegistry.register("bounce_in")
class BounceInRenderer(StyleRenderer):
    def render(self) -> str:
        lines = ["[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
        cx, cy = self.get_center_coordinates()
        
        sentence_length = 4
        for sent_start in range(0, len(self.words), sentence_length):
            sent_words = self.words[sent_start:sent_start + sentence_length]
            if not sent_words:
                continue
                
            start_ms = int(sent_words[0]['start'] * 1000)
            end_ms = int(sent_words[-1]['end'] * 1000)
            full_text = " ".join([w['text'] for w in sent_words])
            
            bounce = "\\t(0,150,\\fscx120\\fscy120)\\t(150,250,\\fscx95\\fscy95)\\t(250,350,\\fscx105\\fscy105)\\t(350,400,\\fscx100\\fscy100)"
            lines.append(f"Dialogue: 1,{ms_to_ass(start_ms)},{ms_to_ass(end_ms)},Default,,0,0,0,,{{\\an5\\move({cx},{cy - 100},{cx},{cy},0,400){bounce}\\fad(0,200)}}{full_text}")
        
        return self.header + "\n".join(lines)

@StyleRegistry.register("tiktok_yellow_box")
class TikTokYellowBoxRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            res = []
            text = word['text']
            
            char_width = 35
            text_width = len(text) * char_width
            box_w = text_width + 60
            box_h = 90
            
            radius = 15
            box_shape = f"m {radius} 0 l {box_w-radius} 0 b {box_w} 0 {box_w} {radius} {box_w} {radius} l {box_w} {box_h-radius} b {box_w} {box_h} {box_w-radius} {box_h} {box_w-radius} {box_h} l {radius} {box_h} b 0 {box_h} 0 {box_h-radius} 0 {box_h-radius} l 0 {radius} b 0 0 {radius} 0 {radius} 0"
            
            res.append(f"Dialogue: 0,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\p1\\1c&H00FFFF&\\alpha&H20&\\blur2\\fscx100\\fscy100\\t(0,150,\\fscx105\\fscy105)\\t(150,{dur},\\fscx100\\fscy100)}}{box_shape}{{\\p0}}")
            
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\1c&H000000&\\b1\\fscx110\\fscy110\\t(0,150,\\fscx120\\fscy120)\\t(150,{dur},\\fscx110\\fscy110)}}{text}")
            
            return res
        return self._base_loop(effect)
