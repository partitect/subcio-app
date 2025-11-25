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
    """Previous/current/next grouped emphasis."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    words = self.words
    for i, word in enumerate(words):
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        parts = []
        if i > 0:
            prev = (words[i - 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{prev}")
        curr = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        parts.append(f"{{\\alpha&H00&\\fscx120\\fscy120\\1c&HFFFF00&\\blur3}}{curr}")
        if i < len(words) - 1:
            nxt = (words[i + 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\alpha&H80&\\fscx90\\fscy90}}{nxt}")
        full = " ".join(parts)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full}"
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
    """Current word bright, neighbors dimmed."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    words = self.words
    for i, word in enumerate(words):
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        parts = []
        if i > 0:
            prev = (words[i - 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{prev}")
        curr = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        parts.append(f"{{\\alpha&H00&\\fscx130\\fscy130\\1c&HFFFF00&\\blur4}}{curr}")
        if i < len(words) - 1:
            nxt = (words[i + 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\alpha&HA0&\\fscx85\\fscy85}}{nxt}")
        full = " ".join(parts)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(80,80)}}{full}"
        )
    return "\n".join(lines)

def _render_karaoke_pro(self) -> str:
    """Past/future colorization with scale bump on current."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    words = self.words
    color_past = self.style.get("color_past", "&H00808080")
    color_future = self.style.get("color_future", "&H00808080")
    outline_past = self.style.get("outline_past", "&H00000000")
    outline_future = self.style.get("outline_future", "&H00000000")

    for i, word in enumerate(words):
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        dur = max(1, end_ms - start_ms)
        line_parts = []
        for w_idx, w in enumerate(words):
            txt = (w.get("text") or "").replace("{", r"\{").replace("}", r"\}")
            if w_idx < i:
                style = f"\\1c{hex_to_ass(color_past)}\\3c{hex_to_ass(outline_past)}"
            elif w_idx == i:
                style = f"\\1c{hex_to_ass(self.style.get('primary_color', '&H00FFFFFF'))}\\3c{hex_to_ass(self.style.get('outline_color', '&H00000000'))}\\t(0,100,\\fscx115\\fscy115)\\t(100,{dur},\\fscx100\\fscy100)"
            else:
                style = f"\\1c{hex_to_ass(color_future)}\\3c{hex_to_ass(outline_future)}"
            line_parts.append(f"{{{style}}}{txt}")
        full = " ".join(line_parts)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})}}{full}"
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
    
    # Screen width for dynamic grouping (1920 default)
    screen_width = 1920
    max_text_width = screen_width * 0.85  # Use 85% of screen width
    
    # Estimate character width for grouping calculation
    char_width = font_size * 0.55 + letter_spacing
    
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
    
    # Dynamic grouping: min 2, max 3 words per group, respecting screen width
    def create_groups(words_list):
        groups = []
        i = 0
        while i < len(words_list):
            group = []
            group_text_len = 0
            
            # Try to add 2-3 words to group
            while i < len(words_list) and len(group) < 3:
                word_text = words_list[i].get("text", "") or ""
                word_len = len(word_text) * char_width
                
                # Check if adding this word exceeds max width
                space_width = char_width if group else 0
                if group_text_len + space_width + word_len > max_text_width and len(group) >= 2:
                    break
                
                group.append(words_list[i])
                group_text_len += space_width + word_len
                i += 1
                
                # If we have 2 words and next would exceed, stop
                if len(group) >= 2:
                    if i < len(words_list):
                        next_word_text = words_list[i].get("text", "") or ""
                        next_word_len = len(next_word_text) * char_width
                        if group_text_len + char_width + next_word_len > max_text_width:
                            break
            
            # Ensure minimum 2 words if possible
            if len(group) == 1 and i < len(words_list):
                group.append(words_list[i])
                i += 1
            
            if group:
                groups.append(group)
        
        return groups
    
    groups = create_groups(self.words)
    
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
            word_end_ms = int(active_word.get("end", word_start_ms / 1000) * 1000)
            
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
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(word_end_ms)},Default,,0,0,0,,"
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
    
    # Screen width for dynamic grouping (1920 default)
    screen_width = 1920
    max_text_width = screen_width * 0.85
    
    # Estimate character width for grouping calculation only
    char_width = font_size * 0.55 + letter_spacing
    
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
    
    # Dynamic grouping: min 2, max 3 words per group
    def create_groups(words_list):
        groups = []
        i = 0
        while i < len(words_list):
            group = []
            group_text_len = 0
            
            while i < len(words_list) and len(group) < 3:
                word_text = words_list[i].get("text", "") or ""
                word_len = len(word_text) * char_width
                
                space_width = char_width if group else 0
                if group_text_len + space_width + word_len > max_text_width and len(group) >= 2:
                    break
                
                group.append(words_list[i])
                group_text_len += space_width + word_len
                i += 1
                
                if len(group) >= 2:
                    if i < len(words_list):
                        next_word_text = words_list[i].get("text", "") or ""
                        next_word_len = len(next_word_text) * char_width
                        if group_text_len + char_width + next_word_len > max_text_width:
                            break
            
            if len(group) == 1 and i < len(words_list):
                group.append(words_list[i])
                i += 1
            
            if group:
                groups.append(group)
        
        return groups
    
    groups = create_groups(self.words)
    
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
                f"Dialogue: 0,{self._ms_to_timestamp(word_start_ms)},{self._ms_to_timestamp(word_end_ms)},Default,,0,0,0,,"
                f"{{\\an5\\pos({cx},{cy})}}{full_text}"
            )
    
    return "\n".join(lines)

def _render_dynamic_highlight(self) -> str:
    """Highlight current word using secondary color, neighbors normal."""
    lines = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    words = self.words
    primary = hex_to_ass(self.style.get("primary_color", "&H00FFFFFF"))
    secondary = hex_to_ass(self.style.get("secondary_color", "&H0000FFFF"))
    for i, word in enumerate(words):
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        parts = []
        if i > 0:
            prev_txt = (words[i - 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\1c{primary}}}{prev_txt}")
        current = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        parts.append(
            f"{{\\1c{primary}\\t(0,150,\\1c{secondary})\\t({max(end_ms-start_ms-150,0)},{end_ms-start_ms},\\1c{primary})}}{current}"
        )
        if i < len(words) - 1:
            next_txt = (words[i + 1].get("text") or "").replace("{", r"\{").replace("}", r"\}")
            parts.append(f"{{\\1c{primary}}}{next_txt}")
        full = " ".join(parts)
        lines.append(
            f"Dialogue: 1,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{full}"
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
}

