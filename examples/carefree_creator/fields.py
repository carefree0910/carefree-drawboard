from cfdraw import *
from collections import OrderedDict
from cfcreator.common import SDSamplers
from cflearn.api.cv.diffusion import SDVersions


# common styles
common_styles = dict(w=600, h=450, useModal=True)
common_group_styles = dict(w=230, h=110)
# common diffusion fields
diffusion_fields = list(
    OrderedDict(
        text=ITextField(
            label=I18N(
                zh="提示词",
                en="Prompt",
            ),
            numRows=2,
            tooltip=I18N(
                zh="想要生成的图片的描述",
                en="The description of the image",
            ),
        ),
        negative_prompt=ITextField(
            label=I18N(
                zh="负面词",
                en="Negative Prompt",
            ),
            numRows=2,
            tooltip=I18N(
                zh="不想图片中出现的东西的描述",
                en="The negative description of the image",
            ),
        ),
        version=ISelectField(
            default=SDVersions.v1_5,
            values=[version for version in SDVersions if version],
            label=I18N(
                zh="模型",
                en="Model",
            ),
        ),
        sampler=ISelectField(
            default=SDSamplers.K_EULER,
            values=[sampler for sampler in SDSamplers],
            label=I18N(
                zh="采样器",
                en="Sampler",
            ),
        ),
        num_steps=INumberField(
            default=20,
            min=5,
            max=100,
            step=1,
            isInt=True,
            label=I18N(
                zh="采样步数",
                en="Steps",
            ),
        ),
        guidance_scale=INumberField(
            default=7.5,
            min=-20.0,
            max=25.0,
            step=0.5,
            precision=1,
            label=I18N(
                zh="扣题程度",
                en="Cfg Scale",
            ),
        ),
        seed=INumberField(
            default=-1,
            min=-1,
            max=2**32,
            step=1,
            scale=NumberScale.LOGARITHMIC,
            isInt=True,
            label=I18N(
                zh="随机种子",
                en="Seed",
            ),
        ),
        use_circular=IBooleanField(
            default=False,
            label=I18N(
                zh="循环纹样",
                en="Circular",
            ),
            tooltip=I18N(
                zh="是否让模型尝试生成四方连续纹样",
                en="Whether should we generate circular patterns (i.e., generate textures).",
            ),
        ),
    ).items()
)
# txt2img / sd_inpainting / sd_outpainting fields
txt2img_fields = OrderedDict(
    w=INumberField(
        default=512,
        min=64,
        max=1024,
        step=64,
        isInt=True,
        label=I18N(
            zh="宽",
            en="Width",
        ),
        tooltip=I18N(
            zh="生成图片的宽度",
            en="The width of the generated image",
        ),
    ),
    h=INumberField(
        default=512,
        min=64,
        max=1024,
        step=64,
        isInt=True,
        label=I18N(
            zh="高",
            en="Height",
        ),
        tooltip=I18N(
            zh="生成图片的高度",
            en="The height of the generated image",
        ),
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
    label=I18N(
        zh="相似度",
        en="Fidelity",
    ),
    tooltip=I18N(
        zh="生成图片与当前图片的相似度",
        en="How similar the generated image should be to the input image",
    ),
)
for k, v in diffusion_fields[4:]:
    img2img_fields[k] = v
# super resolution fields
sr_fields = OrderedDict(
    is_anime=IBooleanField(
        default=False,
        label=I18N(
            zh="动漫模型",
            en="Use Anime Model",
        ),
        tooltip=I18N(
            zh="是否使用在动漫图片上微调过的超分辨率模型",
            en="Whether should we use the super resolution model which is finetuned on anime images.",
        ),
    ),
)
# inpainting fields
inpainting_fields = OrderedDict(
    model=ISelectField(
        default="lama",
        values=["sd", "lama"],
        label=I18N(
            zh="模型",
            en="Model",
        ),
        tooltip=I18N(
            zh="用来进行局部擦除的模型；`lama` 会更快、更稳定，`sd` 会比较慢，但有时会提供更多的细节",
            en=(
                "The inpainting model to use. "
                "`lama` is faster and more stable, but `sd` may introduce more details."
            ),
        ),
    ),
)
# variation fields
variation_fields = OrderedDict(fidelity=img2img_fields["fidelity"])


__all__ = [
    "common_styles",
    "common_group_styles",
    "txt2img_fields",
    "img2img_fields",
    "sr_fields",
    "inpainting_fields",
    "variation_fields",
]
