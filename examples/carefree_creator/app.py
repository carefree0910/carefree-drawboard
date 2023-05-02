from PIL import Image
from typing import List

from cfdraw import *
from cfdraw.schema.plugins import IPluginSettings

from utils import *
from fields import *


@cache_resource
def get_apis() -> APIs:
    return APIs()


class Txt2Img(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.TEXT_TO_IMAGE_ICON,
            tooltip="Text to Image",
            pluginInfo=IFieldsPluginInfo(
                header="Text to Image",
                numColumns=2,
                definitions=txt2img_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        return await get_apis().txt2img(Txt2ImgSDModel(**data.extraData))


class Img2Img(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.IMAGE_TO_IMAGE_ICON,
            tooltip="Image to Image",
            pluginInfo=IFieldsPluginInfo(
                header="Image to Image",
                numColumns=2,
                definitions=img2img_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        kw = dict(url=data.nodeData.src, **data.extraData)
        return await get_apis().img2img(Img2ImgSDModel(**kw))


class SR(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=160,
            src=constants.SR_ICON,
            tooltip="Super Resolution",
            pluginInfo=IFieldsPluginInfo(
                header="Super Resolution",
                definitions=sr_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        kw = dict(url=data.nodeData.src, **data.extraData)
        return await get_apis().sr(Img2ImgSRModel(**kw))


class SOD(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=110,
            src=constants.SOD_ICON,
            tooltip="Image Matting",
            pluginInfo=IFieldsPluginInfo(header="Image Matting", definitions={}),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        return await get_apis().sod(Img2ImgSODModel(url=data.nodeData.src))


class Inpainting(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=260,
            h=200,
            useModal=False,
            src=constants.INPAINTING_ICON,
            tooltip="Erase the masked area and fill it with the background",
            pluginInfo=IFieldsPluginInfo(header="Erase", definitions=inpainting_fields),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        url = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0].src
        mask_url = self.filter(data.nodeDataList, SingleNodeType.PATH)[0].src
        kw = dict(url=url, mask_url=mask_url, **data.extraData)
        return await get_apis().inpainting(Img2ImgInpaintingModel(**kw))


class SDInpainting(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.SD_INPAINTING_ICON,
            tooltip="Replace the masked area and fill it with the description",
            pluginInfo=IFieldsPluginInfo(
                header="Erase & Replace",
                numColumns=2,
                definitions=txt2img_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        url = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0].src
        mask_url = self.filter(data.nodeDataList, SingleNodeType.PATH)[0].src
        kw = dict(url=url, mask_url=mask_url, **data.extraData)
        return await get_apis().sd_inpainting(Txt2ImgSDInpaintingModel(**kw))


class StaticPlugins(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_group_styles,
            tooltip="A set of plugins for generating images",
            pivot=PivotType.RIGHT,
            follow=False,
            pluginInfo=IPluginGroupInfo(
                header="Creator Toolbox",
                plugins=dict(
                    txt2img=Txt2Img,
                ),
            ),
        )


class ImageFollowers(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_group_styles,
            tooltip="A set of plugins which can generate images from given images",
            nodeConstraint=NodeConstraints.IMAGE,
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IPluginGroupInfo(
                header="Image Toolbox",
                plugins=dict(
                    sr=SR,
                    sod=SOD,
                    img2img=Img2Img,
                ),
            ),
        )


class InpaintingFollowers(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_group_styles,
            offsetX=-48,
            expandOffsetX=56,
            tooltip="A set of plugins which uses an image and a mask to generate images",
            nodeConstraintRules=NodeConstraintRules(
                exactly=[NodeConstraints.IMAGE, NodeConstraints.PATH]
            ),
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IPluginGroupInfo(
                header="Inpainting Toolbox",
                plugins=dict(
                    inpainting=Inpainting,
                    sd_inpainting=SDInpainting,
                ),
            ),
        )


# uncomment this line to pre-load the models
# get_apis()
register_plugin("static")(StaticPlugins)
register_plugin("image_followers")(ImageFollowers)
register_plugin("inpainting_followers")(InpaintingFollowers)
app = App()
