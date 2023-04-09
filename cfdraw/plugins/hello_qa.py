from ..schema.plugins import *


class HelloQAPlugin(IHttpPlugin[TextAreaResponse]):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=500,
            h=200,
            type=PluginType.HTTP_QA,
            nodeConstraint=NodeConstraints.NONE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/de36770b26144a2c9c25f229e98167c8.png",
            pivot=PivotType.CENTER,
            pluginInfo=IQAPluginInfo(initialText="Hello, world!"),
        )

    def process(self, data: IHttpPluginRequest) -> TextAreaResponse:
        return TextAreaResponse(
            success=True,
            message="",
            data=TextAreaModel(text=f"Hello, {data.data['text']}!"),
        )


__all__ = [
    "HelloQAPlugin",
]
