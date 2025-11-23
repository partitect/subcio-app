from .base import StyleRenderer
from .registry import StyleRegistry
from .utils import ms_to_ass
import random
import math

@StyleRegistry.register("fire_storm")
class FireStormRenderer(StyleRenderer):
    def render(self) -> str:
        star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"
        
        def effect(word, start, end, dur, cx, cy):
            res = []
            res.append(f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(100,100)\\blur5\\t(0,{dur},\\fscx110\\fscy110\\blur10)}}{word['text']}")
            
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

@StyleRegistry.register("thunder_storm")
class ThunderStormRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("ice_crystal")
class IceCrystalRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("cosmic_stars")
class CosmicStarsRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("ocean_wave")
class OceanWaveRenderer(StyleRenderer):
    def render(self) -> str:
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

@StyleRegistry.register("butterfly_dance")
class ButterflyDanceRenderer(StyleRenderer):
    def render(self) -> str:
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
