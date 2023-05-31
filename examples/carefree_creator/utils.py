from cfdraw import cache_resource
from cfcreator.endpoints import *
from cfcreator.sdks.apis import *


DATA_MODEL_KEY = "$data_model"

Txt2ImgKey = "txt2img"
Img2ImgKey = "img2img"
SRKey = "sr"
SODKey = "sod"
CaptioningKey = "captioning"
InpaintingKey = "inpainting"
SDInpaintingKey = "sd_inpainting"
SDOutpaintingKey = "sd_outpainting"
VariationKey = "variation"
ControlNetHintKey = "control_net_hint"
MultiControlNetKey = "multi_control_net"
ImageHarmonizationKey = "image_harmonization"


@cache_resource
def get_apis() -> APIs:
    return APIs()


__all__ = [
    "DATA_MODEL_KEY",
    "Txt2ImgKey",
    "Img2ImgKey",
    "SRKey",
    "SODKey",
    "CaptioningKey",
    "InpaintingKey",
    "SDInpaintingKey",
    "SDOutpaintingKey",
    "VariationKey",
    "ControlNetHintKey",
    "MultiControlNetKey",
    "ImageHarmonizationKey",
    "get_apis",
    "HighresModel",
    "Img2TxtModel",
    "Txt2ImgSDModel",
    "Img2ImgSDModel",
    "Img2ImgSRModel",
    "Img2ImgSODModel",
    "Img2ImgInpaintingModel",
    "Txt2ImgSDInpaintingModel",
    "Txt2ImgSDOutpaintingModel",
    "ControlNetHints",
    "ControlMultiModel",
    "Img2ImgHarmonizationModel",
]
