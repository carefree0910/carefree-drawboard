from typing import Dict
from typing import Type
from typing import Callable
from typing import NamedTuple

from cfdraw.utils.data_structures import Types
from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import IPluginSettings


TPlugin = Type[IPlugin]


class Plugins(Types[IPlugin]):
    pass


class PluginInfo(NamedTuple):
    name: str
    settings: IPluginSettings
    plugin_type: Type[IPlugin]


class PluginFactory:
    """
    A class to manage plugins
    > `plugins` stores all plugins that will be used on drawboard
    > `recorded` stores all plugins that are recorded, and can be accessed via `available`
    >> You can record a plugin by using the `record` decorator
    >> After which you can decide which plugins to use with the `register` method!
    > Notice that we don't need to guarantee that the plugin's name is identical to the plugin's identifier
    >> `plugins` use 'identifier' as the key, and `recorded` use 'name' as the key
    """

    plugins = Plugins()
    recorded = Plugins()
    internal_plugins = Plugins()

    @classmethod
    def _register(
        cls,
        d: Dict[str, IPlugin],
        identifier: str,
    ) -> Callable[[TPlugin], TPlugin]:
        if identifier in d:
            raise ValueError(f"plugin {identifier} already exists")

        def _fn(plugin_type: TPlugin) -> TPlugin:
            plugin_type.identifier = identifier
            d[identifier] = plugin_type
            return plugin_type

        return _fn

    @classmethod
    def register(cls, identifier: str) -> Callable[[TPlugin], TPlugin]:
        return cls._register(cls.plugins, identifier)

    @classmethod
    def register_internal(cls, identifier: str) -> Callable[[TPlugin], TPlugin]:
        return cls._register(cls.internal_plugins, identifier)

    @classmethod
    def record(cls, name: str) -> Callable[[TPlugin], TPlugin]:
        if name in cls.recorded:
            raise ValueError(f"plugin {name} already recorded")

        def _record(plugin_type: TPlugin) -> TPlugin:
            cls.recorded[name] = plugin_type
            return plugin_type

        return _record

    @classmethod
    def available(cls) -> Dict[str, PluginInfo]:
        return {
            name: PluginInfo(name, plugin_type().settings, plugin_type)
            for name, plugin_type in cls.recorded.items()
        }


__all__ = [
    "Plugins",
    "PluginInfo",
    "PluginFactory",
]
