import os
import json

from PIL import Image
from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import TypeVar
from typing import Optional
from pathlib import Path
from pydantic import BaseModel
from cftool.misc import shallow_copy_dict
from cfcreator.common import InpaintingMode
from cflearn.misc.toolkit import new_seed
from cfcreator.sdks.apis import ALL_LATENCIES_KEY

from cfdraw import *

from utils import *
from fields import *


TDataModel = TypeVar("TDataModel", bound="BaseModel")
text_keys = ["text", "prompt", "negative_prompt"]
CUSTOM_EMBEDDINGS_PATH = os.environ.get("CFDRAW_CFCREATOR_CUSTOM_EMBEDDINGS_PATH")


def trim_custom_embeddings(params: Any) -> Any:
    def _core(p: Any) -> Any:
        if isinstance(p, list):
            return [_core(v) for v in p]
        if not isinstance(p, dict):
            return p
        p = shallow_copy_dict(p)
        for k, v in p.items():
            if k == "custom_embeddings":
                if v is None or not isinstance(v, dict):
                    continue
                p[k] = {vk: None for vk in v}
            elif isinstance(p, (list, dict)):
                p[k] = _core(v)
        return p

    return _core(params)


def get_custom_embeddings_mapping() -> Optional[Dict[str, Path]]:
    if CUSTOM_EMBEDDINGS_PATH is not None:
        d = Path(CUSTOM_EMBEDDINGS_PATH)
    else:
        d = Path(__file__).parent / "custom_embeddings"
    if not d.is_dir():
        return None
    return {p.stem: p for p in d.iterdir() if p.is_file() and p.name.endswith(".ce")}


def inject_custom_embeddings(params: Any) -> Any:
    def _core(p: Any) -> Any:
        if isinstance(p, list):
            return [_core(v) for v in p]
        if not isinstance(p, dict):
            return p
        p = shallow_copy_dict(p)
        for k, v in p.items():
            if k == "custom_embeddings":
                if v is None or not isinstance(v, dict):
                    continue
                for vk in v:
                    ce_path = ce_mapping.get(vk)
                    if ce_path is None or vk in custom_embeddings:
                        continue
                    with ce_path.open("r") as f:
                        custom_embeddings[vk] = json.load(f)
                p[k] = custom_embeddings
            elif isinstance(p, (list, dict)):
                p[k] = _core(v)
        return p

    custom_embeddings = {}
    ce_mapping = get_custom_embeddings_mapping()
    if ce_mapping is None:
        return params
    return _core(params)


def inject(
    self: IFieldsPlugin,
    data: ISocketRequest,
    data_model_type: Type[TDataModel],
    version_key: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> TDataModel:
    # seed
    if data.extraData["seed"] == -1:
        data.extraData["seed"] = new_seed()
    # version
    if version_key is not None:
        version_i18n_d = data.extraData[version_key]
        version = version_field.parse(version_i18n_d)
        data.extraData[version_key] = version
    # lora
    lora = data.extraData.pop("lora", [])
    lora_definition = lora_field.item
    lora_folder = Path(lora_definition["model"].path)
    lora_placeholder = lora_definition["model"].defaultPlaceholder
    if lora and lora_folder.is_dir():
        lora_paths = []
        lora_scales = {}
        for lora_item in lora:
            lora_name = lora_item["model"]
            if lora_name == lora_placeholder:
                continue
            for path in lora_folder.iterdir():
                if path.stem == lora_name:
                    lora_paths.append(str(path))
                    lora_scales[lora_name] = lora_item["strength"]
                    break
        if lora_paths:
            data.extraData["lora_paths"] = lora_paths
        if lora_scales:
            data.extraData["lora_scales"] = lora_scales
    # custom embeddings
    ce_mapping = get_custom_embeddings_mapping()
    if ce_mapping is not None:
        custom_embeddings = {}
        for key in text_keys:
            k_text = data.extraData.get(key)
            if k_text is None:
                continue
            for ce_name, ce_path in ce_mapping.items():
                if ce_name in k_text and ce_name not in custom_embeddings:
                    with ce_path.open("r") as f:
                        ce = json.load(f)
                    custom_embeddings[ce_name] = ce
        if custom_embeddings:
            data.extraData["custom_embeddings"] = custom_embeddings
    # collect
    kw = shallow_copy_dict(data.extraData)
    if extra is not None:
        kw.update(extra)
    data_model = data_model_type(**kw)
    # inject data model
    data_model_d = data_model.dict()
    data_model_d.pop("tome_info", None)
    data_model_d = trim_custom_embeddings(data_model_d)
    self.set_extra_response(DATA_MODEL_KEY, data_model_d)
    # return
    return data_model


async def call_api(self: IFieldsPlugin, fn: str, model: BaseModel, **kw: Any) -> Any:
    model_d = model.dict()
    self.set_extra_response(DATA_MODEL_KEY, model_d)
    return await getattr(get_apis(), fn)(model, **kw)


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
10. Image Harmonization.
11. ControlNet Hints.
12. Multi ControlNet.
13. And much more to come!
"""


# plugins


class Txt2Img(IFieldsPlugin):
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

        extra = {}
        if data.extraData.get("use_highres", False):
            extra["highres_info"] = HighresModel().dict()
        model = inject(self, data, Txt2ImgSDModel, "version", extra)
        return await get_apis().txt2img(model, step_callback=callback)


class Img2Img(IFieldsPlugin):
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
        self.set_injection("url", data.nodeData)
        extra = dict(url=url)
        if data.extraData.get("use_highres", False):
            extra["highres_info"] = HighresModel().dict()
        model = inject(self, data, Img2ImgSDModel, "version", extra)
        return await get_apis().img2img(model, step_callback=callback)


class SR(IFieldsPlugin):
    image_should_audit = False

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
        self.set_injection("url", data.nodeData)
        data_model = Img2ImgSRModel(url=data.nodeData.src, **data.extraData)
        return await call_api(self, "sr", data_model)


class SOD(IFieldsPlugin):
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
        self.set_injection("url", data.nodeData)
        data_model = Img2ImgSODModel(url=data.nodeData.src)
        return await call_api(self, "sod", data_model)


class Captioning(IFieldsPlugin):
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
        self.set_injection("url", data.nodeData)
        data_model = Img2TxtModel(url=data.nodeData.src)
        return await call_api(self, "image_captioning", data_model)


class Inpainting(IFieldsPlugin):
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

        url_node = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0]
        mask_node = self.filter(data.nodeDataList, SingleNodeType.PATH)[0]
        url = url_node.src
        mask_url = mask_node.src
        self.set_injection("url", url_node)
        self.set_injection("mask_url", mask_node)
        model = Img2ImgInpaintingModel(url=url, mask_url=mask_url, **data.extraData)
        if model.model == "sd":
            model.use_pipeline = True
        counter = 0.0
        if not model.use_pipeline:
            total_steps = model.num_steps
        else:
            total_steps = model.num_steps * (2.0 - model.refine_fidelity)
        return await call_api(self, "inpainting", model, step_callback=callback)


class SDInpainting(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=common_styles["w"],
            h=common_styles["h"] - 100,
            useModal=True,
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

        url_node = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0]
        mask_node = self.filter(data.nodeDataList, SingleNodeType.PATH)[0]
        url = url_node.src
        mask_url = mask_node.src
        self.set_injection("url", url_node)
        self.set_injection("mask_url", mask_node)
        focus_mode = data.extraData.get("focus_mode", False)
        inpainting_mode = InpaintingMode.MASKED if focus_mode else InpaintingMode.NORMAL
        extra = dict(url=url, mask_url=mask_url, inpainting_mode=inpainting_mode.value)
        model = inject(self, data, Txt2ImgSDInpaintingModel, extra=extra)
        return await get_apis().sd_inpainting(model, step_callback=callback)


class SDOutpainting(IFieldsPlugin):
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

        url_node = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0]
        url = url_node.src
        self.set_injection("url", url_node)
        model = inject(self, data, Txt2ImgSDOutpaintingModel, extra=dict(url=url))
        return await get_apis().sd_outpainting(model, step_callback=callback)


variation_targets = {
    Txt2ImgKey,
    Txt2ImgWithTextKey,
    Img2ImgKey,
    VariationKey,
    SDInpaintingKey,
    SDOutpaintingKey,
}


@register_node_validator("variation")
def validate_variation(data: ISocketRequest) -> bool:
    identifier = data.nodeData.identifier
    if identifier is None or identifier not in variation_targets:
        return False
    extra_responses = data.nodeData.extra_responses
    if extra_responses is None:
        return False
    return DATA_MODEL_KEY in extra_responses


class Variation(IFieldsPlugin):
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

    async def process(self, data: ISocketRequest) -> Optional[List[Image.Image]]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        task = data.nodeData.identifier
        extra = data.nodeData.extra_responses
        if task is None or extra is None:
            return None
        if task == VariationKey:
            task = extra["task"]
        data_model_d = extra[DATA_MODEL_KEY]
        # inject custom embeddings
        data_model_d = inject_custom_embeddings(data_model_d)
        # inject varations
        strength = 1.0 - data.extraData["fidelity"]
        variations = data_model_d.setdefault("variations", [])
        variations.append(dict(seed=new_seed(), strength=strength))
        # inject extra response
        copied_d = trim_custom_embeddings(data_model_d)
        self.set_extra_response("task", task)
        self.set_extra_response(DATA_MODEL_KEY, copied_d)
        # switch case
        if task == Txt2ImgKey or task == Txt2ImgWithTextKey:
            model = Txt2ImgSDModel(**data_model_d)
            return await get_apis().txt2img(model, step_callback=callback)
        if task == Img2ImgKey:
            model = Img2ImgSDModel(**data_model_d)
            return await get_apis().img2img(model, step_callback=callback)
        if task == SDInpaintingKey:
            model = Txt2ImgSDInpaintingModel(**data_model_d)
            return await get_apis().sd_inpainting(model, step_callback=callback)
        if task == SDOutpaintingKey:
            model = Txt2ImgSDOutpaintingModel(**data_model_d)
            return await get_apis().sd_outpainting(model, step_callback=callback)
        self.send_exception(f"unknown task: {task}")
        return None


class ControlHints(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=320,
            h=180,
            src=constants.CONTROLNET_HINT_ICON,
            tooltip=I18N(
                zh="生成 ControlNet 的参考图",
                en="Generate hint image for ControlNet",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="参考图生成",
                    en="Hint Generation",
                ),
                definitions=dict(hint_type=controlnet_hint_fields),
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        url = data.nodeData.src
        self.set_injection("url", data.nodeData)
        hint_type = controlnet_hint_fields.parse(data.extraData["hint_type"])
        data = dict(hint_type=hint_type, url=url)
        self.set_extra_response(DATA_MODEL_KEY, data)
        return await get_apis().get_control_hint(hint_type, data)


class MultiControlNet(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=800,
            h=640,
            useModal=True,
            keepOpen=True,
            src=constants.CONTROLNET_ICON,
            tooltip=I18N(
                zh="使用 (multi) ControlNet 生成图片",
                en="Generate image with (multi) ControlNet",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="ControlNet 生成",
                    en="ControlNet",
                ),
                numColumns=2,
                definitions=multi_controlnet_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        def parse_control(control: dict) -> dict:
            t = controlnet_hint_fields.parse(control.pop("type"))
            return dict(type=t, data=control)

        if not data.extraData["url"]:
            data.extraData.pop("url")
        controls = list(map(parse_control, data.extraData.pop("controls")))
        data.extraData["controls"] = controls
        model = inject(self, data, ControlMultiModel, "base_model")
        return await get_apis().run_multi_controlnet(model, step_callback=callback)


class ImageHarmonization(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=400,
            h=300,
            keepOpen=True,
            src=constants.HARMONIZATION_ICON,
            tooltip=I18N(
                zh="将前景区域与背景图进行风格一致化",
                en="Harmonize the foreground area with the background image",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="风格一致化",
                    en="Image Harmonization",
                ),
                definitions=harmonization_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        data_model = Img2ImgHarmonizationModel(**data.extraData)
        return await call_api(self, "harmonization", data_model)


class PromptEnhance(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=180,
            src=constants.PROMPT_ENHANCE_ICON,
            tooltip=I18N(
                zh="提示词增强",
                en="Prompt Enhancement",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="提示词增强",
                    en="Prompt Enhancement",
                ),
                definitions=prompt_enhance_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[str]:
        self.set_injection("text", data.nodeData)
        data_model = PromptEnhanceModel(text=data.nodeData.text, **data.extraData)
        return await call_api(self, "prompt_enhance", data_model)


class Txt2ImgWithText(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            **common_styles,
            src=constants.TEXT_TO_IMAGE_ICON,
            tooltip=I18N(
                zh="生成符合文本节点内容的图片",
                en="Text to Image",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="文本生成图片",
                    en="Text to Image",
                ),
                numColumns=2,
                definitions=txt2img_text_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        self.set_injection("text", data.nodeData)
        extra = dict(text=data.nodeData.text)
        if data.extraData.get("use_highres", False):
            extra["highres_info"] = HighresModel().dict()
        model = inject(self, data, Txt2ImgSDModel, "version", extra)
        return await get_apis().txt2img(model, step_callback=callback)


# workflow


@register_node_validator("draw_workflow")
def validate_draw_workflow(data: ISocketRequest) -> bool:
    identifier = data.nodeData.identifier
    if identifier is None or identifier not in key2endpoints:
        return False
    return True


class DrawWorkflow(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=240,
            h=110,
            src=constants.WORKFLOW_ICON,
            nodeConstraintValidator="draw_workflow",
            tooltip=I18N(
                zh="绘制工作流",
                en="Draw Workflow",
            ),
            pluginInfo=IFieldsPluginInfo(
                header=I18N(
                    zh="绘制工作流",
                    en="Draw Workflow",
                ),
                definitions={},
            ),
            no_offload=True,
        )

    async def process(self, data: ISocketRequest) -> Optional[List[Image.Image]]:
        workflow = trace_workflow(data.nodeData.meta, data.nodeData)
        if workflow.last is None:
            self.send_exception("Workflow is empty")
            return None
        self.set_workflow(workflow)
        return [workflow.render()]


class ExecuteWorkflow(IWorkflowPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=400,
            h=240,
            src=constants.EXECUTE_WORKFLOW_ICON,
            pivot=PivotType.BOTTOM,
            follow=True,
            nodeConstraintValidator=constants.WORKFLOW_KEY,
            tooltip=I18N(
                zh="执行工作流",
                en="Execute Workflow",
            ),
            pluginInfo=IWorkflowPluginInfo(
                header=I18N(
                    zh="工作流",
                    en="Workflow",
                ),
            ),
        )

    async def process(self, data: ISocketRequest) -> Optional[List[Image.Image]]:
        def callback(step: int, num_steps: int) -> bool:
            return self.send_progress(step / num_steps)

        kw = dict(step_callback=callback)
        workflow = data.nodeData.workflow
        if workflow is None:
            self.send_exception("No workflow found")
            return
        for node in workflow:
            node.data.data = inject_custom_embeddings(node.data.data)
        for k, v in data.extraData.items():
            if k.startswith(UPLOAD_META_TYPE):
                workflow.get(k).data.data["url"] = v
            elif k.startswith(ADD_TEXT_META_TYPE):
                workflow.get(k).data.data["text"] = v
        target_key = workflow.last.key
        results = await get_apis().execute(workflow, target_key, **kw)
        for k, v in results.items():
            if k == target_key or k == ALL_LATENCIES_KEY:
                continue
            if isinstance(v[0], str):
                self.set_extra_response(k, v)
        return results[target_key]


# groups


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
                    MultiControlNetKey: MultiControlNet,
                    ImageHarmonizationKey: ImageHarmonization,
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
                    ControlNetHintKey: ControlHints,
                    VariationKey: Variation,
                    DrawWorkflowKey: DrawWorkflow,
                },
            ),
        )


class ImageAndMaskFollowers(IPluginGroup):
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
                    en="Image & Mask Toolbox",
                ),
                header=I18N(
                    zh="蒙版工具箱",
                    en="Image & Mask Toolbox",
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


class TextFollowers(IPluginGroup):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=common_group_styles["w"],
            h=164,
            tooltip=I18N(
                zh="一组将 AI 技术应用于当前文字的插件",
                en="A set of plugins that apply AI techniques to the given text",
            ),
            nodeConstraint=NodeConstraints.TEXT,
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IPluginGroupInfo(
                name=I18N(
                    zh="文字工具箱",
                    en="Text Toolbox",
                ),
                header=I18N(
                    zh="文字工具箱",
                    en="Text Toolbox",
                ),
                plugins={
                    PromptEnhanceKey: PromptEnhance,
                    Txt2ImgWithTextKey: Txt2ImgWithText,
                    f"{DrawWorkflowKey}_1": DrawWorkflow,
                },
            ),
        )


# uncomment this line to pre-load the models
# get_apis()
register_plugin("static")(StaticPlugins)
register_plugin("image_followers")(ImageFollowers)
register_plugin("image_and_mask_followers")(ImageAndMaskFollowers)
register_plugin("canvas_followers")(CanvasFollowers)
register_plugin("text_followers")(TextFollowers)
register_plugin(ExecuteWorkflowKey)(ExecuteWorkflow)
app = App(notification)
