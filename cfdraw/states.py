import time
import asyncio

import pynecone as pc

from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from cftool.misc import shallow_copy_dict
from cfcreator.common import SDSamplers
from cfcreator.common import SDVersions
from cfcreator.common import VariationModel
from cfcreator.sdks.kafka import push_sync
from cfcreator.sdks.kafka import poll_sync
from cfcreator.endpoints import *


class State(pc.State):
    # selecting
    # meta
    w: int = 512
    h: int = 512
    prompt: str = ""
    negative_prompt: str = ""
    version: SDVersions = SDVersions.v1_5
    sampler: SDSamplers = SDSamplers.K_EULER
    num_steps: int = 20
    guidance_scale: float = 7.0
    seed: int = -1
    use_circular: bool = False
    max_wh: int = 1024
    clip_skip: int = -1
    variations: List[VariationModel] = []
    # ui
    uid: Optional[str] = None
    host: str = "https://creator-huawei-private.nolibox.com"
    busy: bool = False
    result_url: str = ""

    @pc.var
    def meta_json(self) -> Dict[str, Any]:
        return shallow_copy_dict(
            dict(
                w=self.w,
                h=self.h,
                prompt=self.prompt,
                negative_prompt=self.negative_prompt,
                version=self.version,
                sampler=self.sampler,
                num_steps=self.num_steps,
                guidance_scale=self.guidance_scale,
                seed=self.seed,
                use_circular=self.use_circular,
                max_wh=self.max_wh,
                clip_skip=self.clip_skip,
                variations=self.variations,
            )
        )

    @pc.var
    def txt2img_data(self) -> Dict[str, Any]:
        d = self.meta_json
        d["text"] = d.pop("prompt")
        return d

    def init_task(self) -> None:
        self.busy = True

    def submit_txt2img(self) -> None:
        time.sleep(0.1)
        data = self.txt2img_data
        self.uid = push_sync(self.host, txt2img_sd_endpoint, data)
        time.sleep(0.1)
        self.result_url = poll_sync(self.host, self.uid)["data"]["cdn"]
        self.busy = False


__all__ = [
    "State",
]
