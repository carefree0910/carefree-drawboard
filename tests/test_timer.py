from datetime import datetime
from cftool.constants import TIME_FORMAT

from cfdraw import *


class HttpTimerPlugin(IHttpTextAreaPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=70,
            nodeConstraint=NodeConstraints.NONE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/63c07ca52b2b42ef943bcf04c8e78878.png",
            pivot=PivotType.TOP,
            pluginInfo=IHttpTextAreaPluginInfo(
                updateInterval=1000,
                noLoading=True,
                textAlign=TextAlign.CENTER,
            ),
        )

    def process(self, data: IHttpPluginRequest) -> str:
        return datetime.now().strftime(TIME_FORMAT)


register_plugin("timer")(HttpTimerPlugin)
app = App()
