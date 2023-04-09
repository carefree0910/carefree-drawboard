from cfdraw import *


class MyHttpMetaPlugin(HttpMetaPlugin):
    @property
    def settings(self) -> IPluginSettings:
        settings: IPluginSettings = super().settings
        settings.pivot = PivotType.RT  # change it to see hot reload!
        return settings


register_plugin("meta")(MyHttpMetaPlugin)
app = App()
