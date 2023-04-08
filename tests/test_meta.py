from cfdraw import *


class MyMetaPlugin(MetaPlugin):
    @property
    def settings(self) -> IPluginSettings:
        settings = super().settings
        settings.pivot = PivotType.RT  # change it to see hot reload!
        return settings


register_plugin("meta")(MyMetaPlugin)
app = App()
