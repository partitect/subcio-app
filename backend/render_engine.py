from typing import List, Dict
from styles import StyleRegistry, StyleRenderer

# Ensure all styles are registered
import styles

class AdvancedRenderer:
    def __init__(self, words: List[Dict], style: Dict):
        self.words = words
        self.style = style

    def render(self) -> str:
        style_id = self.style.get("id", "default").replace("-", "_")
        
        # Get renderer class from registry
        renderer_cls = StyleRegistry.get_renderer_class(style_id)
        
        if not renderer_cls:
            # Fallback to word_pop if style not found
            print(f"Style '{style_id}' not found, falling back to word_pop")
            renderer_cls = StyleRegistry.get_renderer_class("word_pop")
            
        if not renderer_cls:
            # Should not happen if word_pop is registered, but just in case
            return ""

        # Instantiate and render
        renderer = renderer_cls(self.words, self.style)
        return renderer.render()
