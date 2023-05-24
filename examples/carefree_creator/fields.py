from cfdraw import *
from typing import Optional
from pathlib import Path
from collections import OrderedDict
from cfcreator.common import SDSamplers
from cflearn.api.cv.diffusion import SDVersions


# common styles
common_styles = dict(w=600, h=510, useModal=True)
common_group_styles = dict(w=230, h=110)
# common diffusion fields
w_field = INumberField(
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
)
h_field = INumberField(
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
)
text = ITextField(
    label=I18N(
        zh="提示词",
        en="Prompt",
    ),
    numRows=2,
    tooltip=I18N(
        zh="想要生成的图片的描述",
        en="The description of the image",
    ),
)
## sd version stuffs
version_dict = {
    SDVersions.v1_5: I18N(zh="基础模型", en="Base Model"),
    SDVersions.ANIME_ANYTHING: I18N(zh="动漫模型", en="Anime Model"),
    SDVersions.DREAMLIKE: I18N(zh="艺术模型", en="Art Model"),
}
version = ISelectField(
    default=version_dict[SDVersions.v1_5],
    options=list(version_dict.values()),
    label=I18N(
        zh="模型",
        en="Model",
    ),
)


def get_version_from(i18n_d: dict) -> Optional[SDVersions]:
    i18n = I18N(**i18n_d)
    for version, v_i18n in version_dict.items():
        if i18n.en == v_i18n.en:
            return version
    return None


sampler = ISelectField(
    default=SDSamplers.K_EULER,
    options=[sampler for sampler in SDSamplers],
    label=I18N(
        zh="采样器",
        en="Sampler",
    ),
)
num_steps = INumberField(
    default=20,
    min=5,
    max=100,
    step=1,
    isInt=True,
    label=I18N(
        zh="采样步数",
        en="Steps",
    ),
)
negative_prompt = ITextField(
    label=I18N(
        zh="负面词",
        en="Negative Prompt",
    ),
    numRows=2,
    tooltip=I18N(
        zh="不想图片中出现的东西的描述",
        en="The negative description of the image",
    ),
)
guidance_scale = INumberField(
    default=7.5,
    min=-20.0,
    max=25.0,
    step=0.5,
    precision=1,
    label=I18N(
        zh="扣题程度",
        en="Cfg Scale",
    ),
)
seed = INumberField(
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
    tooltip=I18N(
        zh="'-1' 表示种子将会被随机生成",
        en="'-1' means the seed will be randomly generated",
    ),
)
use_circular = IBooleanField(
    default=False,
    label=I18N(
        zh="循环纹样",
        en="Circular",
    ),
    tooltip=I18N(
        zh="是否让模型尝试生成四方连续纹样",
        en="Whether should we generate circular patterns (i.e., generate textures)",
    ),
)
use_highres = IBooleanField(
    default=False,
    label=I18N(
        zh="高清生成",
        en="Highres",
    ),
    tooltip=I18N(
        zh="生成 2 倍宽高的图片",
        en="Generate images with 2x width & height",
    ),
)
lora_field = IListField(
    label="LoRA",
    tooltip=I18N(zh="配置 LoRA 模型", en="Setup LoRA models"),
    item=dict(
        model=ISelectLocalField(
            label=I18N(
                zh="模型",
                en="Model",
            ),
            path=str(Path(__file__).parent / "lora"),
            noExt=True,
            onlyFiles=True,
            regex=".*\\.safetensors",
            defaultPlaceholder="None",
        ),
        strength=INumberField(
            default=1.0,
            min=0.0,
            max=4.0,
            step=0.1,
            precision=1,
            label=I18N(
                zh="强度",
                en="Strength",
            ),
        ),
    ),
)
# txt2img
txt2img_fields = OrderedDict(
    w=w_field,
    h=h_field,
    text=text,
    version=version,
    sampler=sampler,
    negative_prompt=negative_prompt,
    num_steps=num_steps,
    guidance_scale=guidance_scale,
    use_circular=use_circular,
    use_highres=use_highres,
    seed=seed,
    lora=lora_field,
)
# sd_inpainting / sd_outpainting fields
sd_inpainting_fields = OrderedDict(
    text=text,
    sampler=sampler,
    num_steps=num_steps,
    guidance_scale=guidance_scale,
    negative_prompt=negative_prompt,
    seed=seed,
    use_circular=use_circular,
)
# img2img fields
fidelity = INumberField(
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
img2img_prompt = text.copy()
img2img_prompt.numRows = 3
img2img_fields = OrderedDict(
    text=img2img_prompt,
    fidelity=fidelity,
    version=version,
    sampler=sampler,
    negative_prompt=negative_prompt,
    num_steps=num_steps,
    guidance_scale=guidance_scale,
    use_circular=use_circular,
    use_highres=use_highres,
    seed=seed,
    lora=lora_field,
)
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
        options=["sd", "lama"],
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
    "get_version_from",
    "common_styles",
    "common_group_styles",
    "lora_field",
    "txt2img_fields",
    "img2img_fields",
    "sr_fields",
    "inpainting_fields",
    "sd_inpainting_fields",
    "variation_fields",
]
