from cfdraw.app import App
from cfdraw.schema import *
from cfdraw.parsers import *
from cfdraw.plugins import *
from cfdraw.utils.misc import offload
from cfdraw.utils.misc import offload_run
from cfdraw.utils.cache import cache_resource

register_plugin = PluginFactory.register
available_plugins = PluginFactory.available


def register_all_available_plugins() -> None:
    for name, info in available_plugins().items():
        register_plugin(name)(info.plugin_type)
