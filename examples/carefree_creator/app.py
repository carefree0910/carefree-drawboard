from PIL import Image
from typing import List
from pathlib import Path
from cftool.misc import shallow_copy_dict
from cfcreator.common import VariationModel
from cflearn.misc.toolkit import new_seed

from cfdraw import *
from cfdraw.schema.plugins import IPluginSettings

from utils import *
from fields import *


def inject(self: IFieldsPlugin, data: ISocketRequest) -> ISocketRequest:
    if data.extraData["seed"] == -1:
        data.extraData["seed"] = new_seed()
    if data.extraData["lora"] != lora_field.defaultPlaceholder:
        lora_name = data.extraData.pop("lora")
        folder = Path(lora_field.path)
        if folder.is_dir():
            for path in folder.iterdir():
                if path.stem == lora_name:
                    data.extraData["lora_paths"] = [str(path)]
                    data.extraData.setdefault("lora_scales", {lora_name: 1.0})
                    break
    self.extra_responses["seed"] = data.extraData["seed"]
    return data


Txt2ImgKey = "txt2img"
Img2ImgKey = "img2img"
SRKey = "sr"
SODKey = "sod"
CaptioningKey = "captioning"
InpaintingKey = "inpainting"
SDInpaintingKey = "sd_inpainting"
SDOutpaintingKey = "sd_outpainting"
VariationKey = "variation"


notification = """
* This demo requires 16GB GPU memory.
* This demo migrates `carefree-creator`'s functionalities to `carefree-drawboard` 🎨:
1. Text to Image generation.
2. Image to Image generation.
3. Variation generation.
4. Super Resolution.
5. Image Matting.
6. Image Captioning.
7. Inpainting (Erase).
8. Stable Diffusion Inpainting (Erase & Replace).
9. Stable Diffusion Outpainting.
10. And much more to come!
"""


class CarefreeCreatorPlugin(IFieldsPlugin):
    requirements = ["carefree-creator>=0.2.4"]


class Txt2Img(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.TEXT_TO_IMAGE_ICON,
            tooltip=I18N(
                zh="生成符合文本描述的图片",
                en="Text to Image",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="文本生成图片",
                    en="Text to Image",
                ),
                numColumns=2,
                definitions=txt2img_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        kw = inject(self, data).extraData
        model = Txt2ImgSDModel(**kw)
        if kw["use_highres"]:
            model.highres_info = HighresModel()
        return await get_apis().txt2img(model, step_callback=callback)


class Img2Img(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.IMAGE_TO_IMAGE_ICON,
            tooltip=I18N(
                zh="以当前图片为参考图，生成符合文本描述的图片",
                en="Image to Image",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="垫图生成",
                    en="Image to Image",
                ),
                numColumns=2,
                definitions=img2img_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        url = data.nodeData.src
        kw = dict(url=url, **inject(self, data).extraData)
        model = Img2ImgSDModel(**kw)
        if kw["use_highres"]:
            model.highres_info = HighresModel()
        self.extra_responses["url"] = url
        return await get_apis().img2img(model, step_callback=callback)


class SR(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=180,
            src=constants.SR_ICON,
            tooltip=I18N(
                zh="图片变高清",
                en="Super Resolution",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="图片变高清",
                    en="Super Resolution",
                ),
                definitions=sr_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        kw = dict(url=data.nodeData.src, **data.extraData)
        return await get_apis().sr(Img2ImgSRModel(**kw))


class SOD(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=110,
            src=constants.SOD_ICON,
            tooltip=I18N(
                zh="抠图",
                en="Image Matting",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="抠图",
                    en="Image Matting",
                ),
                definitions={},
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        return await get_apis().sod(Img2ImgSODModel(url=data.nodeData.src))


class Captioning(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=110,
            src=constants.IMAGE_TO_TEXT_ICON,
            tooltip=I18N(
                zh="生成图片描述",
                en="Image Captioning",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="图片描述",
                    en="Image Captioning",
                ),
                definitions={},
            ),
        )

    async def process(self, data: ISocketRequest) -> List[str]:
        return await get_apis().image_captioning(Img2TxtModel(url=data.nodeData.src))


class Inpainting(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=260,
            h=200,
            src=constants.INPAINTING_ICON,
            tooltip=I18N(
                zh="擦除蒙版区域并填充合适的背景",
                en="Erase the masked area and fill it with the background",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="局部擦除",
                    en="Erase",
                ),
                definitions=inpainting_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback() -> bool:
            nonlocal counter
            counter += 1.0
            return self.send_progress(min(1.0, counter / total_steps))

        url = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0].src
        mask_url = self.filter(data.nodeDataList, SingleNodeType.PATH)[0].src
        model = Img2ImgInpaintingModel(url=url, mask_url=mask_url, **data.extraData)
        if model.model == "sd":
            model.use_pipeline = True
        counter = 0.0
        if not model.use_pipeline:
            total_steps = model.num_steps
        else:
            total_steps = model.num_steps * (2.0 - model.refine_fidelity)
        return await get_apis().inpainting(model, step_callback=callback)


class SDInpainting(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.SD_INPAINTING_ICON,
            tooltip=I18N(
                zh="在蒙版区域内填充符合描述的内容",
                en="Replace the masked area and fill it with the description",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="局部替换",
                    en="Erase & Replace",
                ),
                numColumns=2,
                definitions=sd_inpainting_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        url = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0].src
        mask_url = self.filter(data.nodeDataList, SingleNodeType.PATH)[0].src
        kw = inject(self, data).extraData
        self.extra_responses.update(url=url, mask_url=mask_url)
        model = Txt2ImgSDInpaintingModel(url=url, mask_url=mask_url, **kw)
        return await get_apis().sd_inpainting(model, step_callback=callback)


class SDOutpainting(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.SD_OUTPAINTING_ICON,
            tooltip=I18N(
                zh="图像外延",
                en="Outpainting",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="图像外延",
                    en="Outpainting",
                ),
                numColumns=2,
                definitions=sd_inpainting_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        url = data.nodeData.src
        kw = inject(self, data).extraData
        self.extra_responses.update(url=url)
        model = Txt2ImgSDOutpaintingModel(url=url, **kw)
        return await get_apis().sd_outpainting(model, step_callback=callback)


variation_targets = {
    Txt2ImgKey,
    Img2ImgKey,
    VariationKey,
    SDInpaintingKey,
    SDOutpaintingKey,
}


@register_node_validator("variation")
def validate_variation(data: ISocketRequest) -> bool:
    identifier = data.nodeData.meta["data"].get("identifier")
    return identifier in variation_targets


class Variation(CarefreeCreatorPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=260,
            h=200,
            nodeConstraint=NodeConstraints.IMAGE,
            nodeConstraintValidator="variation",
            src=constants.VARIATION_ICON,
            tooltip=I18N(
                zh="生成与当前图片相似的图片",
                en="Generate vatiation of the given image",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="生成相似图片",
                    en="Variation",
                ),
                definitions=variation_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        meta_data = data.nodeData.meta["data"]
        task = meta_data["identifier"]
        if task == VariationKey:
            extra = meta_data["response"]["extra"]
            task = extra["task"]
            kw = extra["request"]
        else:
            kw = meta_data["parameters"]
            extra = meta_data["response"].get("extra", {})
            if kw["seed"] == -1:
                generated_seed = extra.get("seed")
                if generated_seed is None:
                    self.send_exception("cannot find a static seed")
                    return []
                kw["seed"] = generated_seed
            if task == Img2ImgKey or task == SDOutpaintingKey:
                url = extra.get("url")
                if url is None:
                    self.send_exception("cannot find `url`")
                    return []
                kw["url"] = url
            elif task == SDInpaintingKey:
                url = extra.get("url")
                mask_url = extra.get("mask_url")
                if url is None or mask_url is None:
                    self.send_exception("cannot find `url` or `mask_url`")
                    return []
                kw["url"] = url
                kw["mask_url"] = mask_url
        # inject varations
        strength = 1.0 - data.extraData["fidelity"]
        variations = kw.setdefault("variations", [])
        variations.append(VariationModel(seed=new_seed(), strength=strength))
        # inject extra response
        self.extra_responses["task"] = task
        self.extra_responses["request"] = shallow_copy_dict(kw)
        # switch case
        if task == Txt2ImgKey:
            model = Txt2ImgSDModel(**kw)
            if kw["use_highres"]:
                model.highres_info = HighresModel()
            return await get_apis().txt2img(model, step_callback=callback)
        if task == Img2ImgKey:
            model = Img2ImgSDModel(**kw)
            if kw["use_highres"]:
                model.highres_info = HighresModel()
            return await get_apis().img2img(model, step_callback=callback)
        if task == SDInpaintingKey:
            model = Txt2ImgSDInpaintingModel(**kw)
            return await get_apis().sd_inpainting(model, step_callback=callback)
        if task == SDOutpaintingKey:
            model = Txt2ImgSDOutpaintingModel(**kw)
            return await get_apis().sd_outpainting(model, step_callback=callback)
        self.send_exception(f"unknown task: {task}")
        return []


class StaticPlugins(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_group_styles,
            tooltip=I18N(
                zh="一组用于生成图片的插件",
                en="A set of plugins for generating images",
            ),
            pivot=PivotType.RIGHT,
            follow=False,
            pluginInfo=IPluginGroupInfo(
                name=I18N(
                    zh="创意工具箱",
                    en="Creator Toolbox",
                ),
                header=I18N(
                    zh="创意工具箱",
                    en="Creator Toolbox",
                ),
                plugins={
                    Txt2ImgKey: Txt2Img,
                },
            ),
        )


class ImageFollowers(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=common_group_styles["w"],
            h=164,
            tooltip=I18N(
                zh="一组将 AI 技术应用于当前图片的插件",
                en="A set of plugins that apply AI techniques to the given image",
            ),
            nodeConstraint=NodeConstraints.IMAGE,
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IPluginGroupInfo(
                name=I18N(
                    zh="图片工具箱",
                    en="Image Toolbox",
                ),
                header=I18N(
                    zh="图片工具箱",
                    en="Image Toolbox",
                ),
                plugins={
                    SRKey: SR,
                    SODKey: SOD,
                    Img2ImgKey: Img2Img,
                    CaptioningKey: Captioning,
                    VariationKey: Variation,
                },
            ),
        )


class InpaintingFollowers(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_group_styles,
            offsetX=-48,
            expandOffsetX=64,
            tooltip=I18N(
                zh="一组利用当前图片+蒙版来进行生成的插件",
                en="A set of plugins which uses an image and a mask to generate images",
            ),
            nodeConstraintRules=NodeConstraintRules(
                exactly=[NodeConstraints.IMAGE, NodeConstraints.PATH]
            ),
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IPluginGroupInfo(
                name=I18N(
                    zh="蒙版工具箱",
                    en="Inpainting Toolbox",
                ),
                header=I18N(
                    zh="蒙版工具箱",
                    en="Inpainting Toolbox",
                ),
                plugins={
                    InpaintingKey: Inpainting,
                    SDInpaintingKey: SDInpainting,
                },
            ),
        )


@register_node_validator("canvas")
def validate_canvas(data: ISocketRequest) -> bool:
    return data.nodeData.meta["type"] == "add.blank"


class CanvasFollowers(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_group_styles,
            tooltip=I18N(
                zh="一组利用空白画布来进行生成的插件",
                en="A set of plugins which uses a blank canvas to generate images",
            ),
            nodeConstraint=NodeConstraints.RECTANGLE,
            nodeConstraintValidator="canvas",
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IPluginGroupInfo(
                name=I18N(
                    zh="画布工具箱",
                    en="Canvas Toolbox",
                ),
                header=I18N(
                    zh="画布工具箱",
                    en="Canvas Toolbox",
                ),
                plugins={
                    SDOutpaintingKey: SDOutpainting,
                },
            ),
        )


# uncomment this line to pre-load the models
# get_apis()
register_plugin("static")(StaticPlugins)
register_plugin("image_followers")(ImageFollowers)
register_plugin("inpainting_followers")(InpaintingFollowers)
register_plugin("canvas_followers")(CanvasFollowers)
app = App(notification)
