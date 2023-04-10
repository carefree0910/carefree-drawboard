from cfdraw import *


class HttpHelloQAPlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_QA

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=500,
            h=200,
            nodeConstraint=NodeConstraints.NONE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/de36770b26144a2c9c25f229e98167c8.png",
            pivot=PivotType.CENTER,
            pluginInfo=IHttpQAPluginInfo(initialText="Hello, world!"),
        )

    def process(self, data: IHttpPluginRequest) -> str:
        return f"Hello, {data.extraData['text']}!"


register_plugin("hello_qa")(HttpHelloQAPlugin)
app = App()
