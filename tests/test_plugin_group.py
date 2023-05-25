from cfdraw import *
from cfdraw.schema.plugins import IPluginSettings


class Plugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=260,
            h=180,
            pluginInfo=IFieldsPluginInfo(
                definitions=dict(foo=ITextField(default="tExT", tooltip="bar"))
            ),
        )

    async def process(self, data: ISocketRequest) -> str:
        return data.extraData["foo"]


class PluginGroup(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            pivot=PivotType.RIGHT,
            pluginInfo=IPluginGroupInfo(plugins=dict(bar=Plugin)),
        )


register_plugin("plugins")(PluginGroup)
app = App()