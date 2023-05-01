from PIL import Image
from PIL import ImageFilter

from cfdraw import *


class GrayScalePlugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/2f236a9291a04cadb9a0d8705f5537c3.png",
            tooltip="Convert the image to grayscale",
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
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/37a7936897494bd9ae96de5912210841.png",
            tooltip="Find edges in the image",
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
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/c60613dcaf514975a211a75535a5b81b.png",
            tooltip="Apply Gaussian Blur to the image",
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


class ImageProcessingGroup(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=110,
            pivot=PivotType.RT,
            nodeConstraint=NodeConstraints.IMAGE,
            follow=True,
            tooltip="Image Processing",
            pluginInfo=IPluginGroupInfo(
                header="Image Processing",
                plugins=dict(
                    gray_scale=GrayScalePlugin,
                    edge=EdgePlugin,
                    blur=GaussianBlurPlugin,
                ),
            ),
        )


register_plugin("image_processing")(ImageProcessingGroup)
app = App()
