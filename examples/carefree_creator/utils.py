from cfdraw import cache_resource
from cfcreator.endpoints import *
from cfcreator.sdks.apis import *


@cache_resource
def get_apis() -> APIs:
    return APIs()


__all__ = [
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
]
