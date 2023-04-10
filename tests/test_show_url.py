from cfdraw import *


class HttpShowUrlPlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_TEXT_AREA

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=100,
            nodeConstraint=NodeConstraints.IMAGE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/effd9650ce934b239242c6122b701514.png",
            follow=True,
            pivot=PivotType.RT,
            offsetY=-48,
        )

    def process(self, data: IHttpPluginRequest) -> str:
        return data.nodeData.src or "Not Found"


register_plugin("show_url")(HttpShowUrlPlugin)
app = App()
