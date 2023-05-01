from datetime import datetime
from cftool.constants import TIME_FORMAT

from cfdraw import *


class TimerPlugin(ITextAreaPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=70,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/63c07ca52b2b42ef943bcf04c8e78878.png",
            tooltip="Show the current time, will update every second",
            pivot=PivotType.TOP,
            pluginInfo=ITextAreaPluginInfo(
                updateInterval=1000,
                noLoading=True,
                textAlign=TextAlign.CENTER,
            ),
        )

    async def process(self, data: ISocketRequest) -> str:
        return datetime.now().strftime(TIME_FORMAT)


register_plugin("timer")(TimerPlugin)
app = App()
