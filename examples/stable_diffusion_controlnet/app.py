import cv2

import numpy as np

from PIL import Image
from typing import List

from cfdraw import *


@cache_resource
def get_model():
    import torch
    from diffusers import ControlNetModel
    from diffusers import UniPCMultistepScheduler
    from diffusers import StableDiffusionControlNetPipeline

    tag = "runwayml/stable-diffusion-v1-5"
    c_tag = "lllyasviel/sd-controlnet-canny"
    m_kw = dict(
        controlnet=ControlNetModel.from_pretrained(c_tag, torch_dtype=torch.float16),
        torch_dtype=torch.float16,
    )
    m = StableDiffusionControlNetPipeline.from_pretrained(tag, **m_kw)
    m.scheduler = UniPCMultistepScheduler.from_config(m.scheduler.config)
    m.enable_model_cpu_offload()
    if torch.cuda.is_available():
        m.to("cuda")
    return m


# copying parameters from https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/inpaint#diffusers.StableDiffusionInpaintPipeline.__call__
inpainting_fields = dict(
    prompt=ITextField(),
    negative_prompt=ITextField(label="Negative Prompt"),
    height=INumberField(default=512, min=64, max=1024, step=64, isInt=True),
    width=INumberField(default=512, min=64, max=1024, step=64, isInt=True),
    num_inference_steps=INumberField(
        default=25, min=5, max=100, step=1, isInt=True, label="Steps"
    ),
    guidance_scale=INumberField(
        default=7.5, min=-20.0, max=25.0, step=0.5, precision=1, label="Cfg Scale"
    ),
    num_images_per_prompt=INumberField(
        default=1, min=1, max=4, step=1, isInt=True, label="Num images"
    ),
)


class CannyPlugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            nodeConstraint=NodeConstraints.IMAGE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/37a7936897494bd9ae96de5912210841.png",
            tooltip="Canny Detector",
            pivot=PivotType.RT,
            follow=True,
            offsetY=104,
            pluginInfo=IFieldsPluginInfo(definitions={}),
        )

    async def process(self, data: ISocketRequest) -> Image.Image:
        image = np.array(await self.load_image(data.nodeData.src))

        # Exercise: try to expose these two parameters to the `definitions`!
        low_threshold = 100
        high_threshold = 200

        image = cv2.Canny(image, low_threshold, high_threshold)
        image = np.repeat(image[:, :, None], 3, axis=2)
        return Image.fromarray(image)


class ControlNetPlugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=600,
            h=400,
            nodeConstraint=NodeConstraints.IMAGE,
            src=constants.CONTROLNET_ICON,
            tooltip="ControlNet with Canny Annotation",
            pivot=PivotType.RT,
            follow=True,
            useModal=True,
            pluginInfo=IFieldsPluginInfo(
                header="ControlNet",
                numColumns=2,
                definitions=inpainting_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        image = await self.load_image(data.nodeData.src)
        return get_model()(image=image, **data.extraData).images


# uncomment this line to pre-load the models
# get_model()
register_plugin("canny")(CannyPlugin)
register_plugin("controlnet")(ControlNetPlugin)
app = App()
