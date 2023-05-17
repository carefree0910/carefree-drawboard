from typing import Type
from typing import Callable
from typing import NamedTuple
from cftool.data_structures import Types

from cfdraw.schema.plugins import IPlugin
from cfdraw.schema.plugins import IPluginSettings
from cfdraw.schema.plugins import IPluginGroupInfo


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
    > `internal_plugins` stores all plugins that are internally used,
    they have higest priority to be executed, and will not be shown on the drawboard
    """

    plugins = Plugins()
    internal_plugins = Plugins()

    @classmethod
    def _register(cls, d: Plugins, identifier: str) -> Callable[[TPlugin], TPlugin]:
        if identifier in d:
            raise ValueError(f"plugin {identifier} already exists")

        def _fn(plugin_type: TPlugin) -> TPlugin:
            plugin_type.identifier = identifier
            pI = plugin_type().settings.pluginInfo
            if isinstance(pI, IPluginGroupInfo):
                for p_identifier, p_base in pI.plugins.items():
                    p_base._in_group = True
                    cls._register(d, p_identifier)(p_base)
            d[identifier] = plugin_type
            return plugin_type

        return _fn

    @classmethod
    def register(cls, identifier: str) -> Callable[[TPlugin], TPlugin]:
        return cls._register(cls.plugins, identifier)

    @classmethod
    def register_internal(cls, identifier: str) -> Callable[[TPlugin], TPlugin]:
        return cls._register(cls.internal_plugins, identifier)


__all__ = [
    "Plugins",
    "PluginInfo",
    "PluginFactory",
]
