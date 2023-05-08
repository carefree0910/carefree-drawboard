import numpy as np

from PIL import Image
from typing import List

from cfdraw import *


@cache_resource
def get_model():
    import torch
    from diffusers import StableDiffusionInpaintPipeline

    tag = "runwayml/stable-diffusion-inpainting"
    m = StableDiffusionInpaintPipeline.from_pretrained(tag, torch_dtype=torch.float16)
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


class InpaintingPlugin(IFieldsPlugin):
    requirements = ["transformers>=4.26.1", "diffusers[torch]>=0.14.0"]

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=600,
            h=400,
            offsetX=-48,
            nodeConstraintRules=NodeConstraintRules(
                exactly=[NodeConstraints.IMAGE, NodeConstraints.PATH]
            ),
            src=constants.SD_INPAINTING_ICON,
            tooltip="Stable Diffusion Inpainting",
            pivot=PivotType.RT,
            follow=True,
            useModal=True,
            pluginInfo=IFieldsPluginInfo(
                header="Inpainting",
                numColumns=2,
                definitions=inpainting_fields,
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        path_data = self.filter(data.nodeDataList, SingleNodeType.PATH)[0]
        image_data = self.filter(data.nodeDataList, SingleNodeType.IMAGE)[0]
        mask = await self.load_image(path_data.src)
        mask_array = np.array(mask)[..., -1]
        mask_array = np.where(mask_array > 0, 255, 0)
        mask_image = Image.fromarray(mask_array)
        image = await self.load_image(image_data.src)
        return get_model()(image=image, mask_image=mask_image, **data.extraData).images


# uncomment this line to pre-load the models
# get_model()
register_plugin("inpainting")(InpaintingPlugin)
app = App()
