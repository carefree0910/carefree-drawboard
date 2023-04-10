from typing import Dict
from typing import Type
from typing import Callable

from cfdraw.schema.plugins import IPlugin

TPlugin = Type[IPlugin]


class PluginFactory:
    plugins: Dict[str, IPlugin] = {}

    @classmethod
    def register(cls, identifier: str) -> Callable[[TPlugin], TPlugin]:
        if identifier in cls.plugins:
            raise ValueError(f"plugin {identifier} already exists")

        def _register(plugin: TPlugin) -> TPlugin:
            plugin.identifier = identifier
            cls.plugins[identifier] = plugin()
            return plugin

        return _register


__all__ = [
    "PluginFactory",
]
