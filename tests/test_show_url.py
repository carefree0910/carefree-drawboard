from cfdraw import *


class ShowUrlPlugin(ITextAreaPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=320,
            h=100,
            nodeConstraint=NodeConstraints.IMAGE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/effd9650ce934b239242c6122b701514.png",
            tooltip="Show the URL of the image",
            follow=True,
            pivot=PivotType.RT,
        )

    async def process(self, data: ISocketRequest) -> str:
        return data.nodeData.src or "Not Found"


register_plugin("show_url")(ShowUrlPlugin)
app = App()
