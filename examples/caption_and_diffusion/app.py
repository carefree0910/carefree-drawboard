from PIL import Image
from typing import List

from cfdraw import *


@cache_resource
def get_models():
    import torch
    from diffusers import StableDiffusionPipeline
    from transformers import pipeline

    sd_tag = "runwayml/stable-diffusion-v1-5"
    caption_model = "ydshieh/vit-gpt2-coco-en"
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    txt2img = StableDiffusionPipeline.from_pretrained(sd_tag, torch_dtype=torch.float16)
    captioner = pipeline("image-to-text", model=caption_model, device=device)
    txt2img.to(device)
    return txt2img, captioner


# copying parameters from https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/text2img#diffusers.StableDiffusionPipeline.__call__
txt2img_fields = dict(
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


class TextToImagePlugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=600,
            h=400,
            nodeConstraint=NodeConstraints.TEXT,
            src=constants.TEXT_TO_IMAGE_ICON,
            tooltip="Text to Image",
            pivot=PivotType.RT,
            follow=True,
            # Since there are quite a few parameters, we use Modal to display them
            useModal=True,
            pluginInfo=IFieldsPluginInfo(
                header="Text to Image",
                numColumns=2,
                definitions=txt2img_fields,
                toastMessageOnSubmit="Generating images using the `diffusers` 🤗 library...",
            ),
        )

    async def process(self, data: ISocketRequest) -> List[Image.Image]:
        prompt = data.nodeData.text
        return get_models()[0](prompt=prompt, **data.extraData).images


class ImageCaptioningPlugin(IFieldsPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=200,
            h=110,
            nodeConstraint=NodeConstraints.IMAGE,
            src=constants.IMAGE_TO_TEXT_ICON,
            tooltip="Image Captioning",
            pivot=PivotType.RT,
            follow=True,
            pluginInfo=IFieldsPluginInfo(header="Image Captioning", definitions={}),
        )

    async def process(self, data: ISocketRequest) -> List[str]:
        responses = get_models()[1](await self.load_image(data.nodeData.src))
        return [res["generated_text"] for res in responses]


# uncomment this line to pre-load the models
# get_models()
register_plugin("txt2img")(TextToImagePlugin)
register_plugin("captioning")(ImageCaptioningPlugin)
app = App()
