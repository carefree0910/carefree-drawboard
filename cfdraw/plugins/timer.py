from datetime import datetime
from cftool.constants import TIME_FORMAT

from ..schema.plugins import *


class TimerPlugin(IHttpPlugin[TextAreaResponse]):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=70,
            type=PluginType.HTTP_TEXT_AREA,
            nodeConstraint=NodeConstraints.NONE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/63c07ca52b2b42ef943bcf04c8e78878.png",
            pivot=PivotType.TOP,
            pluginInfo=ITextAreaPluginInfo(
                updateInterval=1000,
                noLoading=True,
                textAlign=TextAlign.CENTER,
            ),
        )

    def process(self, data: IParsedHttpPluginRequest) -> TextAreaResponse:
        return TextAreaResponse(
            success=True,
            message="",
            data=TextAreaModel(text=datetime.now().strftime(TIME_FORMAT)),
        )


__all__ = [
    "TimerPlugin",
]
