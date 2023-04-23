from PIL import Image
from PIL import ImageFilter

from cfdraw import *


class GrayScalePlugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            nodeConstraint=NodeConstraints.IMAGE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/2f236a9291a04cadb9a0d8705f5537c3.png",
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IFieldsPluginInfo(header="To Gray", definitions={}),
            p="6px",
            expandProps=IChakra(bg="green.50"),
        )

    async def process(self, data: ISocketRequest) -> Image.Image:
        image = await self.load_image(data.nodeData.src)
        return image.convert("L")


class EdgePlugin(IFieldsPlugin):
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
            pluginInfo=IFieldsPluginInfo(definitions={}),
        )

    async def process(self, data: ISocketRequest) -> Image.Image:
        image = await self.load_image(data.nodeData.src)
        return image.convert("L").filter(ImageFilter.FIND_EDGES)


class GaussianBlurPlugin(IFieldsPlugin):
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
            expandOffsetY=-188,
            pluginInfo=IFieldsPluginInfo(
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

    async def process(self, data: ISocketRequest) -> Image.Image:
        image = await self.load_image(data.nodeData.src)
        return image.filter(ImageFilter.GaussianBlur(data.extraData["size"]))


register_plugin("gray_scale")(GrayScalePlugin)
register_plugin("edge")(EdgePlugin)
register_plugin("blur")(GaussianBlurPlugin)
app = App()
