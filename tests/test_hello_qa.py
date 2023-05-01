from cfdraw import *


class HelloQAPlugin(IQAPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=500,
            h=200,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/de36770b26144a2c9c25f229e98167c8.png",
            tooltip="Hello!",
            pivot=PivotType.CENTER,
            pluginInfo=IQAPluginInfo(
                initialText="Hello, world!",
                closeOnSubmit=False,
            ),
        )

    async def process(self, data: ISocketRequest) -> str:
        return f"Hello, {data.extraData['text']}!"


register_plugin("hello_qa")(HelloQAPlugin)
app = App()
