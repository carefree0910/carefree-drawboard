from cfdraw import *
from collections import OrderedDict
from cfcreator.common import SDSamplers
from cflearn.api.cv.diffusion import SDVersions


# common styles
common_styles = dict(w=600, h=450, useModal=True)
common_group_styles = dict(w=240, h=110)
# common diffusion fields
diffusion_fields = list(
    OrderedDict(
        text=ITextField(
            label="Prompt",
            numRows=2,
            tooltip="The description of the image",
        ),
        negative_prompt=ITextField(
            label="Negative Prompt",
            numRows=2,
            tooltip="The negative description of the image",
        ),
        version=ISelectField(
            default=SDVersions.v1_5,
            values=[version for version in SDVersions if version],
            label="Model",
        ),
        sampler=ISelectField(
            default=SDSamplers.K_EULER,
            values=[sampler for sampler in SDSamplers],
            label="Sampler",
        ),
        num_steps=INumberField(
            default=20,
            min=5,
            max=100,
            step=1,
            isInt=True,
            label="Steps",
        ),
        guidance_scale=INumberField(
            default=7.5,
            min=-20.0,
            max=25.0,
            step=0.5,
            precision=1,
            label="Cfg Scale",
        ),
        seed=INumberField(
            default=-1,
            min=-1,
            max=2**32,
            step=1,
            scale=NumberScale.LOGARITHMIC,
            isInt=True,
            label="Seed",
        ),
        use_circular=IBooleanField(
            default=False,
            label="Circular",
            tooltip="Whether should we generate circular patterns (i.e., generate textures).",
        ),
    ).items()
)
# txt2img / txt2img.sd.inpainting fields
txt2img_fields = OrderedDict(
    w=INumberField(
        default=512,
        min=64,
        max=1024,
        step=64,
        isInt=True,
        label="Width",
        tooltip="The width of the generated image",
    ),
    h=INumberField(
        default=512,
        min=64,
        max=1024,
        step=64,
        isInt=True,
        label="Height",
        tooltip="The height of the generated image",
    ),
)
for k, v in diffusion_fields:
    txt2img_fields[k] = v
# img2img fields
img2img_fields = OrderedDict()
for k, v in diffusion_fields[:4]:
    img2img_fields[k] = v
img2img_fields["fidelity"] = INumberField(
    default=0.2,
    min=0.0,
    max=1.0,
    step=0.05,
    label="Fidelity",
    tooltip="How similar the generated image should be to the input image",
)
for k, v in diffusion_fields[4:]:
    img2img_fields[k] = v
# super resolution fields
sr_fields = OrderedDict(
    is_anime=IBooleanField(
        default=False,
        label="Use Anime Model",
        tooltip="Whether should we use the super resolution model which is finetuned on anime images.",
    ),
)
# inpainting fields
inpainting_fields = OrderedDict(
    model=ISelectField(
        default="lama",
        values=["sd", "lama"],
        label="Model",
        tooltip=(
            "The inpainting model to use. "
            "`lama` is faster and more stable, but `sd` may introduce more details."
        ),
    ),
)


__all__ = [
    "common_styles",
    "common_group_styles",
    "txt2img_fields",
    "img2img_fields",
    "sr_fields",
    "inpainting_fields",
]
