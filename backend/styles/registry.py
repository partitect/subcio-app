from typing import Dict, Type, Optional
from .base import StyleRenderer

class StyleRegistry:
    _registry: Dict[str, Type[StyleRenderer]] = {}

    @classmethod
    def register(cls, style_id: str):
        def decorator(renderer_cls: Type[StyleRenderer]):
            cls._registry[style_id] = renderer_cls
            return renderer_cls
        return decorator

    @classmethod
    def get_renderer_class(cls, style_id: str) -> Optional[Type[StyleRenderer]]:
        return cls._registry.get(style_id)

    @classmethod
    def list_styles(cls):
        return list(cls._registry.keys())
