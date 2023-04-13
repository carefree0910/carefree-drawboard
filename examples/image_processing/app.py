from PIL import Image
from PIL import ImageFilter

from cfdraw import *


class HttpGrayScalePlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_FIELDS

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            nodeConstraint=NodeConstraints.IMAGE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/2f236a9291a04cadb9a0d8705f5537c3.png",
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IHttpFieldsPluginInfo(header="To Gray", definitions={}),
            p="6px",
            expandProps=IChakra(bg="green.50"),
        )

    def process(self, data: IHttpPluginRequest) -> Image.Image:
        return self.load_image(data.nodeData.src).convert("L")


class HttpEdgePlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_FIELDS

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            nodeConstraint=NodeConstraints.IMAGE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/37a7936897494bd9ae96de5912210841.png",
            pivot=PivotType.RT,
            follow=True,
            offsetY=104,
            pluginInfo=IHttpFieldsPluginInfo(definitions={}),
        )

    def process(self, data: IHttpPluginRequest) -> Image.Image:
        return (
            self.load_image(data.nodeData.src)
            .convert("L")
            .filter(ImageFilter.FIND_EDGES)
        )


class HttpGaussianBlurPlugin(IHttpPlugin):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_FIELDS

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=300,
            h=180,
            nodeConstraint=NodeConstraints.IMAGE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/c60613dcaf514975a211a75535a5b81b.png",
            pivot=PivotType.RT,
            follow=True,
            offsetX=-48,
            expandOffsetY=-148,
            pluginInfo=IHttpFieldsPluginInfo(
                definitions=dict(
                    size=INumberField(
                        default=3,
                        min=1,
                        max=10,
                        step=1,
                        isInt=True,
                        label="Size",
                    )
                ),
                closeOnSubmit=False,
            ),
        )

    def process(self, data: IHttpPluginRequest) -> Image.Image:
        image = self.load_image(data.nodeData.src)
        return image.filter(ImageFilter.GaussianBlur(data.extraData["size"]))


register_plugin("gray_scale")(HttpGrayScalePlugin)
register_plugin("edge")(HttpEdgePlugin)
register_plugin("blur")(HttpGaussianBlurPlugin)
register_all_available_plugins()
app = App()
