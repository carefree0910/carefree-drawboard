from PIL import Image
from typing import List
from cfcreator.common import VariationModel
from cflearn.misc.toolkit import new_seed

from cfdraw import *
from cfdraw.schema.plugins import IPluginSettings

from utils import *
from fields import *


@cache_resource
def get_apis() -> APIs:
    return APIs()


def inject_seed(self: IFieldsPlugin, data: ISocketRequest) -> ISocketRequest:
    if data.extraData["seed"] == -1:
        data.extraData["seed"] = new_seed()
    self.extra_responses["seed"] = data.extraData["seed"]
    return data


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
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        kw = inject_seed(self, data).extraData
        return await get_apis().txt2img(Txt2ImgSDModel(**kw), step_callback=callback)


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
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        kw = dict(url=data.nodeData.src, **inject_seed(self, data).extraData)
        return await get_apis().img2img(Img2ImgSDModel(**kw), step_callback=callback)


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
        def callback() -> bool:
            nonlocal counter
            counter += 1.0
            return self.send_progress(counter / total_steps)

        url = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0].src
        mask_url = self.filter(data.nodeDataList, SingleNodeType.PATH)[0].src
        model = Img2ImgInpaintingModel(url=url, mask_url=mask_url, **data.extraData)
        counter = 0.0
        if not model.use_pipeline:
            total_steps = model.num_steps
        else:
            total_steps = model.num_steps * (2.0 - model.refine_fidelity)
        return await get_apis().inpainting(model, step_callback=callback)


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
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        url = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0].src
        mask_url = self.filter(data.nodeDataList, SingleNodeType.PATH)[0].src
        kw = inject_seed(self, data).extraData
        model = Txt2ImgSDInpaintingModel(url=url, mask_url=mask_url, **kw)
        return await get_apis().sd_inpainting(model, step_callback=callback)


variation_targets = {
    "txt2img",
    "img2img",
    "variation",
    "txt2img.inpainting",
    "txt2img.outpainting",
}


@register_node_validator("variation")
def validate_variation(data: ISocketRequest) -> bool:
    identifier = data.nodeData.meta["data"].get("identifier")
    return identifier in variation_targets


class Variation(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=260,
            h=200,
            useModal=False,
            nodeConstraint=NodeConstraints.IMAGE,
            nodeConstraintValidator="variation",
            src=constants.VARIATION_ICON,
            tooltip="Generate vatiation of the given image",
            pluginInfo=IFieldsPluginInfo(
                header="Variation", definitions=variation_fields
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        meta_data = data.nodeData.meta["data"]
        task = meta_data["identifier"]
        kw = meta_data["parameters"]
        if kw["seed"] == -1:
            generated_seed = meta_data["response"].get("extra", {}).get("seed")
            if generated_seed is None:
                self.send_exception("cannot find a static seed")
                return []
            kw["seed"] = generated_seed
        # inject varations
        strength = 1.0 - data.extraData["fidelity"]
        variations = kw.setdefault("variations", [])
        variations.append(VariationModel(seed=new_seed(), strength=strength))
        # switch case
        if task == "txt2img" or task == "txt2img.variation":
            model = Txt2ImgSDModel(**kw)
            return await get_apis().txt2img(model, step_callback=callback)
        if task == "img2img" or task == "img2img.variation":
            model = Img2ImgSDModel(**kw)
            return await get_apis().img2img(model, step_callback=callback)
        model = Txt2ImgSDInpaintingModel(**kw)
        return await get_apis().sd_inpainting(model, step_callback=callback)


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
                    variation=Variation,
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
