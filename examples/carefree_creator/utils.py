from cfcreator import *
from cfclient.models import *
from PIL import Image
from typing import Dict
from typing import List
from pydantic import BaseModel
from cfclient.core import HttpClient
from cfclient.utils import run_algorithm


class APIs:
    algorithms: Dict[str, IAlgorithm]

    def __init__(self) -> None:
        OPT["verbose"] = False
        OPT["lazy_load"] = True

        http_client = HttpClient()
        clients = dict(http=http_client, triton=None)
        self.algorithms = {k: v(clients) for k, v in algorithms.items()}
        http_client.start()
        for v in self.algorithms.values():
            v.initialize()

    async def _run(self, data: BaseModel, task: str) -> List[Image.Image]:
        if isinstance(data, ReturnArraysModel):
            data.return_arrays = True
        arrays = await run_algorithm(self.algorithms[task], data)
        return list(map(Image.fromarray, arrays))

    async def txt2img(self, data: Txt2ImgSDModel) -> List[Image.Image]:
        return await self._run(data, "txt2img.sd")

    async def img2img(self, data: Img2ImgSDModel) -> List[Image.Image]:
        return await self._run(data, "img2img.sd")

    async def sr(self, data: Img2ImgSRModel) -> List[Image.Image]:
        return await self._run(data, "img2img.sr")

    async def sod(self, data: Img2ImgSODModel) -> List[Image.Image]:
        return await self._run(data, "img2img.sod")

    async def inpainting(self, data: Img2ImgInpaintingModel) -> List[Image.Image]:
        if data.model == "sd":
            data.use_pipeline = True
        return await self._run(data, "img2img.inpainting")

    async def sd_inpainting(self, data: Txt2ImgSDInpaintingModel) -> List[Image.Image]:
        return await self._run(data, "txt2img.sd.inpainting")


__all__ = [
    "APIs",
    "Txt2ImgSDModel",
    "Img2ImgSDModel",
    "Img2ImgSRModel",
    "Img2ImgSODModel",
    "Img2ImgInpaintingModel",
    "Txt2ImgSDInpaintingModel",
]