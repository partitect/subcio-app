from .base import StyleRenderer
from .registry import StyleRegistry
from .utils import ms_to_ass
import random

@StyleRegistry.register("word_pop")
class WordPopRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fscx80\\fscy80\\t(0,80,\\fscx110\\fscy110)\\t(80,150,\\fscx100\\fscy100)}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("neon_pulse")
class NeonPulseRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            mid = dur // 2
            anim = f"\\t(0,{mid},\\fscx115\\fscy115\\blur10)\\t({mid},{dur},\\fscx100\\fscy100\\blur2)"
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(50,50){anim}}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("kinetic_bounce")
class KineticBounceRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy-100},{cx},{cy},0,150)\\t(150,250,\\fscx120\\fscy80)\\t(250,400,\\fscx100\\fscy100)}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("cinematic_blur")
class CinematicBlurRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\blur20\\t(0,150,\\blur0)\\t({dur-150},{dur},\\blur20)\\fad(100,100)}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("typewriter_pro")
class TypewriterProRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})\\frz90\\t(0,100,\\frz0)}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("retro_arcade")
class RetroArcadeRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\pos({cx},{cy})}}{word['text']}"]
        return self._base_loop(effect)

@StyleRegistry.register("news_ticker")
class NewsTickerRenderer(StyleRenderer):
    def render(self) -> str:
        def effect(word, start, end, dur, cx, cy):
            return [f"Dialogue: 1,{ms_to_ass(start)},{ms_to_ass(end)},Default,,0,0,0,,{{\\an5\\move({cx},{cy+20},{cx},{cy},0,100)}}{word['text']}"]
        return self._base_loop(effect)
