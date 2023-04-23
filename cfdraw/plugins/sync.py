from cfdraw import constants
from cfdraw.config import get_config
from cfdraw.schema.plugins import *
from cfdraw.plugins.base import *
from cfdraw.plugins.factory import PluginFactory


@PluginFactory.register_internal("sync")
class SyncSocketPlugin(IInternalSocketPlugin):
    async def process(self, data: ISocketRequest) -> ISocketMessage:
        config = get_config()
        return ISocketMessage.make_success(
            data.hash,
            dict(
                pluginSettings=[
                    plugin_type().to_plugin_settings()
                    for plugin_type in PluginFactory.plugins.values()
                ],
                globalSettings=dict(
                    useStrictMode=config.use_react_strict_mode,
                    sockenEndpoint=str(constants.Endpoint.WEBSOCKET),
                ),
            ),
        )


__all__ = [
    "SyncSocketPlugin",
]
