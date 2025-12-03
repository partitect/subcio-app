from typing import Any, List
import math
import random
from ..utils import hex_to_ass

def _render_fire_storm(self) -> str:
    """Port of FireStormRenderer using PyonFX pipeline."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    particle_count = int(self.effect_config.get("particle_count", getattr(self.effect, "particle_count", 12)))
    colors = self.effect_config.get("colors", ["&H0000FF&", "&H00FFFF&", "&HFFFFFF&"])
    # Star path from original preset
    star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        duration = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        # Base glowing text
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,100)\\blur5\\t(0,{duration},\\fscx110\\fscy110\\blur10)}}{safe_text}"
        )

        # Particles
        for _ in range(particle_count):
            angle = math.radians(random.uniform(0, 360))
            speed = random.uniform(
                float(self.effect_config.get("min_speed", 30.0)),
                float(self.effect_config.get("max_speed", 120.0)),
            )
            sx = cx + random.uniform(-40, 40)
            sy = cy + random.uniform(-10, 10)
            ex = sx + math.cos(angle) * speed
            ey = sy + math.sin(angle) * speed
            p_start = start_ms + random.randint(0, max(0, duration - 200))
            p_end = p_start + random.randint(300, 600)
            color = random.choice(colors)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({int(sx)},{int(sy)},{int(ex)},{int(ey)})\\fad(0,200)\\blur2\\1c{color}\\bord0\\p1\\t(\\fscx0\\fscy0)}}"
                f"{star_shape}{{\\p0}}"
            )

    return "\n".join(lines)

def _render_cyber_glitch(self) -> str:
    """Port of CyberGlitchRenderer with configurable jitter/scale."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()

    offset_px = int(self.effect_config.get("offset_px", 3))
    jitter_min = int(self.effect_config.get("jitter_min_ms", 40))
    jitter_max = int(self.effect_config.get("jitter_max_ms", 90))
    scale_min = int(self.effect_config.get("scale_min", 90))
    scale_max = int(self.effect_config.get("scale_max", 110))

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        # Blue channel (left -> right)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx - offset_px},{cy})\\1c&H0000FF&\\t(\\pos({cx + offset_px},{cy}))}}{safe_text}"
        )
        # Red channel (right -> left)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx + offset_px},{cy})\\1c&HFF0000&\\t(\\pos({cx - offset_px},{cy}))}}{safe_text}"
        )

        # Main jitter line
        jitter_tags = ""
        curr = 0
        while curr < dur:
            step = random.randint(jitter_min, max(jitter_min, jitter_max))
            sc = random.randint(scale_min, max(scale_min, scale_max))
            jitter_tags += f"\\t({curr},{curr + step},\\fscx{sc}\\fscy{sc})"
            curr += step

        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy}){jitter_tags}}}{safe_text}"
        )

    return "\n".join(lines)

def _render_bubble_floral(self) -> str:
    """Port of BubbleFloralRenderer with drifting bubbles."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()

    bubble_shape = "m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15"
    bubble_count = int(self.effect_config.get("bubble_count", getattr(self.effect, "bubble_count", 8)))
    drift_y_min = int(self.effect_config.get("drift_y_min", 100))
    drift_y_max = int(self.effect_config.get("drift_y_max", 200))
    bubble_size_min = int(self.effect_config.get("bubble_size_min", 10))
    bubble_size_max = int(self.effect_config.get("bubble_size_max", 30))

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        rotation = random.choice([-15, 15])
        # Main text float-in
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\move({cx},{cy + 20},{cx},{cy})\\frz{rotation}\\t(\\frz0)\\fad(100,100)"
            f"\\1c{hex_to_ass(self.style.get('primary_color', '&H00FFFFFF'))}"
            f"\\3c{hex_to_ass(self.style.get('outline_color', '&H00000000'))}}}{safe_text}"
        )

        # Bubbles
        for _ in range(bubble_count):
            bx = cx + random.randint(-50, 50)
            by = cy + random.randint(-100, 50)
            ey = by - random.randint(drift_y_min, drift_y_max)
            b_start = start_ms + random.randint(0, dur // 2)
            b_end = b_start + random.randint(800, 1200)
            size = random.randint(bubble_size_min, bubble_size_max)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(b_start)},{self._ms_to_timestamp(b_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({bx},{by},{bx},{ey})\\fscx{size}\\fscy{size}\\1c&HFFFFFF&\\3c&HFFFFFF&\\blur5\\fad(100,200)\\p1}}"
                f"{bubble_shape}{{\\p0}}"
            )

    return "\n".join(lines)

def _render_thunder_strike(self) -> str:
    """Port of ThunderStrikeRenderer: flashing outline."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    flash = self.effect_config.get(
        "flash_tags",
        "\\t(0,50,\\3c&HFFFFFF&)\\t(50,100,\\3c&H000000&)\\t(100,150,\\3c&HFFFFFF&)\\t(150,200,\\3c&H000000&)",
    )

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(50,50){flash}\\fscx110\\fscy110}}{safe_text}"
        )
    return "\n".join(lines)

def _render_rainbow_wave(self) -> str:
    """Port of RainbowWaveRenderer: simple color cycle."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    colors = self.effect_config.get("colors", ["&H00FF00&", "&HFF0000&", "&H0000FF&"])
    # Build transform sequence evenly over duration thirds
    def build_rainbow(dur: int) -> str:
        if not colors:
            return ""
        step = max(1, dur // max(1, len(colors)))
        tags = ""
        for i, col in enumerate(colors):
            t_start = i * step
            t_end = min(dur, (i + 1) * step)
            tags += f"\\t({t_start},{t_end},\\1c{hex_to_ass(col)})"
        return tags

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(50,50){build_rainbow(dur)}}}{safe_text}"
        )
    return "\n".join(lines)

def _render_earthquake_shake(self) -> str:
    """Port of EarthquakeShakeRenderer: rotation jitter."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    angle_range = int(self.effect_config.get("angle_range", getattr(self.effect, "angle_range", 5)))
    step_ms = int(self.effect_config.get("step_ms", getattr(self.effect, "step_ms", 40)))

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        shake = ""
        curr = 0
        while curr < dur:
            angle = random.randint(-angle_range, angle_range)
            step = step_ms
            shake += f"\\t({curr},{curr + step},\\frz{angle})"
            curr += step

        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy}){shake}}}{safe_text}"
        )
    return "\n".join(lines)

def _render_horror_creepy(self) -> str:
    """Port of HorrorCreepyRenderer: jitter with blur pulses."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    step_ms = int(self.effect_config.get("step_ms", getattr(self.effect, "step_ms", 50)))

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        shake = ""
        curr = 0
        while curr < dur:
            ox = random.randint(-2, 2)
            oy = random.randint(-2, 2)
            fscx = random.randint(95, 105)
            fscy = random.randint(95, 105)
            shake += f"\\t({curr},{curr + step_ms},\\fscx{fscx}\\fscy{fscy}\\pos({cx + ox},{cy + oy}))"
            curr += step_ms

        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur3\\t(0,200,\\blur0){shake}}}{safe_text}"
        )
    return "\n".join(lines)

def _render_luxury_gold(self) -> str:
    """Port of LuxuryGoldRenderer: simple shine color transform."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    shine = self.effect_config.get(
        "shine_tags",
        "\\t(0,100,\\1c&HFFFFFF&)\\t(100,300,\\1c&H00D7FF&)",
    )

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,100){shine}}}{safe_text}"
        )
    return "\n".join(lines)

def _render_comic_book(self) -> str:
    """Port of ComicBookRenderer: rotate and bounce scale."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        rot = random.randint(-5, 5)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\frz{rot}\\fscx50\\fscy50"
            f"\\t(0,100,\\fscx110\\fscy110)\\t(100,150,\\fscx100\\fscy100)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_pulse(self) -> str:
    """Port of PulseRenderer: pulse + expanding rings."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    ring_count = int(self.effect_config.get("ring_count", getattr(self.effect, "ring_count", 3)))
    ring_shape = "m 0 -15 b -21 -15 -21 16 0 16 b 23 16 23 -15 0 -15"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        mid = dur // 2
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        pulse_tags = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(50,50){pulse_tags}}}{safe_text}"
        )

        for i in range(ring_count):
            ring_start = start_ms + i * 100
            ring_end = ring_start + 600
            scale_start = 100 + i * 20
            scale_end = 350 + i * 50
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(ring_start)},{self._ms_to_timestamp(ring_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1a&HFF&\\3c&HFFFFFF&\\bord2\\fscx{scale_start}\\fscy{scale_start}"
                f"\\t(\\fscx{scale_end}\\fscy{scale_end}\\alpha&HFF&)\\p1}}{ring_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_colorful(self) -> str:
    """Port of ColorfulRenderer with color cycle + particles."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    colors = self.effect_config.get(
        "colors",
        ["&H0000FF&", "&H00FFFF&", "&H00FF00&", "&HFFFF00&", "&HFF0000&", "&HFF00FF&"],
    )

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        step = max(1, dur // max(1, len(colors)))

        color_transforms = ""
        for i, color in enumerate(colors):
            t_start = i * step
            t_end = min(dur, (i + 1) * step)
            color_transforms += f"\\t({t_start},{t_end},\\1c{hex_to_ass(color)})"

        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx110\\fscy110\\blur3{color_transforms}\\fad(100,100)}}{safe_text}"
        )

        for _ in range(10):
            px = cx + random.randint(-60, 60)
            py = cy + random.randint(-40, 40)
            ex = px + random.randint(-100, 100)
            ey = py + random.randint(-100, 100)
            p_start = start_ms + random.randint(0, dur // 2)
            p_end = p_start + random.randint(400, 800)
            p_color = hex_to_ass(random.choice(colors))
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({px},{py},{ex},{ey})\\1c{p_color}\\fscx15\\fscy15\\blur4\\fad(0,200)\\p1}}"
                f"m 0 0 l 10 0 10 10 0 10{{\\p0}}"
            )
    return "\n".join(lines)

def _render_ghost_star(self) -> str:
    """Port of GhostStarRenderer with orbiting stars."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    star_shape = "m 30 23 b 24 23 24 33 30 33 b 36 33 37 23 30 23 m 35 27 l 61 28 l 35 29 m 26 27 l 0 28 l 26 29"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur8\\fscx105\\fscy105\\t(\\blur2\\fscx100\\fscy100)\\fad(150,150)}}{safe_text}"
        )

        for _ in range(12):
            sx = cx + random.randint(-100, 100)
            sy = cy + random.randint(-80, 80)
            angle = random.uniform(0, 360)
            distance = random.uniform(80, 150)
            ex = sx + math.cos(math.radians(angle)) * distance
            ey = sy + math.sin(math.radians(angle)) * distance
            s_start = start_ms + random.randint(0, dur)
            s_end = s_start + random.randint(800, 1200)
            size = random.randint(15, 35)
            star_color = hex_to_ass(random.choice(["&HFFFFFF&", "&HFFFF00&", "&H00FFFF&"]))
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({int(sx)},{int(sy)},{int(ex)},{int(ey)})\\fscx{size}\\fscy{size}\\1c{star_color}"
                f"\\blur6\\frz0\\t(\\frz360)\\fad(200,300)\\p1}}{star_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_matrix_rain(self) -> str:
    """Port of MatrixRainRenderer: falling glyphs."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    base_color = hex_to_ass(self.style.get("primary_color", "&H00FF00"))
    chars = "01??????????"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c{base_color}\\fad(100,100)}}{safe_text}"
        )

        for _ in range(15):
            char = random.choice(chars)
            x = cx + random.randint(-200, 200)
            y_start = cy - random.randint(200, 400)
            y_end = cy + random.randint(100, 300)
            c_start = start_ms + random.randint(0, dur)
            c_end = c_start + random.randint(500, 1000)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(c_start)},{self._ms_to_timestamp(c_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({x},{y_start},{x},{y_end})\\1c{base_color}\\alpha&H80&\\fscx50\\fscy50\\fad(0,200)}}{char}"
            )
    return "\n".join(lines)

def _render_electric_shock(self) -> str:
    """Port of ElectricShockRenderer: shake + lightning bolts."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    lightning_shape = "m 0 0 l 5 20 l -3 20 l 8 40 l -10 25 l 0 25"
    base_color = hex_to_ass(self.style.get("primary_color", "&H00FFFF00"))

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        shake = "".join(
            [f"\\t({i*50},{(i+1)*50},\\frz{random.randint(-3,3)})" for i in range(min(dur // 50, 10))]
        )
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c{base_color}{shake}}}{safe_text}"
        )

        for _ in range(6):
            lx = cx + random.randint(-80, 80)
            ly = cy + random.randint(-60, 60)
            l_start = start_ms + random.randint(0, max(1, dur // 2))
            l_end = l_start + random.randint(50, 150)
            rotation = random.randint(0, 360)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(l_start)},{self._ms_to_timestamp(l_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({lx},{ly})\\frz{rotation}\\1c{base_color}\\fscx80\\fscy80\\fad(0,50)\\p1}}"
                f"{lightning_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_smoke_trail(self) -> str:
    """Port of SmokeTrailRenderer: fade-out text with rising smoke."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    smoke_shape = "m 0 0 b 10 -5 20 -5 30 0 b 20 5 10 5 0 0"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,300)\\t({max(dur-200,0)},{dur},\\alpha&HFF&\\blur10)}}{safe_text}"
        )

        for _ in range(10):
            sx = cx + random.randint(-40, 40)
            sy = cy + random.randint(-20, 20)
            ey = sy - random.randint(50, 100)
            s_start = start_ms + random.randint(max(dur // 2, 0), dur)
            s_end = s_start + random.randint(800, 1200)
            size = random.randint(30, 60)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({sx},{sy},{sx + random.randint(-30,30)},{ey})\\fscx{size}\\fscy{size}\\1c&HCCCCCC&"
                f"\\alpha&H40&\\blur8\\t(\\alpha&HFF&\\fscx{size*2}\\fscy{size*2})\\p1}}{smoke_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_pixel_glitch(self) -> str:
    """Port of PixelGlitchRenderer: layered channel glitches."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    colors = self.effect_config.get("colors", ["&HFF0000&", "&H00FF00&", "&H0000FF&", "&HFFFFFF&"])

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        for i, color in enumerate(colors):
            offset_x = random.randint(-5, 5)
            offset_y = random.randint(-3, 3)
            glitch_count = min(dur // 100, 8)
            glitch_times = "".join(
                [
                    f"\\t({j*100},{(j+1)*100},\\pos({cx + random.randint(-10,10)},{cy + random.randint(-5,5)}))"
                    for j in range(glitch_count)
                ]
            )
            lines.append(
                f"Dialogue: {i},{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + offset_x},{cy + offset_y})\\1c{hex_to_ass(color)}\\alpha&H60&{glitch_times}}}{safe_text}"
            )
    return "\n".join(lines)

def _render_neon_sign(self) -> str:
    """Port of NeonSignRenderer: flickering glow."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    primary = hex_to_ass(self.style.get("primary_color", "&H00FF00FF"))
    outline = hex_to_ass(self.style.get("outline_color", "&H00FF00FF"))

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        flicker = ""
        t = 0
        while t < min(dur, 1000):
            if random.random() < 0.3:
                flicker += f"\\t({t},{t+50},\\alpha&HFF&)\\t({t+50},{t+100},\\alpha&H00&)"
                t += 100
            else:
                t += 100

        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c{primary}\\3c{outline}\\bord3\\blur5{flicker}}}{safe_text}"
        )
    return "\n".join(lines)

def _render_fade_in_out(self) -> str:
    """Port of FadeInOutRenderer: sentence-level fade."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    sentence_length = int(self.effect_config.get("sentence_length", 5))

    for sent_start in range(0, len(self.words), sentence_length):
        sent_words = self.words[sent_start:sent_start + sentence_length]
        if not sent_words:
            continue
        start_ms = int(sent_words[0].get("start", 0) * 1000)
        end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
        full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(400,400)}}{full_text}"
        )
    return "\n".join(lines)

def _render_slide_up(self) -> str:
    """Port of SlideUpRenderer: sentence slide from below."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    sentence_length = int(self.effect_config.get("sentence_length", 4))

    for sent_start in range(0, len(self.words), sentence_length):
        sent_words = self.words[sent_start:sent_start + sentence_length]
        if not sent_words:
            continue
        start_ms = int(sent_words[0].get("start", 0) * 1000)
        end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
        full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\move({cx},{cy + 100},{cx},{cy},0,300)\\fad(100,200)}}{full_text}"
        )
    return "\n".join(lines)

def _render_zoom_burst(self) -> str:
    """Port of ZoomBurstRenderer: zoom-in burst per sentence."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    sentence_length = int(self.effect_config.get("sentence_length", 4))

    for sent_start in range(0, len(self.words), sentence_length):
        sent_words = self.words[sent_start:sent_start + sentence_length]
        if not sent_words:
            continue
        start_ms = int(sent_words[0].get("start", 0) * 1000)
        end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
        full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx0\\fscy0\\t(0,300,\\fscx100\\fscy100)\\fad(0,200)}}{full_text}"
        )
    return "\n".join(lines)

def _render_bounce_in(self) -> str:
    """Port of BounceInRenderer: bounce-in sentence animation."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    sentence_length = int(self.effect_config.get("sentence_length", 4))
    bounce = "\\t(0,150,\\fscx120\\fscy120)\\t(150,250,\\fscx95\\fscy95)\\t(250,350,\\fscx105\\fscy105)\\t(350,400,\\fscx100\\fscy100)"

    for sent_start in range(0, len(self.words), sentence_length):
        sent_words = self.words[sent_start:sent_start + sentence_length]
        if not sent_words:
            continue
        start_ms = int(sent_words[0].get("start", 0) * 1000)
        end_ms = int(sent_words[-1].get("end", start_ms / 1000) * 1000)
        full_text = " ".join([(w.get("text") or "").replace("{", r"\{").replace("}", r"\}") for w in sent_words])
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\move({cx},{cy - 100},{cx},{cy},0,400){bounce}\\fad(0,200)}}{full_text}"
        )
    return "\n".join(lines)

def _render_tiktok_yellow_box(self) -> str:
    """TikTok Yellow Box: Opaque box behind each word using BorderStyle=3."""
    cx, cy = self._get_center_coordinates()
    
    # Style parameters
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    
    # Box color from back_color (yellow default) - used as BackColour in BorderStyle=3
    box_color = self.style.get("back_color", "&H00FFFF")
    if not box_color or box_color in ("&H00000000", "#000000", ""):
        box_color = "&H00FFFF"
    box_color = box_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    box_color = f"&H{box_color.upper()}&"
    
    # Text color
    text_color = self.style.get("primary_color", "&H00000000")
    if not text_color:
        text_color = "&H00000000"
    text_color = text_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    text_color = f"&H{text_color.upper()}&"
    
    # Box padding via Outline value (BorderStyle=3 uses Outline for padding)
    box_padding = int(font_size * 0.15)
    
    # Header with BorderStyle=3 (opaque box) - BackColour becomes the box color
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{text_color},{text_color},{box_color},{box_color},{bold},0,0,0,100,100,{letter_spacing},0,3,{box_padding},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Single dialogue line - BorderStyle=3 handles the box automatically
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})"
            f"\\fscx100\\fscy100\\t(0,80,\\fscx105\\fscy105)\\t(80,{dur},\\fscx100\\fscy100)}}"
            f"{text}"
        )
    
    return "\n".join(lines)

def _render_falling_heart(self) -> str:
    """Port of FallingHeartRenderer: text drop + raining hearts."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    heart_shape = "m 18 40 b 23 29 35 27 35 16 b 36 8 23 0 18 11 b 14 0 0 8 1 16 b 1 27 14 29 18 40"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\move({cx},{cy-50},{cx},{cy})\\frz{random.randint(-20, 20)}\\t(\\frz0)\\fad(300,100)}}{safe_text}"
        )

        for _ in range(15):
            hx = cx + random.randint(-80, 80)
            hy = cy - random.randint(50, 100)
            ey = cy + random.randint(50, 150)
            h_start = start_ms + random.randint(0, dur)
            h_end = h_start + random.randint(1000, 1500)
            size = random.randint(20, 40)
            rotation = random.choice([-500, 500, -700, 700])
            color = hex_to_ass(random.choice(["&HFF69B4&", "&HFF1493&", "&HFF00FF&"]))
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(h_start)},{self._ms_to_timestamp(h_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({hx},{hy},{hx + random.randint(-50, 50)},{ey})\\fscx{size}\\fscy{size}\\1c{color}"
                f"\\blur5\\frz0\\t(\\frz{rotation})\\fad(300,300)\\p1}}{heart_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_thunder_storm(self) -> str:
    """Port of ThunderStormRenderer: multi-layer storm."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    lightning = "m 0 0 l 5 20 l -3 20 l 8 40 l -10 25 l 0 25"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        # Clouds
        for _ in range(5):
            cloud_x = cx + random.randint(-150, 150)
            cloud_y = cy - random.randint(80, 120)
            cloud_size = random.randint(60, 100)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cloud_x},{cloud_y})\\fscx{cloud_size}\\fscy{cloud_size}\\1c&H404040&\\alpha&H60&\\blur20}}?"
            )

        # Electric flashes + base text
        for flash in range(3):
            flash_start = start_ms + flash * (dur // 3)
            flash_end = flash_start + 100
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(flash_start)},{self._ms_to_timestamp(flash_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&\\bord3\\3c&HFFFF00&\\blur5}}{safe_text}"
            )
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00FFFF&\\bord2\\3c&H0000FF&\\blur2}}{safe_text}"
        )

        # Lightning bolts
        for _ in range(15):
            lx = cx + random.randint(-120, 120)
            ly = cy - random.randint(100, 150)
            l_start = start_ms + random.randint(0, dur)
            l_end = l_start + random.randint(50, 150)
            rotation = random.randint(-30, 30)
            scale = random.randint(80, 150)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(l_start)},{self._ms_to_timestamp(l_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({lx},{ly})\\frz{rotation}\\fscx{scale}\\fscy{scale}\\1c&HFFFF00&\\blur3\\fad(0,50)\\p1}}"
                f"{lightning}{{\\p0}}"
            )

        # Sparks
        for _ in range(30):
            sx = cx + random.randint(-100, 100)
            sy = cy + random.randint(-60, 60)
            s_end_x = sx + random.randint(-40, 40)
            s_end_y = sy + random.randint(-40, 40)
            s_start = start_ms + random.randint(0, dur)
            s_end = s_start + random.randint(100, 300)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({sx},{sy},{s_end_x},{s_end_y})\\1c&H00FFFF&\\blur2\\fscx5\\fscy5}}?"
            )

        # Rain
        for _ in range(20):
            rx = cx + random.randint(-200, 200)
            ry_start = cy - random.randint(150, 200)
            ry_end = cy + random.randint(100, 150)
            r_start = start_ms + random.randint(0, dur)
            r_end = r_start + random.randint(400, 600)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(r_start)},{self._ms_to_timestamp(r_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({rx},{ry_start},{rx},{ry_end})\\1c&H808080&\\alpha&H80&\\fscx2\\fscy30\\blur1}}|"
            )

        # Flashes
        for i in range(4):
            flash_start = start_ms + i * (dur // 4)
            flash_end = flash_start + 80
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(flash_start)},{self._ms_to_timestamp(flash_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fscx400\\fscy400\\1c&HFFFFFF&\\alpha&H00&\\blur30\\t(\\alpha&HFF&)}}?"
            )
    return "\n".join(lines)

def _render_ice_crystal(self) -> str:
    """Port of IceCrystalRenderer: icy glow + shards + snow."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    crystal_shape = "m 0 -20 l 5 -5 20 0 5 5 0 20 -5 5 -20 0 -5 -5"
    snowflake = "m 0 -15 l 0 15 m -15 0 l 15 0 m -10 -10 l 10 10 m -10 10 l 10 -10"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        ice_colors = ["&HFFFF00&", "&HFFAA00&", "&HFF8800&"]
        for i, color in enumerate(ice_colors):
            offset = (i - 1) * 3
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur18\\alpha&H70&}}{safe_text}"
            )

        for i in range(3):
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + i},{cy + i})\\1c&HFFFFFF&\\bord2\\3c&HDDFFFF&\\blur1\\fscx110\\fscy110}}{safe_text}"
            )

        for i in range(30):
            angle = (i * 360 / 30) + random.randint(-10, 10)
            distance_start = 30
            distance_end = random.randint(120, 200)
            angle_rad = math.radians(angle)
            cx_start = cx + int(math.cos(angle_rad) * distance_start)
            cy_start = cy + int(math.sin(angle_rad) * distance_start)
            cx_end = cx + int(math.cos(angle_rad) * distance_end)
            cy_end = cy + int(math.sin(angle_rad) * distance_end)
            c_start = start_ms + random.randint(0, dur // 3)
            c_end = c_start + random.randint(600, 1000)
            scale = random.randint(20, 50)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(c_start)},{self._ms_to_timestamp(c_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({cx_start},{cy_start},{cx_end},{cy_end})\\fscx{scale}\\fscy{scale}\\1c&HFFFFFF&\\blur4"
                f"\\frz{random.randint(0,360)}\\t(\\frz{random.randint(360,720)})\\t(\\alpha&HFF&)\\p1}}{crystal_shape}{{\\p0}}"
            )

        for _ in range(25):
            px = cx + random.randint(-150, 150)
            py = cy + random.randint(-100, 100)
            p_start = start_ms + random.randint(0, dur)
            p_end = p_start + random.randint(400, 800)
            p_size = random.randint(5, 15)
            fade_mid = (p_end - p_start) // 2
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\fscx{p_size}\\fscy{p_size}\\1c&HDDFFFF&\\blur2"
                f"\\t(0,{fade_mid},\\alpha&H00&)\\t({fade_mid},{p_end - p_start},\\alpha&HFF&)}}?"
            )

        for _ in range(12):
            sx = cx + random.randint(-100, 100)
            sy = cy + random.randint(-80, 80)
            s_start = start_ms + random.randint(0, dur // 2)
            s_end = s_start + random.randint(1000, 1500)
            s_size = random.randint(25, 45)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({sx},{sy})\\fscx{s_size}\\fscy{s_size}\\1c&HFFFFFF&\\blur3\\frz0\\t(\\frz360)\\p1}}"
                f"{snowflake}{{\\p0}}"
            )

        shard_shape = "m 0 0 l 3 -25 l 6 0"
        for i in range(8):
            angle = i * 45
            shard_x = cx + int(math.cos(math.radians(angle)) * 60)
            shard_y = cy + int(math.sin(math.radians(angle)) * 60)
            sh_start = start_ms
            sh_end = start_ms + 400
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(sh_start)},{self._ms_to_timestamp(sh_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({shard_x},{shard_y})\\frz{angle}\\fscx80\\fscy80\\1c&HFFFFFF&\\blur2"
                f"\\t(\\fscx0\\fscy0\\alpha&HFF&)\\p1}}{shard_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_cosmic_stars(self) -> str:
    """Port of CosmicStarsRenderer: galaxy glow + orbiting stars."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    star_shape = "m 0 -20 l 5 -5 20 0 5 5 0 20 -5 5 -20 0 -5 -5"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        cosmic_colors = ["&HFF00FF&", "&HFF00AA&", "&HFF0066&"]
        for i, color in enumerate(cosmic_colors):
            offset = (i - 1) * 4
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur25\\alpha&H60&"
                f"\\t(0,{dur//2},\\blur30)\\t({dur//2},{dur},\\blur25)}}{safe_text}"
            )

        galaxy_layers = [("&HFF00FF&", 0, 0), ("&HFF00AA&", 2, 1), ("&HFF0066&", 4, 2)]
        for color, ox, oy in galaxy_layers:
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + ox},{cy + oy})\\1c{hex_to_ass(color)}\\bord2\\3c&HFFFFFF&\\blur2\\fscx115\\fscy115}}"
                f"{safe_text}"
            )

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
            s_start = start_ms + random.randint(0, dur // 3)
            s_end = s_start + random.randint(1000, 1500)
            s_size = random.randint(25, 50)
            star_color = hex_to_ass(random.choice(["&HFFFFFF&", "&HFFFF00&", "&HFF00FF&", "&H00FFFF&"]))
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({sx_start},{sy_start},{sx_end},{sy_end})\\fscx{s_size}\\fscy{s_size}\\1c{star_color}\\blur5"
                f"\\frz0\\t(\\frz360)\\t(\\alpha&HFF&)\\p1}}{star_shape}{{\\p0}}"
            )

        for _ in range(40):
            dx = cx + random.randint(-150, 150)
            dy = cy + random.randint(-100, 100)
            d_start = start_ms + random.randint(0, dur)
            d_end = d_start + random.randint(300, 600)
            d_size = random.randint(3, 10)
            dust_color = hex_to_ass(random.choice(["&HFFFFFF&", "&HFFCCFF&", "&HCCFFFF&"]))
            fade_mid = (d_end - d_start) // 2
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(d_start)},{self._ms_to_timestamp(d_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({dx},{dy})\\fscx{d_size}\\fscy{d_size}\\1c{dust_color}\\blur2"
                f"\\t(0,{fade_mid},\\alpha&H00&)\\t({fade_mid},{d_end - d_start},\\alpha&HFF&)}}?"
            )

        for _ in range(8):
            nx = cx + random.randint(-120, 120)
            ny = cy + random.randint(-80, 80)
            n_size = random.randint(80, 140)
            nebula_color = hex_to_ass(random.choice(["&HFF00FF&", "&HFF0088&", "&H8800FF&"]))
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({nx},{ny})\\fscx{n_size}\\fscy{n_size}\\1c{nebula_color}\\alpha&HC0&\\blur30}}?"
            )

        for _ in range(6):
            shoot_x_start = cx + random.randint(-200, 200)
            shoot_y_start = cy - random.randint(100, 150)
            shoot_x_end = shoot_x_start + random.randint(100, 200)
            shoot_y_end = shoot_y_start + random.randint(100, 200)
            sh_start = start_ms + random.randint(0, dur)
            sh_end = sh_start + random.randint(400, 700)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(sh_start)},{self._ms_to_timestamp(sh_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({shoot_x_start},{shoot_y_start},{shoot_x_end},{shoot_y_end})\\1c&HFFFFFF&\\blur8"
                f"\\fscx80\\fscy3\\frz45\\t(\\alpha&HFF&)}}?"
            )
    return "\n".join(lines)

def _render_ocean_wave(self) -> str:
    """Port of OceanWaveRenderer: water glow, bubbles, foam."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    bubble_shape = "m 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 16 0 16 0 16 b 0 0 20 0 20 16 b 20 16 20 16 20 16 b 20 33 0 33 0 16"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        water_colors = ["&HFF8800&", "&HFFAA00&", "&HFFCC00&"]
        for i, color in enumerate(water_colors):
            offset = (i - 1) * 3
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur20\\alpha&H70&}}{safe_text}"
            )

        wave_count = 5
        for i in range(wave_count):
            wave_offset = int(math.sin((i / wave_count) * math.pi * 2) * 10)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy + wave_offset})\\1c&H00CCFF&\\bord2\\3c&H0088FF&\\blur1}}{safe_text}"
            )

        for i in range(40):
            angle = (i * 360 / 40)
            radius = random.randint(60, 120)
            angle_rad = math.radians(angle)
            wx = cx + int(math.cos(angle_rad) * radius)
            wy = cy + int(math.sin(angle_rad) * radius) + int(math.sin(angle_rad * 3) * 20)
            w_start = start_ms + random.randint(0, dur // 2)
            w_end = w_start + random.randint(800, 1200)
            w_size = random.randint(15, 35)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(w_start)},{self._ms_to_timestamp(w_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({wx},{wy})\\fscx{w_size}\\fscy{w_size}\\1c&H00AAFF&\\blur4\\t(\\alpha&HFF&)}}?"
            )

        for _ in range(20):
            bx = cx + random.randint(-100, 100)
            by_start = cy + random.randint(40, 80)
            by_end = cy - random.randint(80, 120)
            b_start = start_ms + random.randint(0, dur)
            b_end = b_start + random.randint(1000, 1500)
            b_size = random.randint(20, 40)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(b_start)},{self._ms_to_timestamp(b_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({bx},{by_start},{bx + random.randint(-20,20)},{by_end})\\fscx{b_size}\\fscy{b_size}"
                f"\\1c&H00DDFF&\\blur5\\t(\\alpha&HFF&)\\p1}}{bubble_shape}{{\\p0}}"
            )

        for _ in range(15):
            fx = cx + random.randint(-120, 120)
            fy = cy + random.randint(-40, 40)
            f_start = start_ms + random.randint(0, dur)
            f_end = f_start + random.randint(400, 700)
            f_size = random.randint(10, 25)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(f_start)},{self._ms_to_timestamp(f_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({fx},{fy})\\fscx{f_size}\\fscy{f_size}\\1c&HFFFFFF&\\alpha&H40&\\blur8"
                f"\\t(\\fscx{f_size*2}\\alpha&HFF&)}}?"
            )

        for i in range(3):
            wave_y = cy + (i - 1) * 40
            w_start = start_ms + i * (dur // 3)
            w_end = w_start + 500
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(w_start)},{self._ms_to_timestamp(w_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{wave_y})\\fscx300\\fscy15\\1c&H00AAFF&\\alpha&H80&\\blur10\\t(\\fscx400\\alpha&HFF&)}}~"
            )
    return "\n".join(lines)

def _render_butterfly_dance(self) -> str:
    """Port of ButterflyDanceRenderer: butterflies, petals, glow."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    butterfly_shape = "m 10 15 b 5 10 0 5 0 0 b 0 5 5 10 10 15 m 10 15 b 15 10 20 5 20 0 b 20 5 15 10 10 15"

    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")

        flower_colors = ["&HFF69B4&", "&HFF1493&", "&HFF00FF&"]
        for i, color in enumerate(flower_colors):
            offset = (i - 1) * 3
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + offset},{cy + offset})\\1c{hex_to_ass(color)}\\blur18\\alpha&H70&}}{safe_text}"
            )

        spring_layers = [("&HFF1493&", 0, 0), ("&HFF69B4&", 2, 1), ("&HFFC0CB&", 4, 2)]
        for color, ox, oy in spring_layers:
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + ox},{cy + oy})\\1c{hex_to_ass(color)}\\bord2\\3c&H00FF00&\\blur1\\fscx110\\fscy110}}"
                f"{safe_text}"
            )

        for i in range(18):
            t_start = i / 18
            angle1 = t_start * 360 * 2
            angle2 = (t_start + 0.5) * 360 * 2
            radius = 100
            bx_start = cx + int(math.cos(math.radians(angle1)) * radius)
            by_start = cy + int(math.sin(math.radians(angle1) * 2) * 50)
            bx_end = cx + int(math.cos(math.radians(angle2)) * radius)
            by_end = cy + int(math.sin(math.radians(angle2) * 2) * 50)
            b_start = start_ms + random.randint(0, dur // 2)
            b_end = b_start + random.randint(1200, 1800)
            b_size = random.randint(30, 50)
            butterfly_color = hex_to_ass(random.choice(["&HFF69B4&", "&HFF00FF&", "&H00FFFF&", "&HFFFF00&"]))
            wing_flap = "\\t(0,150,\\fscx110\\fscy90)\\t(150,300,\\fscx100\\fscy100)\\t(300,450,\\fscx110\\fscy90)\\t(450,600,\\fscx100\\fscy100)"
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(b_start)},{self._ms_to_timestamp(b_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({bx_start},{by_start},{bx_end},{by_end})\\fscx{b_size}\\fscy{b_size}\\1c{butterfly_color}"
                f"\\blur4{wing_flap}\\frz{random.randint(0,360)}\\p1}}{butterfly_shape}{{\\p0}}"
            )

        for _ in range(25):
            px = cx + random.randint(-120, 120)
            py_start = cy - random.randint(80, 120)
            py_end = cy + random.randint(80, 120)
            p_start = start_ms + random.randint(0, dur)
            p_end = p_start + random.randint(1500, 2000)
            p_size = random.randint(15, 30)
            petal_color = hex_to_ass(random.choice(["&HFFC0CB&", "&HFF69B4&", "&HFFFFFF&"]))
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({px},{py_start},{px + random.randint(-40,40)},{py_end})\\fscx{p_size}\\fscy{p_size}\\1c{petal_color}"
                f"\\blur5\\frz0\\t(\\frz{random.randint(360,720)})\\t(\\alpha&HFF&)}}??"
            )

        for _ in range(30):
            sx = cx + random.randint(-150, 150)
            sy = cy + random.randint(-100, 100)
            s_start = start_ms + random.randint(0, dur)
            s_end = s_start + random.randint(300, 600)
            s_size = random.randint(8, 18)
            fade_mid = (s_end - s_start) // 2
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({sx},{sy})\\fscx{s_size}\\fscy{s_size}\\1c&HFFFF00&\\blur3"
                f"\\t(0,{fade_mid},\\alpha&H00&)\\t({fade_mid},{s_end - s_start},\\alpha&HFF&)\\frz0\\t(\\frz360)}}?"
            )

        for i in range(5):
            breeze_y = cy + (i - 2) * 30
            br_start = start_ms + i * (dur // 5)
            br_end = br_start + 600
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(br_start)},{self._ms_to_timestamp(br_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{breeze_y})\\fscx250\\fscy10\\1c&H00FF00&\\alpha&HD0&\\blur12\\t(\\fscx350\\alpha&HFF&)}}~"
            )
    return "\n".join(lines)

def _render_neon_pulse(self) -> str:
    """Simple neon-style pulse."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        mid = dur // 2
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        anim = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(50,50){anim}}}{safe_text}"
        )
    return "\n".join(lines)

def _render_kinetic_bounce(self) -> str:
    """Bounce-in with squash/stretch."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\move({cx},{cy-100},{cx},{cy},0,150)\\t(150,250,\\fscx120\\fscy80)\\t(250,400,\\fscx100\\fscy100)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_cinematic_blur(self) -> str:
    """Blur in/out around timing window."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur20\\t(0,150,\\blur0)\\t({max(dur-150,0)},{dur},\\blur20)\\fad(100,100)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_typewriter_pro(self) -> str:
    """Rotate-in typewriter effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\frz90\\t(0,100,\\frz0)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_word_pop(self) -> str:
    """Scale pop per word."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,80,\\fscx110\\fscy110)\\t(80,150,\\fscx100\\fscy100)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_retro_arcade(self) -> str:
    """Static retro placeholder."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})}}{safe_text}"
        )
    return "\n".join(lines)

def _render_news_ticker(self) -> str:
    """Slide-up ticker feel."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\move({cx},{cy+20},{cx},{cy},0,100)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_tiktok_group(self) -> str:
    """Dynamic word grouping with current word emphasis (yellow, larger)."""
    cx, cy = self._get_center_coordinates()
    
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    border = float(self.style.get("border", 2))
    
    primary_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
    secondary_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
    outline_color = hex_to_ass(self.style.get("outline_color", "&H00000000"))
    
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{primary_color},{secondary_color},{outline_color},&H00000000&,{bold},0,0,0,100,100,{letter_spacing},0,1,{border},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    groups = self._create_word_groups()
    
    for group in groups:
        if not group:
            continue
        
        group_start_ms = int(group[0].get("start", 0) * 1000)
        group_end_ms = int(group[-1].get("end", group_start_ms / 1000) * 1000)
        
        for word_idx, active_word in enumerate(group):
            word_start_ms = int(active_word.get("start", 0) * 1000)
            
            if word_idx < len(group) - 1:
                line_end_ms = int(group[word_idx + 1].get("start", 0) * 1000)
            else:
                line_end_ms = int(active_word.get("end", word_start_ms / 1000) * 1000)
            
            text_parts = []
            for idx, w in enumerate(group):
                word_text = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                
                if idx == word_idx:
                    # Active word: yellow, larger, with blur
                    text_parts.append(
                        f"{{\\1c&HFFFF00&\\alpha&H00&\\fscx120\\fscy120\\blur3}}{word_text}{{\\fscx100\\fscy100\\blur0\\1c{primary_color}}}"
                    )
                else:
                    # Inactive word: dimmed
                    text_parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{word_text}{{\\alpha&H00&\\fscx100\\fscy100}}")
            
            full_text = " ".join(text_parts)
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(line_end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full_text}"
            )
    
    return "\n".join(lines)

def _render_spin_3d(self) -> str:
    """Simple 3D spin using rotations."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\frx10\\fry20\\frz0\\t(0,{dur//2},\\frz360)\\t({dur//2},{dur},\\frz720)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_shear_force(self) -> str:
    """Sheared text with slight shake."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fax-0.3\\t(0,200,\\fax0.1)\\t(200,400,\\fax-0.1)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_double_shadow(self) -> str:
    """Primary text plus two shadow copies."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        # Shadow layers
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx+3},{cy+3})\\1c&H000000&\\alpha&H80&\\blur3}}{safe_text}"
        )
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx-3},{cy-3})\\1c&H808080&\\alpha&H80&\\blur3}}{safe_text}"
        )
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})}}{safe_text}"
        )
    return "\n".join(lines)

def _render_karaoke_classic(self) -> str:
    """Dynamic word grouping with current word bright (yellow, larger), neighbors dimmed."""
    cx, cy = self._get_center_coordinates()
    
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    border = float(self.style.get("border", 2))
    
    primary_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
    secondary_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
    outline_color = hex_to_ass(self.style.get("outline_color", "&H00000000"))
    
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{primary_color},{secondary_color},{outline_color},&H00000000&,{bold},0,0,0,100,100,{letter_spacing},0,1,{border},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    groups = self._create_word_groups()
    
    for group in groups:
        if not group:
            continue
        
        group_start_ms = int(group[0].get("start", 0) * 1000)
        group_end_ms = int(group[-1].get("end", group_start_ms / 1000) * 1000)
        
        for word_idx, active_word in enumerate(group):
            word_start_ms = int(active_word.get("start", 0) * 1000)
            
            if word_idx < len(group) - 1:
                line_end_ms = int(group[word_idx + 1].get("start", 0) * 1000)
            else:
                line_end_ms = int(active_word.get("end", word_start_ms / 1000) * 1000)
            
            text_parts = []
            for idx, w in enumerate(group):
                word_text = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                
                if idx == word_idx:
                    # Active word: yellow, larger, with blur
                    text_parts.append(
                        f"{{\\1c&HFFFF00&\\alpha&H00&\\fscx130\\fscy130\\blur4}}{word_text}{{\\fscx100\\fscy100\\blur0\\1c{primary_color}}}"
                    )
                else:
                    # Inactive word: dimmed
                    text_parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{word_text}{{\\alpha&H00&\\fscx100\\fscy100}}")
            
            full_text = " ".join(text_parts)
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(line_end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full_text}"
            )
    
    return "\n".join(lines)

def _render_karaoke_pro(self) -> str:
    """Dynamic word grouping with past/current/future colors and scale animation on current word."""
    cx, cy = self._get_center_coordinates()
    
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    border = float(self.style.get("border", 2))
    
    primary_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
    secondary_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
    outline_color = hex_to_ass(self.style.get("outline_color", "&H00000000"))
    color_past = hex_to_ass(self.style.get("color_past", "&H00808080"))
    color_future = hex_to_ass(self.style.get("color_future", "&H00808080"))
    
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{primary_color},{secondary_color},{outline_color},&H00000000&,{bold},0,0,0,100,100,{letter_spacing},0,1,{border},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    groups = self._create_word_groups()
    
    for group in groups:
        if not group:
            continue
        
        group_start_ms = int(group[0].get("start", 0) * 1000)
        group_end_ms = int(group[-1].get("end", group_start_ms / 1000) * 1000)
        
        for word_idx, active_word in enumerate(group):
            word_start_ms = int(active_word.get("start", 0) * 1000)
            word_end_ms = int(active_word.get("end", word_start_ms / 1000) * 1000)
            dur = max(1, word_end_ms - word_start_ms)
            
            if word_idx < len(group) - 1:
                line_end_ms = int(group[word_idx + 1].get("start", 0) * 1000)
            else:
                line_end_ms = word_end_ms
            
            text_parts = []
            for idx, w in enumerate(group):
                word_text = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                
                if idx < word_idx:
                    # Past word: past color, dimmed
                    text_parts.append(f"{{\\1c{color_past}\\alpha&H60&\\fscx90\\fscy90}}{word_text}{{\\alpha&H00&\\fscx100\\fscy100}}")
                elif idx == word_idx:
                    # Current word: primary color with scale animation
                    text_parts.append(
                        f"{{\\1c{primary_color}\\3c{outline_color}\\alpha&H00&\\t(0,100,\\fscx115\\fscy115)\\t(100,{dur},\\fscx100\\fscy100)}}{word_text}"
                    )
                else:
                    # Future word: future color, dimmed
                    text_parts.append(f"{{\\1c{color_future}\\alpha&H60&\\fscx90\\fscy90}}{word_text}{{\\alpha&H00&\\fscx100\\fscy100}}")
            
            full_text = " ".join(text_parts)
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(line_end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full_text}"
            )
    
    return "\n".join(lines)

def _render_karaoke_sentence(self) -> str:
    """Dynamic word grouping (2-3 words) with active word highlight and scale animation."""
    cx, cy = self._get_center_coordinates()
    
    # Style parameters
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    border = float(self.style.get("border", 1.5))
    
    # Colors - primary for inactive, secondary for active word
    primary_color = self.style.get("primary_color", "&H00FFFFFF")
    if not primary_color:
        primary_color = "&H00FFFFFF"
    primary_color = primary_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    primary_color = f"&H{primary_color.upper()}&"
    
    secondary_color = self.style.get("secondary_color", "&H0000FFFF")
    if not secondary_color:
        secondary_color = "&H0000FFFF"
    secondary_color = secondary_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    secondary_color = f"&H{secondary_color.upper()}&"
    
    outline_color = self.style.get("outline_color", "&H00000000")
    if not outline_color:
        outline_color = "&H00000000"
    outline_color = outline_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    outline_color = f"&H{outline_color.upper()}&"
    
    # Header
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{primary_color},{secondary_color},{outline_color},&H00000000&,{bold},0,0,0,100,100,{letter_spacing},0,1,{border},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    
    # Use shared helper for dynamic grouping
    groups = self._create_word_groups()
    
    # Generate dialogue lines for each group
    for group in groups:
        if not group:
            continue
        
        group_start_ms = int(group[0].get("start", 0) * 1000)
        group_end_ms = int(group[-1].get("end", group_start_ms / 1000) * 1000)
        
        # For each word in the group, create a dialogue line showing the entire group
        # but highlighting only the active word
        for word_idx, active_word in enumerate(group):
            word_start_ms = int(active_word.get("start", 0) * 1000)
            
            # Calculate end time: next word's start or group end for last word
            if word_idx < len(group) - 1:
                # Not last word: end when next word starts
                next_word_start_ms = int(group[word_idx + 1].get("start", 0) * 1000)
                line_end_ms = next_word_start_ms
            else:
                # Last word: end when the word (and group) ends
                line_end_ms = int(active_word.get("end", word_start_ms / 1000) * 1000)
            
            # Build the text with inline style overrides
            text_parts = []
            for idx, w in enumerate(group):
                word_text = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                
                if idx == word_idx:
                    # Active word: secondary color + slight scale up
                    # Use \t for smooth transition
                    text_parts.append(
                        f"{{\\1c{secondary_color}\\fscx108\\fscy108}}{word_text}{{\\fscx100\\fscy100\\1c{primary_color}}}"
                    )
                else:
                    # Inactive word: primary color, normal scale
                    text_parts.append(f"{word_text}")
            
            full_text = " ".join(text_parts)
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(line_end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})}}{full_text}"
            )
    
    return "\n".join(lines)

def _render_karaoke_sentence_box(self) -> str:
    """Dynamic word grouping (2-3 words) with animated box sliding between fixed-position words."""
    cx, cy = self._get_center_coordinates()
    
    # Style parameters
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    border = float(self.style.get("border", 1.5))
    
    # Colors - primary for inactive, secondary for active word text
    primary_color = self.style.get("primary_color", "&H00FFFFFF")
    if not primary_color:
        primary_color = "&H00FFFFFF"
    primary_color = primary_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    primary_color = f"&H{primary_color.upper()}&"
    
    secondary_color = self.style.get("secondary_color", "&H00000000")
    if not secondary_color:
        secondary_color = "&H00000000"
    secondary_color = secondary_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    secondary_color = f"&H{secondary_color.upper()}&"
    
    outline_color = self.style.get("outline_color", "&H00000000")
    if not outline_color:
        outline_color = "&H00000000"
    outline_color = outline_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    outline_color = f"&H{outline_color.upper()}&"
    
    # Box color from back_color (yellow default for TikTok style)
    box_color = self.style.get("back_color", "&H0000FFFF")
    if not box_color or box_color in ("&H00000000", "#000000", ""):
        box_color = "&H0000FFFF"
    box_color = box_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    box_color = f"&H{box_color.upper()}&"
    
    # Box padding via Outline value for active word
    box_padding = int(font_size * 0.15)
    
    # Transition duration in ms
    transition_ms = 150
    
    # Header with styles
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{primary_color},{primary_color},{outline_color},&H00000000&,{bold},0,0,0,100,100,{letter_spacing},0,1,{border},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    
    # Use shared helper for dynamic grouping
    groups = self._create_word_groups()
    
    # Generate dialogue lines for each group
    for group in groups:
        if not group:
            continue
        
        group_start_ms = int(group[0].get("start", 0) * 1000)
        group_end_ms = int(group[-1].get("end", group_start_ms / 1000) * 1000)
        
        # For each word timing, show the entire group with appropriate styling
        for word_idx, active_word in enumerate(group):
            word_start_ms = int(active_word.get("start", 0) * 1000)
            word_end_ms = int(active_word.get("end", word_start_ms / 1000) * 1000)
            word_dur = max(1, word_end_ms - word_start_ms)
            
            # Calculate end time: next word's start or group end for last word
            if word_idx < len(group) - 1:
                # Not last word: end when next word starts
                next_word_start_ms = int(group[word_idx + 1].get("start", 0) * 1000)
                line_end_ms = next_word_start_ms
            else:
                # Last word: end when the word (and group) ends
                line_end_ms = word_end_ms
            
            # Build text with inline styles - all words in one line
            # Inactive words: normal style
            # Active word: BorderStyle=3 with box color using inline override
            text_parts = []
            
            for idx, w in enumerate(group):
                word_text = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                
                if idx == word_idx:
                    # Active word with box (BorderStyle=3 via inline \bord and \3c)
                    # Use \bord for outline size, \3c for outline/box color
                    if word_idx == 0:
                        # First word - pop in animation
                        text_parts.append(
                            f"{{\\bord{box_padding}\\3c{box_color}\\1c{secondary_color}"
                            f"\\fscx100\\fscy100\\t(0,{transition_ms},\\fscx108\\fscy108)"
                            f"\\t({transition_ms},{word_dur},\\fscx105\\fscy105)}}"
                            f"{word_text}"
                            f"{{\\bord{border}\\3c{outline_color}\\1c{primary_color}\\fscx100\\fscy100}}"
                        )
                    else:
                        # Subsequent words - scale animation
                        text_parts.append(
                            f"{{\\bord{box_padding}\\3c{box_color}\\1c{secondary_color}"
                            f"\\fscx95\\fscy95\\t(0,{transition_ms},\\fscx108\\fscy108)"
                            f"\\t({transition_ms},{word_dur},\\fscx105\\fscy105)}}"
                            f"{word_text}"
                            f"{{\\bord{border}\\3c{outline_color}\\1c{primary_color}\\fscx100\\fscy100}}"
                        )
                else:
                    # Inactive word - normal style
                    text_parts.append(word_text)
            
            full_text = " ".join(text_parts)
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(line_end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})}}{full_text}"
            )
    
    return "\n".join(lines)

def _render_dynamic_highlight(self) -> str:
    """Dynamic word grouping with highlight transition (primary to secondary) on current word."""
    cx, cy = self._get_center_coordinates()
    
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    border = float(self.style.get("border", 2))
    
    primary_color = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
    secondary_color = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
    outline_color = hex_to_ass(self.style.get("outline_color", "&H00000000"))
    
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{primary_color},{secondary_color},{outline_color},&H00000000&,{bold},0,0,0,100,100,{letter_spacing},0,1,{border},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    groups = self._create_word_groups()
    
    for group in groups:
        if not group:
            continue
        
        group_start_ms = int(group[0].get("start", 0) * 1000)
        group_end_ms = int(group[-1].get("end", group_start_ms / 1000) * 1000)
        
        for word_idx, active_word in enumerate(group):
            word_start_ms = int(active_word.get("start", 0) * 1000)
            word_end_ms = int(active_word.get("end", word_start_ms / 1000) * 1000)
            word_dur = max(1, word_end_ms - word_start_ms)
            
            if word_idx < len(group) - 1:
                line_end_ms = int(group[word_idx + 1].get("start", 0) * 1000)
            else:
                line_end_ms = word_end_ms
            
            text_parts = []
            for idx, w in enumerate(group):
                word_text = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
                
                if idx == word_idx:
                    # Active word: animate color from primary to secondary and back
                    text_parts.append(
                        f"{{\\1c{primary_color}\\t(0,150,\\1c{secondary_color})\\t({max(word_dur-150,0)},{word_dur},\\1c{primary_color})}}{word_text}"
                    )
                else:
                    # Other words: primary color
                    text_parts.append(f"{{\\1c{primary_color}}}{word_text}")
            
            full_text = " ".join(text_parts)
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(line_end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full_text}"
            )
    
    return "\n".join(lines)

def _render_tiktok_box_group(self) -> str:
    """Grouped opaque box around current word using BorderStyle=3."""
    cx, cy = self._get_center_coordinates()
    
    # Style parameters
    font = self.style.get("font", "Arial")
    font_size = int(self.style.get("font_size", 72))
    bold = self.style.get("bold", 1)
    letter_spacing = int(self.style.get("letter_spacing", 0))
    
    # Box color from back_color (yellow default)
    box_color = self.style.get("back_color", "&H00FFFF")
    if not box_color or box_color in ("&H00000000", "#000000", ""):
        box_color = "&H00FFFF"
    box_color = box_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    box_color = f"&H{box_color.upper()}&"
    
    # Text color
    text_color = self.style.get("primary_color", "&H00000000")
    if not text_color:
        text_color = "&H00000000"
    text_color = text_color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
    text_color = f"&H{text_color.upper()}&"
    
    # Box padding via Outline value
    box_padding = int(font_size * 0.15)
    
    # Header with BorderStyle=3 (opaque box)
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{text_color},{text_color},{box_color},{box_color},{bold},0,0,0,100,100,{letter_spacing},0,3,{box_padding},0,5,10,10,10,0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    lines: List[str] = [header]
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Single dialogue line - BorderStyle=3 handles the box automatically
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})"
            f"\\fscx100\\fscy100\\t(0,100,\\fscx108\\fscy108)\\t(100,{dur},\\fscx100\\fscy100)}}"
            f"{text}"
        )
    
    return "\n".join(lines)

def _render_sakura_dream(self) -> str:
    """Petal drift with soft glow."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    petal_shape = "m 0 0 b 10 -5 20 -5 30 0 b 20 5 10 5 0 0"
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00FF69B4&\\blur4\\fad(150,150)}}{safe_text}"
        )
        for _ in range(20):
            px = cx + random.randint(-150, 150)
            py = cy - random.randint(50, 150)
            py_end = py + random.randint(120, 220)
            p_start = start_ms + random.randint(0, dur)
            p_end = p_start + random.randint(800, 1400)
            size = random.randint(20, 40)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({px},{py},{px + random.randint(-40,40)},{py_end})\\fscx{size}\\fscy{size}"
                f"\\1c&H00FFC0CB&\\blur6\\frz{random.randint(0,360)}\\t(\\frz{random.randint(360,720)})\\fad(0,200)\\p1}}"
                f"{petal_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_phoenix_flames(self) -> str:
    """Rising flame particles."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    flame_shape = "m 0 0 b 5 -10 10 -10 15 0 b 10 15 5 15 0 0"
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0000FF&\\bord2\\3c&H00FFFF00&\\blur1}}{safe_text}"
        )
        for _ in range(18):
            sx = cx + random.randint(-80, 80)
            sy = cy + random.randint(-20, 20)
            ex = sx + random.randint(-30, 30)
            ey = sy - random.randint(120, 200)
            f_start = start_ms + random.randint(0, dur)
            f_end = f_start + random.randint(700, 1200)
            size = random.randint(20, 50)
            color = hex_to_ass(random.choice(["&H00FF8800&", "&H00FFAA00&", "&H00FF4500&"]))
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(f_start)},{self._ms_to_timestamp(f_end)},Default,,0,0,0,,"
                f"{{\\an5\\move({sx},{sy},{ex},{ey})\\fscx{size}\\fscy{size}\\1c{color}\\blur4\\fad(0,200)\\p1}}"
                f"{flame_shape}{{\\p0}}"
            )
    return "\n".join(lines)

def _render_welcome_my_life(self) -> str:
    """Bold pop-in."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx0\\fscy0\\t(0,200,\\fscx110\\fscy110)\\t(200,{dur},\\fscx100\\fscy100)\\fad(100,100)}}{safe_text}"
        )
    return "\n".join(lines)

def _render_mademyday(self) -> str:
    """Highlight active word with slight scale bump."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    words = self.words
    active_scale = 1.12
    for i, word in enumerate(words):
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        parts = []
        for w_idx, w in enumerate(words[max(0, i-1):min(len(words), i+2)]):
            real_idx = max(0, i-1) + w_idx
            txt = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            if real_idx == i:
                parts.append(f"{{\\t(0,{dur//2},\\fscx{int(active_scale*100)}\\fscy{int(active_scale*100)})\\t({dur//2},{dur},\\fscx100\\fscy100)}}{txt}")
            else:
                parts.append(f"{{\\alpha&H55&}}{txt}")
        full = " ".join(parts)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full}"
            )
    return "\n".join(lines)


# ============== NEW CREATIVE EFFECTS - GROUP 1: CINEMATIC ==============

def _render_movie_credits(self) -> str:
    """Film credits style - perspective scroll effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Start from bottom, move up with perspective (frx for 3D tilt)
        start_y = cy + 200
        end_y = cy - 50
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\move({cx},{start_y},{cx},{end_y})"
            f"\\frx30\\t(0,{dur},\\frx0)"
            f"\\fscx80\\fscy80\\t(0,{dur//2},\\fscx100\\fscy100)"
            f"\\alpha&H80&\\t(0,{dur//3},\\alpha&H00&)\\t({dur*2//3},{dur},\\alpha&H80&)}}"
            f"{text}"
        )
    return "\n".join(lines)

def _render_horror_flicker(self) -> str:
    """Horror movie - random flicker with blood red flash."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Main text with flicker
        flicker_times = []
        t = 0
        while t < dur:
            step = random.randint(30, 80)
            alpha_on = "&H00&" if random.random() > 0.3 else "&HFF&"
            flicker_times.append(f"\\t({t},{t+step},\\alpha{alpha_on})")
            t += step
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0000FF&\\blur1{''.join(flicker_times)}}}{text}"
        )
        
        # Blood red flash overlay
        flash_start = start_ms + random.randint(0, dur//2)
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(flash_start)},{self._ms_to_timestamp(flash_start + 100)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0000AA&\\blur20\\fscx300\\fscy300\\alpha&H80&\\t(0,100,\\alpha&HFF&)}}{text}"
        )
    return "\n".join(lines)

def _render_old_film(self) -> str:
    """Old film - shake, scratches, sepia tone."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Sepia color + jitter
        jitter_anims = []
        t = 0
        while t < dur:
            step = random.randint(40, 80)
            dx = random.randint(-3, 3)
            dy = random.randint(-2, 2)
            jitter_anims.append(f"\\t({t},{t+step},\\pos({cx+dx},{cy+dy}))")
            t += step
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H8BD0E6&\\blur0.5{''.join(jitter_anims)}}}{text}"
        )
        
        # Vertical scratch lines
        for _ in range(3):
            scratch_x = cx + random.randint(-200, 200)
            scratch_start = start_ms + random.randint(0, dur)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(scratch_start)},{self._ms_to_timestamp(min(scratch_start + 150, end_ms))},Default,,0,0,0,,"
                f"{{\\an5\\pos({scratch_x},{cy})\\1c&HFFFFFF&\\alpha&H80&\\fscx2\\fscy800\\t(0,150,\\alpha&HFF&)}}|"
            )
    return "\n".join(lines)

def _render_action_impact(self) -> str:
    """Action movie - zoom + shake + flash combo."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Zoom in fast, then shake
        shake_anims = []
        t = 150
        while t < dur:
            step = 30
            dx = random.randint(-8, 8)
            dy = random.randint(-5, 5)
            shake_anims.append(f"\\t({t},{t+step},\\pos({cx+dx},{cy+dy}))")
            t += step
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx300\\fscy300\\alpha&HFF&"
            f"\\t(0,100,\\fscx120\\fscy120\\alpha&H00&)"
            f"\\t(100,200,\\fscx100\\fscy100)"
            f"{''.join(shake_anims)}}}{text}"
        )
        
        # Impact flash
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 150)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&\\blur30\\fscx500\\fscy500\\alpha&H40&\\t(0,150,\\alpha&HFF&)}}●"
        )
    return "\n".join(lines)

def _render_dramatic_reveal(self) -> str:
    """Dramatic reveal from black with blur."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        reveal_time = min(400, dur // 2)
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})"
            f"\\blur20\\alpha&HFF&\\fscx80\\fscy80"
            f"\\t(0,{reveal_time},\\blur0\\alpha&H00&\\fscx100\\fscy100)"
            f"\\t({dur - reveal_time},{dur},\\blur10\\alpha&H80&)}}"
            f"{text}"
        )
    return "\n".join(lines)


# ============== GROUP 2: OPTICAL ILLUSION / TRIPPY ==============

def _render_hypnotic_spiral(self) -> str:
    """Hypnotic spiral with rotating text."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Main text with slow rotation
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\frz0\\t(0,{dur},\\frz360)\\fad(150,150)}}{text}"
        )
        
        # Spiral rings behind
        for i in range(5):
            ring_size = 100 + i * 80
            rot_offset = i * 72
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&HFF00FF&\\alpha&H80&\\frz{rot_offset}"
                f"\\t(0,{dur},\\frz{rot_offset + 720})\\fscx{ring_size}\\fscy{ring_size}\\bord0}}◯"
            )
    return "\n".join(lines)

def _render_mirror_reflect(self) -> str:
    """Mirror reflection - inverted faded copy below."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        font_size = int(self.style.get("font_size", 72))
        reflect_y = cy + font_size + 10
        
        # Main text
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{text}"
        )
        
        # Reflection (flipped, faded, blurred)
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{reflect_y})\\fscy-100\\alpha&H80&\\blur2"
            f"\\1a&H40&\\fad(100,100)}}{text}"
        )
    return "\n".join(lines)

def _render_shadow_clone(self) -> str:
    """Ninja shadow clones - delayed copies."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Shadow clones (delayed, offset, fading)
        clone_offsets = [(-40, -20), (40, -15), (-30, 25), (35, 20)]
        for i, (dx, dy) in enumerate(clone_offsets):
            delay = (i + 1) * 50
            clone_start = start_ms + delay
            if clone_start < end_ms:
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(clone_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({cx + dx},{cy + dy})\\alpha&H90&\\blur3"
                    f"\\t(0,100,\\alpha&HA0&)\\t({dur - 100},{dur},\\alpha&HFF&)}}{text}"
                )
        
        # Main text (front)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(50,50)}}{text}"
        )
    return "\n".join(lines)

def _render_echo_trail(self) -> str:
    """Motion trail with fading echoes."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Echo trails moving from right to center
        for i in range(6):
            echo_offset = (6 - i) * 30
            echo_alpha = hex(min(255, 100 + i * 25))[2:].upper().zfill(2)
            echo_delay = i * 30
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + echo_delay)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + echo_offset},{cy})\\alpha&H{echo_alpha}&\\blur{i}"
                f"\\t(0,200,\\pos({cx},{cy})\\alpha&HFF&)}}{text}"
            )
        
        # Main text
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})}}{text}"
        )
    return "\n".join(lines)

def _render_double_vision(self) -> str:
    """Drunk effect - two blurry copies."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Wobble animation
        wobble_anims = []
        t = 0
        while t < dur:
            step = 100
            offset = 15 + random.randint(-5, 5)
            wobble_anims.append(f"\\t({t},{t+step},\\pos({cx - offset},{cy}))")
            t += step
            if t < dur:
                wobble_anims.append(f"\\t({t},{t+step},\\pos({cx + offset},{cy}))")
                t += step
        
        # Left blurry copy
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx - 20},{cy})\\blur4\\alpha&H60&{''.join(wobble_anims)}}}{text}"
        )
        
        # Right blurry copy
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx + 20},{cy})\\blur4\\alpha&H60&}}{text}"
        )
        
        # Main (slightly blurred)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur1}}{text}"
        )
    return "\n".join(lines)


# ============== GROUP 3: ACTION / ENERGY ==============

def _render_slam_ground(self) -> str:
    """Drop from above with ground impact shockwave."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        drop_time = 150
        
        # Main text drops from above
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy - 300})\\fscx120\\fscy120"
            f"\\t(0,{drop_time},\\pos({cx},{cy})\\fscx100\\fscy100)"
            f"\\t({drop_time},{drop_time + 50},\\fscy90)"
            f"\\t({drop_time + 50},{drop_time + 100},\\fscy100)}}{text}"
        )
        
        # Shockwave rings
        for i in range(3):
            ring_delay = drop_time + i * 40
            ring_size_start = 50
            ring_size_end = 300 + i * 100
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + ring_delay)},{self._ms_to_timestamp(start_ms + ring_delay + 300)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy + 30})\\1c&H00FFFF&\\alpha&H40&\\bord3\\blur2"
                f"\\fscx{ring_size_start}\\fscy{ring_size_start // 3}"
                f"\\t(0,300,\\fscx{ring_size_end}\\fscy{ring_size_end // 3}\\alpha&HFF&)}}◯"
            )
        
        # Dust particles
        for _ in range(8):
            px = cx + random.randint(-100, 100)
            py = cy + 20
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms + drop_time)},{self._ms_to_timestamp(start_ms + drop_time + 400)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\1c&HCCCCCC&\\blur3\\fscx20\\fscy20"
                f"\\t(0,400,\\pos({px + random.randint(-50, 50)},{py - random.randint(50, 150)})\\alpha&HFF&)}}●"
            )
    return "\n".join(lines)

def _render_speed_lines(self) -> str:
    """Anime speed lines in background."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Speed lines radiating from center
        for i in range(12):
            angle = i * 30
            line_start = start_ms + random.randint(0, 100)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(line_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\frz{angle}\\1c&HFFFFFF&\\alpha&H80&"
                f"\\fscx400\\fscy2\\blur1\\t(0,{dur},\\fscx800\\alpha&HFF&)}}―"
            )
        
        # Main text with slight zoom
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx95\\fscy95\\t(0,{dur},\\fscx105\\fscy105)}}{text}"
        )
    return "\n".join(lines)

def _render_power_up(self) -> str:
    """Dragon Ball style power-up aura."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Aura glow layers
        aura_colors = ["&H00FFFF&", "&H00FF00&", "&HFFFF00&"]
        for i, color in enumerate(aura_colors):
            blur_amount = 15 + i * 5
            scale = 110 + i * 10
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c{color}\\blur{blur_amount}\\alpha&H80&"
                f"\\fscx{scale}\\fscy{scale}"
                f"\\t(0,{dur//2},\\fscx{scale+20}\\fscy{scale+20})"
                f"\\t({dur//2},{dur},\\fscx{scale}\\fscy{scale})}}{text}"
            )
        
        # Rising energy particles
        for _ in range(15):
            px = cx + random.randint(-80, 80)
            py = cy + random.randint(-20, 40)
            p_start = start_ms + random.randint(0, dur // 2)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\1c&H00FFFF&\\blur4\\fscx10\\fscy10"
                f"\\t(0,{dur},\\pos({px + random.randint(-20, 20)},{py - random.randint(100, 200)})\\alpha&HFF&)}}●"
            )
        
        # Main text
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\t(0,100,\\fscx110\\fscy110)\\t(100,{dur},\\fscx100\\fscy100)}}{text}"
        )
    return "\n".join(lines)

def _render_punch_hit(self) -> str:
    """Punch impact - zoom + shake + stars."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Shake animation
        shake_anims = []
        t = 80
        while t < min(dur, 400):
            step = 25
            dx = random.randint(-12, 12)
            dy = random.randint(-8, 8)
            shake_anims.append(f"\\t({t},{t+step},\\pos({cx+dx},{cy+dy}))")
            t += step
        
        # Main text with impact
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx150\\fscy150"
            f"\\t(0,80,\\fscx100\\fscy100){''.join(shake_anims)}}}{text}"
        )
        
        # Impact stars
        star_chars = ["✦", "✧", "★", "☆"]
        for i in range(6):
            angle = i * 60
            dist = 80 + random.randint(0, 40)
            import math
            sx = cx + int(dist * math.cos(math.radians(angle)))
            sy = cy + int(dist * math.sin(math.radians(angle)))
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 400)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&H00FFFF&\\fscx30\\fscy30"
                f"\\t(0,200,\\pos({sx},{sy})\\fscx60\\fscy60)"
                f"\\t(200,400,\\alpha&HFF&)}}{random.choice(star_chars)}"
            )
    return "\n".join(lines)

def _render_explosion_entry(self) -> str:
    """Explosion entry - smoke clears to reveal text."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        explosion_dur = min(300, dur // 2)
        
        # Explosion flash
        lines.append(
            f"Dialogue: 3,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 100)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00FFFF&\\blur50\\fscx500\\fscy500\\alpha&H40&"
            f"\\t(0,100,\\alpha&HFF&)}}●"
        )
        
        # Smoke particles
        for _ in range(20):
            px = cx + random.randint(-50, 50)
            py = cy + random.randint(-30, 30)
            end_px = px + random.randint(-150, 150)
            end_py = py + random.randint(-150, 150)
            smoke_size = random.randint(40, 100)
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + explosion_dur + 200)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\1c&H888888&\\blur8\\fscx{smoke_size}\\fscy{smoke_size}"
                f"\\t(0,{explosion_dur + 200},\\pos({end_px},{end_py})\\alpha&HFF&\\fscx{smoke_size + 50}\\fscy{smoke_size + 50})}}●"
            )
        
        # Main text appears after smoke
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + explosion_dur // 2)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\alpha&HFF&\\blur10"
            f"\\t(0,{explosion_dur},\\alpha&H00&\\blur0)}}{text}"
        )
    return "\n".join(lines)


# ============== GROUP 4: ARTISTIC ==============

def _render_paint_brush(self) -> str:
    """Text painted with brush strokes."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        stroke_dur = min(300, dur // 2)
        
        # Brush stroke effect (clip reveal from left to right)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx0\\t(0,{stroke_dur},\\fscx100)"
            f"\\blur2\\t({stroke_dur},{stroke_dur + 100},\\blur0)}}{text}"
        )
        
        # Paint splatter particles
        colors = ["&H0000FF&", "&H00FF00&", "&HFF0000&", "&HFFFF00&", "&HFF00FF&"]
        for _ in range(8):
            px = cx + random.randint(-150, 150)
            py = cy + random.randint(-50, 50)
            p_start = start_ms + random.randint(0, stroke_dur)
            color = random.choice(colors)
            size = random.randint(10, 30)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_start + 300)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\1c{color}\\blur3\\fscx{size}\\fscy{size}"
                f"\\t(0,300,\\alpha&HFF&)}}●"
            )
    return "\n".join(lines)

def _render_graffiti_spray(self) -> str:
    """Spray paint graffiti effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        spray_dur = min(400, dur // 2)
        
        # Spray particles appearing
        for i in range(30):
            px = cx + random.randint(-120, 120)
            py = cy + random.randint(-40, 40)
            p_start = start_ms + int((i / 30) * spray_dur)
            size = random.randint(3, 8)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\blur1\\alpha&H{random.randint(0, 60):02X}&\\fscx{size}\\fscy{size}}}●"
            )
        
        # Main text with drip effect
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms + spray_dur // 2)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\alpha&HFF&\\t(0,{spray_dur // 2},\\alpha&H00&)}}{text}"
        )
        
        # Drip lines
        for _ in range(3):
            drip_x = cx + random.randint(-80, 80)
            drip_start = start_ms + spray_dur
            drip_len = random.randint(30, 80)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(drip_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({drip_x},{cy + 30})\\fscx3\\fscy0\\t(0,500,\\fscy{drip_len})}}|"
            )
    return "\n".join(lines)

def _render_neon_flicker(self) -> str:
    """Realistic neon - some letters flicker broken."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Glow layer
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur15\\alpha&H60&}}{text}"
        )
        
        # Main neon with flicker
        flicker_anims = []
        t = 0
        while t < dur:
            if random.random() < 0.3:  # 30% chance of flicker
                flicker_anims.append(f"\\t({t},{t+30},\\alpha&H80&)")
                flicker_anims.append(f"\\t({t+30},{t+60},\\alpha&H00&)")
                t += 60
            else:
                t += random.randint(100, 300)
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur1{''.join(flicker_anims)}}}{text}"
        )
    return "\n".join(lines)

def _render_watercolor_bleed(self) -> str:
    """Watercolor paint bleeding effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        bleed_dur = min(500, dur // 2)
        
        # Watercolor bleed layers
        colors = ["&HFF9999&", "&H99FF99&", "&H9999FF&", "&HFFFF99&"]
        for i, color in enumerate(colors):
            offset_x = random.randint(-15, 15)
            offset_y = random.randint(-10, 10)
            blur = 10 + i * 5
            delay = i * 50
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + offset_x},{cy + offset_y})\\1c{color}\\blur{blur}\\alpha&H80&"
                f"\\fscx90\\fscy90\\t(0,{bleed_dur},\\fscx110\\fscy110\\blur{blur + 10})}}{text}"
            )
        
        # Main text
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(200,200)}}{text}"
        )
    return "\n".join(lines)

def _render_chalk_write(self) -> str:
    """Chalkboard writing effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        write_dur = min(400, dur // 2)
        
        # Chalk dust particles
        for _ in range(15):
            px = cx + random.randint(-100, 100)
            py = cy + random.randint(-30, 50)
            p_start = start_ms + random.randint(0, write_dur)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_start + 300)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\1c&HFFFFFF&\\blur2\\fscx5\\fscy5\\alpha&H80&"
                f"\\t(0,300,\\pos({px},{py + 30})\\alpha&HFF&)}}●"
            )
        
        # Main text with rough texture effect
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&\\blur0.5"
            f"\\fscx0\\t(0,{write_dur},\\fscx100)}}{text}"
        )
        
        # Slight texture overlay
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms + write_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HDDDDDD&\\blur1\\alpha&HC0&}}{text}"
        )
    return "\n".join(lines)


# ============== GROUP 5: RETRO / GAMING ==============

def _render_pixelate_form(self) -> str:
    """Pixel blocks form into text."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        pixel_dur = min(400, dur // 2)
        
        # Random pixel blocks converging
        for i in range(25):
            start_x = cx + random.randint(-200, 200)
            start_y = cy + random.randint(-150, 150)
            end_x = cx + random.randint(-50, 50)
            end_y = cy + random.randint(-20, 20)
            delay = int((i / 25) * pixel_dur)
            size = random.randint(15, 30)
            colors = ["&HFFFFFF&", "&H00FFFF&", "&HFF00FF&", "&HFFFF00&"]
            color = random.choice(colors)
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + pixel_dur + 100)},Default,,0,0,0,,"
                f"{{\\an5\\pos({start_x},{start_y})\\1c{color}\\blur0\\fscx{size}\\fscy{size}\\bord0"
                f"\\t(0,{pixel_dur - delay},\\pos({end_x},{end_y})\\alpha&HFF&)}}█"
            )
        
        # Main text appears
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms + pixel_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\alpha&HFF&\\t(0,100,\\alpha&H00&)}}{text}"
        )
    return "\n".join(lines)

def _render_game_damage(self) -> str:
    """Game damage taken effect - red flash and shake."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Red screen flash
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 150)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0000FF&\\blur30\\fscx300\\fscy300\\alpha&H80&"
            f"\\t(0,150,\\alpha&HFF&)}}●"
        )
        
        # Shake animation
        shake_anims = []
        for t in range(0, min(400, dur), 50):
            shake_x = random.randint(-10, 10)
            shake_y = random.randint(-5, 5)
            shake_anims.append(f"\\t({t},{t+25},\\pos({cx + shake_x},{cy + shake_y}))")
            shake_anims.append(f"\\t({t+25},{t+50},\\pos({cx},{cy}))")
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0000FF&\\t(0,200,\\1c&HFFFFFF&)"
            f"{''.join(shake_anims)}}}{text}"
        )
        
        # Damage numbers
        damage = random.randint(50, 999)
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 500)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy - 40})\\1c&H0000FF&\\fs30\\b1"
            f"\\t(0,500,\\pos({cx},{cy - 100})\\alpha&HFF&)}}-{damage}"
        )
    return "\n".join(lines)

def _render_level_up(self) -> str:
    """RPG level up effect with sparkles and glow."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Rising light beam
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 400)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy + 100})\\1c&H00FFFF&\\blur20\\fscx10\\fscy200\\alpha&H40&"
            f"\\t(0,400,\\pos({cx},{cy - 100})\\alpha&HFF&)}}█"
        )
        
        # Sparkles rising
        for _ in range(20):
            px = cx + random.randint(-80, 80)
            start_py = cy + 50
            end_py = cy - random.randint(50, 150)
            p_start = start_ms + random.randint(0, 300)
            colors = ["&H00FFFF&", "&HFFFF00&", "&HFFFFFF&"]
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_start + 500)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{start_py})\\1c{random.choice(colors)}\\blur1\\fscx8\\fscy8"
                f"\\t(0,500,\\pos({px},{end_py})\\alpha&HFF&)}}✦"
            )
        
        # Main text with golden glow
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + 200)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00D4FF&\\blur10\\alpha&H60&\\fscx110\\fscy110}}{text}"
        )
        lines.append(
            f"Dialogue: 3,{self._ms_to_timestamp(start_ms + 200)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,200,\\fscx100\\fscy100)}}{text}"
        )
    return "\n".join(lines)

def _render_coin_collect(self) -> str:
    """Coin collection game effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Coin spinning animation (using fscx to simulate rotation)
        coin_anims = ""
        for t in range(0, min(500, dur), 100):
            coin_anims += f"\\t({t},{t+50},\\fscx0)\\t({t+50},{t+100},\\fscx100)"
        
        # Coins bouncing up
        for i in range(5):
            coin_x = cx + (i - 2) * 60
            bounce_start = start_ms + i * 50
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(bounce_start)},{self._ms_to_timestamp(bounce_start + 400)},Default,,0,0,0,,"
                f"{{\\an5\\pos({coin_x},{cy + 50})\\1c&H00D4FF&\\fs25"
                f"\\t(0,200,\\pos({coin_x},{cy - 30}))\\t(200,400,\\pos({coin_x},{cy})\\alpha&HFF&)}}"
                f"●"
            )
        
        # Coin sound indicator
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 300)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx + 80},{cy - 40})\\1c&H00FFFF&\\fs20\\b1"
            f"\\t(0,300,\\pos({cx + 100},{cy - 60})\\alpha&HFF&)}}+{random.randint(10, 100)}"
        )
        
        # Main text
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{text}"
        )
    return "\n".join(lines)

def _render_glitch_teleport(self) -> str:
    """Glitch teleport effect like video game respawn."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        glitch_dur = min(300, dur // 2)
        
        # Pre-teleport glitch fragments
        for i in range(8):
            frag_x = cx + random.randint(-150, 150)
            frag_y = cy + random.randint(-80, 80)
            delay = i * 30
            colors = ["&H00FFFF&", "&HFF00FF&", "&H00FF00&"]
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + glitch_dur)},Default,,0,0,0,,"
                f"{{\\an5\\pos({frag_x},{frag_y})\\1c{random.choice(colors)}\\blur1\\fscx{random.randint(50, 150)}\\fscy{random.randint(3, 10)}"
                f"\\t(0,{glitch_dur - delay},\\pos({cx},{cy})\\alpha&HFF&)}}━"
            )
        
        # Teleport flash
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms + glitch_dur - 50)},{self._ms_to_timestamp(start_ms + glitch_dur + 100)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&\\blur30\\fscx200\\fscy200\\alpha&H40&"
            f"\\t(0,150,\\alpha&HFF&)}}●"
        )
        
        # Main text materializes
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + glitch_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\alpha&HFF&\\blur5\\t(0,100,\\alpha&H00&\\blur0)}}{text}"
        )
    return "\n".join(lines)


# ============== GROUP 6: NATURE / ELEMENTS ==============

def _render_tornado_spin(self) -> str:
    """Text caught in tornado - spins and stabilizes."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        spin_dur = min(500, dur // 2)
        
        # Debris particles spinning
        for _ in range(15):
            angle = random.randint(0, 360)
            radius = random.randint(50, 120)
            import math
            start_x = cx + int(radius * 1.5 * (1 if random.random() > 0.5 else -1))
            start_y = cy + random.randint(-80, 80)
            p_start = start_ms + random.randint(0, spin_dur // 2)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(start_ms + spin_dur)},Default,,0,0,0,,"
                f"{{\\an5\\pos({start_x},{start_y})\\1c&HCCCCCC&\\blur2\\fscx10\\fscy10"
                f"\\t(0,{spin_dur - (p_start - start_ms)},\\pos({cx},{cy})\\alpha&HFF&)}}●"
            )
        
        # Text spinning in (using fscx to simulate rotation)
        spin_anims = ""
        for t in range(0, spin_dur, 100):
            scale = 100 - int(80 * (1 - t / spin_dur))
            spin_anims += f"\\t({t},{t+50},\\fscx5\\fscy{scale})\\t({t+50},{t+100},\\fscx{scale}\\fscy{scale})"
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx5\\fscy20\\blur5{spin_anims}"
            f"\\t({spin_dur},{spin_dur + 100},\\blur0)}}{text}"
        )
    return "\n".join(lines)

def _render_underwater(self) -> str:
    """Underwater bubble effect with wavy motion."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Rising bubbles
        for _ in range(12):
            bx = cx + random.randint(-120, 120)
            start_by = cy + 80
            end_by = cy - random.randint(80, 150)
            b_start = start_ms + random.randint(0, dur // 2)
            size = random.randint(8, 20)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(b_start)},{self._ms_to_timestamp(min(b_start + 800, end_ms))},Default,,0,0,0,,"
                f"{{\\an5\\pos({bx},{start_by})\\1c&HFFFFCC&\\blur2\\alpha&H60&\\fscx{size}\\fscy{size}"
                f"\\t(0,800,\\pos({bx + random.randint(-20, 20)},{end_by})\\alpha&HFF&)}}○"
            )
        
        # Wavy text motion
        wave_anims = ""
        for t in range(0, dur, 200):
            offset = 5 if (t // 200) % 2 == 0 else -5
            wave_anims += f"\\t({t},{t+100},\\pos({cx + offset},{cy}))\\t({t+100},{t+200},\\pos({cx - offset},{cy}))"
        
        # Main text with blue tint
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HFFCC88&\\blur1{wave_anims}}}{text}"
        )
    return "\n".join(lines)

def _render_sand_storm(self) -> str:
    """Sand storm with particles and reveal."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        storm_dur = min(400, dur // 2)
        
        # Sand particles blowing across
        for _ in range(30):
            start_x = cx - 200
            end_x = cx + 200
            py = cy + random.randint(-50, 50)
            p_start = start_ms + random.randint(0, storm_dur)
            size = random.randint(3, 8)
            colors = ["&H5599DD&", "&H77BBEE&", "&H88CCFF&"]
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_start + 300)},Default,,0,0,0,,"
                f"{{\\an5\\pos({start_x},{py})\\1c{random.choice(colors)}\\blur1\\fscx{size}\\fscy{size}"
                f"\\t(0,300,\\pos({end_x},{py + random.randint(-10, 10)})\\alpha&HFF&)}}●"
            )
        
        # Text revealed as storm clears
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H66AADD&\\blur10\\alpha&H80&"
            f"\\t(0,{storm_dur},\\blur0\\alpha&H00&)}}{text}"
        )
    return "\n".join(lines)

def _render_lava_melt(self) -> str:
    """Text melts like lava with dripping effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        melt_start = end_ms - min(500, dur // 2)
        
        # Main text with heat glow
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0066FF&\\blur0"
            f"\\t({melt_start - start_ms},{end_ms - start_ms},\\1c&H0000FF&\\fscy150\\blur3)}}{text}"
        )
        
        # Glow underneath
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0033CC&\\blur15\\alpha&H60&}}{text}"
        )
        
        # Lava drips
        for _ in range(6):
            drip_x = cx + random.randint(-80, 80)
            drip_start = melt_start + random.randint(0, 200)
            drip_end_y = cy + random.randint(40, 100)
            colors = ["&H0000FF&", "&H0033FF&", "&H0066FF&"]
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(drip_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({drip_x},{cy + 20})\\1c{random.choice(colors)}\\blur3\\fscx15\\fscy15"
                f"\\t(0,{end_ms - drip_start},\\pos({drip_x},{drip_end_y})\\fscy30)}}●"
            )
    return "\n".join(lines)

def _render_freeze_crack(self) -> str:
    """Ice freeze with cracking effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        freeze_dur = min(300, dur // 3)
        
        # Ice crystals forming
        for _ in range(10):
            cx_off = random.randint(-100, 100)
            cy_off = random.randint(-40, 40)
            p_start = start_ms + random.randint(0, freeze_dur)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx + cx_off},{cy + cy_off})\\1c&HFFFFCC&\\blur2\\fscx0\\fscy0"
                f"\\t(0,150,\\fscx20\\fscy20)}}✦"
            )
        
        # Text with ice color transition
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&"
            f"\\t(0,{freeze_dur},\\1c&HFFEECC&\\blur0.5)}}{text}"
        )
        
        # Crack lines appearing
        crack_start = start_ms + freeze_dur
        for i in range(5):
            angle = random.randint(-30, 30)
            crack_x = cx + random.randint(-60, 60)
            lines.append(
                f"Dialogue: 2,{self._ms_to_timestamp(crack_start + i * 50)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({crack_x},{cy})\\1c&HFFFFEE&\\blur0\\fscx0\\frz{angle}"
                f"\\t(0,100,\\fscx{random.randint(20, 50)})}}━"
            )
    return "\n".join(lines)


# ============== GROUP 7: MAGIC / FANTASY ==============

def _render_magic_spell(self) -> str:
    """Magic spell casting with runes and energy."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        cast_dur = min(400, dur // 2)
        
        # Magic circle/runes
        runes = ["◇", "◆", "○", "●", "☆", "★"]
        for i in range(8):
            angle = i * 45
            import math
            rx = cx + int(80 * math.cos(math.radians(angle)))
            ry = cy + int(40 * math.sin(math.radians(angle)))
            delay = i * 40
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + cast_dur + 200)},Default,,0,0,0,,"
                f"{{\\an5\\pos({rx},{ry})\\1c&HFF66FF&\\blur2\\fscx0\\fscy0\\frz{angle}"
                f"\\t(0,150,\\fscx25\\fscy25)\\t({cast_dur},{cast_dur + 200},\\alpha&HFF&)}}{random.choice(runes)}"
            )
        
        # Energy converging
        for _ in range(10):
            start_x = cx + random.randint(-150, 150)
            start_y = cy + random.randint(-100, 100)
            p_start = start_ms + random.randint(0, cast_dur // 2)
            colors = ["&HFF00FF&", "&HFF66FF&", "&HFFAAFF&"]
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(start_ms + cast_dur)},Default,,0,0,0,,"
                f"{{\\an5\\pos({start_x},{start_y})\\1c{random.choice(colors)}\\blur3\\fscx8\\fscy8"
                f"\\t(0,{cast_dur - (p_start - start_ms)},\\pos({cx},{cy})\\alpha&HFF&)}}✦"
            )
        
        # Main text with magical glow
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + cast_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HFFAAFF&\\blur10\\alpha&H60&\\fscx120\\fscy120}}{text}"
        )
        lines.append(
            f"Dialogue: 3,{self._ms_to_timestamp(start_ms + cast_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\alpha&HFF&"
            f"\\t(0,100,\\fscx100\\fscy100\\alpha&H00&)}}{text}"
        )
    return "\n".join(lines)

def _render_portal_warp(self) -> str:
    """Portal warp effect - text emerges from portal."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        portal_dur = min(350, dur // 2)
        
        # Portal rings expanding
        for i in range(5):
            delay = i * 60
            size = 50 + i * 30
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + portal_dur + 100)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&HFF9900&\\blur5\\fscx0\\fscy0\\bord3\\3c&H0066FF&"
                f"\\t(0,{portal_dur - delay},\\fscx{size}\\fscy{int(size * 0.4)}\\alpha&HFF&)}}○"
            )
        
        # Energy swirl
        for i in range(12):
            import math
            angle = i * 30
            end_angle = angle + 180
            start_x = cx + int(60 * math.cos(math.radians(angle)))
            start_y = cy + int(25 * math.sin(math.radians(angle)))
            end_x = cx + int(30 * math.cos(math.radians(end_angle)))
            end_y = cy + int(12 * math.sin(math.radians(end_angle)))
            delay = i * 25
            colors = ["&H0066FF&", "&HFF9900&"]
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + portal_dur)},Default,,0,0,0,,"
                f"{{\\an5\\pos({start_x},{start_y})\\1c{colors[i % 2]}\\blur2\\fscx10\\fscy10"
                f"\\t(0,{portal_dur - delay},\\pos({end_x},{end_y})\\alpha&HFF&)}}●"
            )
        
        # Text emerging from portal
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + portal_dur // 2)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx0\\fscy0\\blur10"
            f"\\t(0,{portal_dur // 2},\\fscx100\\fscy100\\blur0)}}{text}"
        )
    return "\n".join(lines)

def _render_invisibility_cloak(self) -> str:
    """Invisibility cloak - shimmer reveal effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        reveal_dur = min(400, dur // 2)
        
        # Shimmer waves
        for i in range(6):
            wave_x = cx - 100 + i * 40
            delay = i * 50
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + reveal_dur + 100)},Default,,0,0,0,,"
                f"{{\\an5\\pos({wave_x},{cy})\\1c&HFFFFFF&\\blur8\\alpha&H80&\\fscx5\\fscy80"
                f"\\t(0,{reveal_dur - delay},\\pos({wave_x + 30},{cy})\\alpha&HFF&)}}█"
            )
        
        # Text with flicker visibility
        flicker_anims = ""
        for t in range(0, reveal_dur, 60):
            alpha1 = "FF" if random.random() > 0.5 else "80"
            alpha2 = "00" if t > reveal_dur * 0.7 else "60"
            flicker_anims += f"\\t({t},{t+30},\\alpha&H{alpha1}&)\\t({t+30},{t+60},\\alpha&H{alpha2}&)"
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\alpha&HFF&{flicker_anims}"
            f"\\t({reveal_dur},{reveal_dur + 100},\\alpha&H00&)}}{text}"
        )
    return "\n".join(lines)

def _render_summon_appear(self) -> str:
    """Summoning circle with entity appearing."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        summon_dur = min(500, dur // 2)
        
        # Summoning circle glow
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + summon_dur + 200)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00FF66&\\blur20\\fscx150\\fscy60\\alpha&H80&"
            f"\\t(0,{summon_dur},\\blur30\\fscx180\\fscy70)\\t({summon_dur},{summon_dur + 200},\\alpha&HFF&)}}○"
        )
        
        # Rotating symbols
        symbols = ["✧", "⬡", "◈", "✦"]
        for i in range(8):
            import math
            angle_start = i * 45
            radius = 70
            p_x = cx + int(radius * math.cos(math.radians(angle_start)))
            p_y = cy + int(radius * 0.4 * math.sin(math.radians(angle_start)))
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + summon_dur)},Default,,0,0,0,,"
                f"{{\\an5\\pos({p_x},{p_y})\\1c&H00FF66&\\blur1\\fscx20\\fscy20"
                f"\\t(0,{summon_dur},\\frz{360}\\alpha&HFF&)}}{symbols[i % 4]}"
            )
        
        # Rising energy
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + summon_dur // 2)},{self._ms_to_timestamp(start_ms + summon_dur)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy + 30})\\1c&H00FF66&\\blur10\\fscx10\\fscy100\\alpha&H60&"
            f"\\t(0,{summon_dur // 2},\\pos({cx},{cy - 20})\\alpha&HFF&)}}█"
        )
        
        # Main text appearing
        lines.append(
            f"Dialogue: 3,{self._ms_to_timestamp(start_ms + summon_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\alpha&HFF&\\fscx150\\fscy150\\blur5"
            f"\\t(0,150,\\alpha&H00&\\fscx100\\fscy100\\blur0)}}{text}"
        )
    return "\n".join(lines)

def _render_fairy_dust(self) -> str:
    """Fairy dust sparkles trailing effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Continuous fairy dust sparkles
        for _ in range(25):
            px = cx + random.randint(-120, 120)
            py = cy + random.randint(-50, 50)
            p_start = start_ms + random.randint(0, dur - 300)
            colors = ["&HFFFF00&", "&HFFAAFF&", "&H00FFFF&", "&HFFFFFF&"]
            size = random.randint(5, 15)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(p_start)},{self._ms_to_timestamp(p_start + 400)},Default,,0,0,0,,"
                f"{{\\an5\\pos({px},{py})\\1c{random.choice(colors)}\\blur1\\fscx{size}\\fscy{size}"
                f"\\t(0,200,\\fscx{size + 10}\\fscy{size + 10})\\t(200,400,\\alpha&HFF&\\fscx0\\fscy0)}}✦"
            )
        
        # Trailing sparkle path
        for i in range(8):
            trail_x = cx - 80 + i * 20
            trail_y = cy + int(15 * math.sin(i * 0.8)) if 'math' in dir() else cy
            delay = i * 40
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + delay + 300)},Default,,0,0,0,,"
                f"{{\\an5\\pos({trail_x},{trail_y})\\1c&HFFFF99&\\blur2\\fscx12\\fscy12"
                f"\\t(0,150,\\fscx20\\fscy20)\\t(150,300,\\alpha&HFF&)}}★"
            )
        
        # Main text with soft glow
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur5\\alpha&H60&\\fscx110\\fscy110}}{text}"
        )
        lines.append(
            f"Dialogue: 3,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(150,150)}}{text}"
        )
    return "\n".join(lines)


# ============== GROUP 8: SOCIAL MEDIA ==============

def _render_like_burst(self) -> str:
    """Social media like burst with hearts."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Heart burst
        hearts = ["♥", "♡", "❤"]
        for _ in range(15):
            hx = cx + random.randint(-30, 30)
            hy = cy
            end_hx = cx + random.randint(-150, 150)
            end_hy = cy - random.randint(50, 150)
            h_start = start_ms + random.randint(0, 200)
            size = random.randint(15, 35)
            colors = ["&H0000FF&", "&H0066FF&", "&HFF00FF&"]
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(h_start)},{self._ms_to_timestamp(h_start + 500)},Default,,0,0,0,,"
                f"{{\\an5\\pos({hx},{hy})\\1c{random.choice(colors)}\\fscx{size}\\fscy{size}"
                f"\\t(0,500,\\pos({end_hx},{end_hy})\\alpha&HFF&\\fscx{size + 10}\\fscy{size + 10})}}{random.choice(hearts)}"
            )
        
        # Like button pop
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + 300)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0000FF&\\fscx200\\fscy200"
            f"\\t(0,150,\\fscx250\\fscy250)\\t(150,300,\\fscx200\\fscy200\\alpha&HFF&)}}♥"
        )
        
        # Main text
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + 100)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,150,\\fscx100\\fscy100)}}{text}"
        )
    return "\n".join(lines)

def _render_story_swipe(self) -> str:
    """Instagram story swipe transition."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        swipe_dur = min(250, dur // 3)
        
        # Previous content sliding out
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + swipe_dur)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\alpha&H80&"
            f"\\t(0,{swipe_dur},\\pos({cx - 300},{cy})\\alpha&HFF&)}}"
            f"━━━━━━"
        )
        
        # New content sliding in
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx + 300},{cy})"
            f"\\t(0,{swipe_dur},\\pos({cx},{cy}))}}{text}"
        )
        
        # Progress bar at top
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an8\\pos({cx - 100},{cy - 80})\\1c&HFFFFFF&\\fscx0\\fscy3"
            f"\\t(0,{dur},\\fscx200)}}█"
        )
    return "\n".join(lines)

def _render_notification_pop(self) -> str:
    """Phone notification pop up effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        pop_dur = min(200, dur // 3)
        
        # Notification background
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy - 60})\\1c&H333333&\\blur0\\fscx0\\fscy30\\bord0"
            f"\\t(0,{pop_dur},\\fscx180\\fscy30)}}█"
        )
        
        # Icon
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms + pop_dur // 2)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx - 70},{cy - 60})\\1c&H00AAFF&\\fscx0\\fscy0"
            f"\\t(0,{pop_dur},\\fscx25\\fscy25)}}●"
        )
        
        # Notification text
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + pop_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy - 60})\\alpha&HFF&\\t(0,100,\\alpha&H00&)}}{text}"
        )
        
        # Dismiss animation at end
        dismiss_start = end_ms - min(150, dur // 4)
        lines.append(
            f"Dialogue: 3,{self._ms_to_timestamp(dismiss_start)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy - 60})"
            f"\\t(0,{end_ms - dismiss_start},\\pos({cx},{cy - 120})\\alpha&HFF&)}}{text}"
        )
    return "\n".join(lines)

def _render_trending_fire(self) -> str:
    """Trending/viral fire effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Fire particles rising
        for _ in range(20):
            fx = cx + random.randint(-80, 80)
            start_fy = cy + 30
            end_fy = cy - random.randint(40, 100)
            f_start = start_ms + random.randint(0, dur - 400)
            colors = ["&H0000FF&", "&H0066FF&", "&H00AAFF&", "&H00DDFF&"]
            size = random.randint(10, 25)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(f_start)},{self._ms_to_timestamp(f_start + 400)},Default,,0,0,0,,"
                f"{{\\an5\\pos({fx},{start_fy})\\1c{random.choice(colors)}\\blur3\\fscx{size}\\fscy{size}"
                f"\\t(0,400,\\pos({fx + random.randint(-20, 20)},{end_fy})\\fscx{size // 2}\\fscy{size // 2}\\alpha&HFF&)}}▲"
            )
        
        # Fire emoji burst
        for i in range(5):
            ex = cx - 60 + i * 30
            ey = cy + 40
            delay = i * 60
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(start_ms + delay)},{self._ms_to_timestamp(start_ms + delay + 400)},Default,,0,0,0,,"
                f"{{\\an5\\pos({ex},{ey})\\fscx30\\fscy30"
                f"\\t(0,200,\\pos({ex},{ey - 30})\\fscx40\\fscy40)\\t(200,400,\\alpha&HFF&)}}🔥"
            )
        
        # Main text with heat shimmer
        shimmer = ""
        for t in range(0, dur, 100):
            shimmer += f"\\t({t},{t+50},\\fscx102)\\t({t+50},{t+100},\\fscx100)"
        
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00AAFF&{shimmer}}}{text}"
        )
    return "\n".join(lines)

def _render_viral_shake(self) -> str:
    """Viral content shake effect with notifications."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Intense shake animation
        shake_anims = ""
        for t in range(0, min(500, dur), 40):
            sx = random.randint(-8, 8)
            sy = random.randint(-4, 4)
            shake_anims += f"\\t({t},{t+20},\\pos({cx + sx},{cy + sy}))\\t({t+20},{t+40},\\pos({cx},{cy}))"
        
        # Notification badges popping
        notifs = ["+1K", "+5K", "+10K", "🔔", "💬", "🔁"]
        for i in range(6):
            nx = cx + random.randint(-100, 100)
            ny = cy + random.randint(-60, 60)
            n_start = start_ms + i * 80
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(n_start)},{self._ms_to_timestamp(n_start + 300)},Default,,0,0,0,,"
                f"{{\\an5\\pos({nx},{ny})\\1c&H00FF00&\\fs18\\b1\\fscx0\\fscy0"
                f"\\t(0,100,\\fscx100\\fscy100)\\t(100,300,\\alpha&HFF&)}}{notifs[i]}"
            )
        
        # Main text with shake
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy}){shake_anims}}}{text}"
        )
    return "\n".join(lines)


# ============== GROUP 9: PARTY / FUN ==============

def _render_disco_ball(self) -> str:
    """Disco ball with rotating light reflections."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Disco light spots moving around
        colors = ["&H0000FF&", "&H00FF00&", "&HFF0000&", "&HFFFF00&", "&HFF00FF&", "&H00FFFF&"]
        for i in range(12):
            import math
            angle_start = i * 30
            radius = 100
            start_x = cx + int(radius * math.cos(math.radians(angle_start)))
            start_y = cy + int(radius * 0.5 * math.sin(math.radians(angle_start)))
            end_x = cx + int(radius * math.cos(math.radians(angle_start + 180)))
            end_y = cy + int(radius * 0.5 * math.sin(math.radians(angle_start + 180)))
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({start_x},{start_y})\\1c{colors[i % 6]}\\blur10\\fscx40\\fscy40\\alpha&H60&"
                f"\\t(0,{dur},\\pos({end_x},{end_y}))}}●"
            )
        
        # Color cycling text
        color_cycle = ""
        for t in range(0, dur, 200):
            color = colors[t // 200 % len(colors)]
            color_cycle += f"\\t({t},{t+200},\\1c{color})"
        
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur1{color_cycle}}}{text}"
        )
    return "\n".join(lines)

def _render_fireworks(self) -> str:
    """Fireworks explosion effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Multiple firework bursts
        for burst in range(3):
            burst_x = cx + (burst - 1) * 80
            burst_start = start_ms + burst * 150
            colors = ["&H0000FF&", "&H00FF00&", "&HFFFF00&", "&HFF00FF&", "&H00FFFF&"]
            burst_color = colors[burst % len(colors)]
            
            # Explosion particles
            for i in range(16):
                import math
                angle = i * 22.5
                end_x = burst_x + int(80 * math.cos(math.radians(angle)))
                end_y = cy + int(80 * math.sin(math.radians(angle)))
                lines.append(
                    f"Dialogue: 0,{self._ms_to_timestamp(burst_start)},{self._ms_to_timestamp(burst_start + 500)},Default,,0,0,0,,"
                    f"{{\\an5\\pos({burst_x},{cy})\\1c{burst_color}\\blur2\\fscx10\\fscy10"
                    f"\\t(0,300,\\pos({end_x},{end_y}))\\t(300,500,\\alpha&HFF&\\fscx3\\fscy3)}}●"
                )
            
            # Center flash
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(burst_start)},{self._ms_to_timestamp(burst_start + 150)},Default,,0,0,0,,"
                f"{{\\an5\\pos({burst_x},{cy})\\1c&HFFFFFF&\\blur20\\fscx80\\fscy80\\alpha&H40&"
                f"\\t(0,150,\\alpha&HFF&)}}●"
            )
        
        # Main text
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + 200)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,200,\\fscx100\\fscy100)}}{text}"
        )
    return "\n".join(lines)

def _render_balloon_pop(self) -> str:
    """Balloon pop with confetti."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        pop_time = min(200, dur // 3)
        
        # Balloon inflating then popping
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(start_ms + pop_time)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H0066FF&\\blur0\\fscx50\\fscy50"
            f"\\t(0,{pop_time - 50},\\fscx150\\fscy180)\\t({pop_time - 50},{pop_time},\\fscx300\\fscy300\\alpha&HFF&)}}●"
        )
        
        # Pop flash
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms + pop_time - 30)},{self._ms_to_timestamp(start_ms + pop_time + 100)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&HFFFFFF&\\blur15\\fscx200\\fscy200\\alpha&H60&"
            f"\\t(0,130,\\alpha&HFF&)}}●"
        )
        
        # Confetti pieces flying
        confetti_chars = ["■", "●", "▲", "★"]
        colors = ["&H0000FF&", "&H00FF00&", "&HFFFF00&", "&HFF00FF&", "&H00FFFF&", "&HFF6600&"]
        for _ in range(25):
            end_cx = cx + random.randint(-150, 150)
            end_cy = cy + random.randint(-100, 100)
            c_start = start_ms + pop_time
            rotation = random.randint(0, 720)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(c_start)},{self._ms_to_timestamp(c_start + 600)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c{random.choice(colors)}\\fscx15\\fscy15\\frz0"
                f"\\t(0,600,\\pos({end_cx},{end_cy})\\frz{rotation}\\alpha&HFF&)}}{random.choice(confetti_chars)}"
            )
        
        # Main text appears after pop
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + pop_time)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fscx150\\fscy150\\t(0,150,\\fscx100\\fscy100)}}{text}"
        )
    return "\n".join(lines)

def _render_jackpot_spin(self) -> str:
    """Slot machine jackpot spin effect."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        spin_dur = min(500, dur // 2)
        
        # Slot symbols spinning through
        symbols = ["7", "★", "♦", "♠", "♥", "♣", "$"]
        for phase in range(10):
            sym = symbols[phase % len(symbols)]
            phase_start = start_ms + phase * (spin_dur // 10)
            phase_end = phase_start + (spin_dur // 10) + 50
            y_offset = -30 if phase % 2 == 0 else 30
            
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(phase_start)},{self._ms_to_timestamp(phase_end)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy + y_offset})\\1c&H00FFFF&\\fs40\\b1"
                f"\\t(0,{spin_dur // 10},\\pos({cx},{cy - y_offset})\\alpha&H80&)}}{sym}"
            )
        
        # Final reveal with flash
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms + spin_dur)},{self._ms_to_timestamp(start_ms + spin_dur + 100)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00FFFF&\\blur20\\fscx200\\fscy200\\alpha&H60&"
            f"\\t(0,100,\\alpha&HFF&)}}●"
        )
        
        # Coins/stars flying
        for _ in range(12):
            end_sx = cx + random.randint(-120, 120)
            end_sy = cy - random.randint(50, 120)
            s_start = start_ms + spin_dur
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(s_start)},{self._ms_to_timestamp(s_start + 400)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})\\1c&H00DDFF&\\fscx20\\fscy20"
                f"\\t(0,400,\\pos({end_sx},{end_sy})\\alpha&HFF&)}}★"
            )
        
        # Main text - JACKPOT!
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms + spin_dur)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\1c&H00FFFF&\\fscx80\\fscy80"
            f"\\t(0,200,\\fscx110\\fscy110)\\t(200,400,\\fscx100\\fscy100)}}{text}"
        )
    return "\n".join(lines)

def _render_party_mode(self) -> str:
    """Ultimate party mode with all effects combined."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        colors = ["&H0000FF&", "&H00FF00&", "&HFF0000&", "&HFFFF00&", "&HFF00FF&", "&H00FFFF&"]
        
        # Confetti rain
        for _ in range(20):
            rx = cx + random.randint(-200, 200)
            start_ry = cy - 100
            end_ry = cy + 100
            r_start = start_ms + random.randint(0, dur - 500)
            lines.append(
                f"Dialogue: 0,{self._ms_to_timestamp(r_start)},{self._ms_to_timestamp(r_start + 500)},Default,,0,0,0,,"
                f"{{\\an5\\pos({rx},{start_ry})\\1c{random.choice(colors)}\\fscx10\\fscy10\\frz0"
                f"\\t(0,500,\\pos({rx + random.randint(-30, 30)},{end_ry})\\frz{random.randint(180, 720)}\\alpha&HFF&)}}■"
            )
        
        # Bouncing emojis
        emojis = ["🎉", "🎊", "🥳", "🎈", "✨"]
        for i in range(5):
            ex = cx - 80 + i * 40
            e_start = start_ms + i * 80
            lines.append(
                f"Dialogue: 1,{self._ms_to_timestamp(e_start)},{self._ms_to_timestamp(min(e_start + 600, end_ms))},Default,,0,0,0,,"
                f"{{\\an5\\pos({ex},{cy + 40})\\fscx30\\fscy30"
                f"\\t(0,200,\\pos({ex},{cy - 20})\\fscx40\\fscy40)"
                f"\\t(200,400,\\pos({ex},{cy + 30})\\fscx30\\fscy30)"
                f"\\t(400,600,\\alpha&HFF&)}}{emojis[i]}"
            )
        
        # Rainbow color cycling glow
        color_cycle = ""
        for t in range(0, dur, 150):
            color = colors[t // 150 % len(colors)]
            color_cycle += f"\\t({t},{t+150},\\1c{color})"
        
        # Glow layer
        lines.append(
            f"Dialogue: 2,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\blur15\\alpha&H60&\\fscx115\\fscy115{color_cycle}}}{text}"
        )
        
        # Main text with pulse
        pulse = ""
        for t in range(0, dur, 300):
            pulse += f"\\t({t},{t+150},\\fscx105\\fscy105)\\t({t+150},{t+300},\\fscx100\\fscy100)"
        
        lines.append(
            f"Dialogue: 3,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy}){pulse}}}{text}"
        )
    return "\n".join(lines)


RENDER_DISPATCH = {
    "fire_storm": _render_fire_storm,
    "cyber_glitch": _render_cyber_glitch,
    "bubble_floral": _render_bubble_floral,
    "thunder_strike": _render_thunder_strike,
    "rainbow_wave": _render_rainbow_wave,
    "earthquake_shake": _render_earthquake_shake,
    "horror_creepy": _render_horror_creepy,
    "luxury_gold": _render_luxury_gold,
    "comic_book": _render_comic_book,
    "pulse": _render_pulse,
    "colorful": _render_colorful,
    "ghost_star": _render_ghost_star,
    "matrix_rain": _render_matrix_rain,
    "electric_shock": _render_electric_shock,
    "smoke_trail": _render_smoke_trail,
    "pixel_glitch": _render_pixel_glitch,
    "neon_sign": _render_neon_sign,
    "fade_in_out": _render_fade_in_out,
    "slide_up": _render_slide_up,
    "zoom_burst": _render_zoom_burst,
    "bounce_in": _render_bounce_in,
    "tiktok_yellow_box": _render_tiktok_yellow_box,
    "falling_heart": _render_falling_heart,
    "thunder_storm": _render_thunder_storm,
    "ice_crystal": _render_ice_crystal,
    "cosmic_stars": _render_cosmic_stars,
    "ocean_wave": _render_ocean_wave,
    "butterfly_dance": _render_butterfly_dance,
    "neon_pulse": _render_neon_pulse,
    "kinetic_bounce": _render_kinetic_bounce,
    "cinematic_blur": _render_cinematic_blur,
    "typewriter_pro": _render_typewriter_pro,
    "word_pop": _render_word_pop,
    "retro_arcade": _render_retro_arcade,
    "news_ticker": _render_news_ticker,
    "tiktok_group": _render_tiktok_group,
    "spin_3d": _render_spin_3d,
    "shear_force": _render_shear_force,
    "double_shadow": _render_double_shadow,
    "karaoke_classic": _render_karaoke_classic,
    "karaoke_pro": _render_karaoke_pro,
    "karaoke_sentence": _render_karaoke_sentence,
    "karaoke_sentence_box": _render_karaoke_sentence_box,
    "dynamic_highlight": _render_dynamic_highlight,
    "tiktok_box_group": _render_tiktok_box_group,
    "sakura_dream": _render_sakura_dream,
    "phoenix_flames": _render_phoenix_flames,
    "welcome_my_life": _render_welcome_my_life,
    "mademyday": _render_mademyday,
    # New Creative Effects
    "movie_credits": _render_movie_credits,
    "horror_flicker": _render_horror_flicker,
    "old_film": _render_old_film,
    "action_impact": _render_action_impact,
    "dramatic_reveal": _render_dramatic_reveal,
    "hypnotic_spiral": _render_hypnotic_spiral,
    "mirror_reflect": _render_mirror_reflect,
    "shadow_clone": _render_shadow_clone,
    "echo_trail": _render_echo_trail,
    "double_vision": _render_double_vision,
    "slam_ground": _render_slam_ground,
    "speed_lines": _render_speed_lines,
    "power_up": _render_power_up,
    "punch_hit": _render_punch_hit,
    "explosion_entry": _render_explosion_entry,
    "paint_brush": _render_paint_brush,
    "graffiti_spray": _render_graffiti_spray,
    "neon_flicker": _render_neon_flicker,
    "watercolor_bleed": _render_watercolor_bleed,
    "chalk_write": _render_chalk_write,
    "pixelate_form": _render_pixelate_form,
    "game_damage": _render_game_damage,
    "level_up": _render_level_up,
    "coin_collect": _render_coin_collect,
    "glitch_teleport": _render_glitch_teleport,
    "tornado_spin": _render_tornado_spin,
    "underwater": _render_underwater,
    "sand_storm": _render_sand_storm,
    "lava_melt": _render_lava_melt,
    "freeze_crack": _render_freeze_crack,
    "magic_spell": _render_magic_spell,
    "portal_warp": _render_portal_warp,
    "invisibility_cloak": _render_invisibility_cloak,
    "summon_appear": _render_summon_appear,
    "fairy_dust": _render_fairy_dust,
    "like_burst": _render_like_burst,
    "story_swipe": _render_story_swipe,
    "notification_pop": _render_notification_pop,
    "trending_fire": _render_trending_fire,
    "viral_shake": _render_viral_shake,
    "disco_ball": _render_disco_ball,
    "fireworks": _render_fireworks,
    "balloon_pop": _render_balloon_pop,
    "jackpot_spin": _render_jackpot_spin,
    "party_mode": _render_party_mode,
}

