import json

from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from pydantic import BaseModel

from cfdraw.schema.plugins import *
from cfdraw.plugins.base import *
from cfdraw.parsers.noli import PivotType
from cfdraw.parsers.noli import NodeConstraints
from cfdraw.plugins.factory import PluginFactory


class IMeta(BaseModel):
    type: str
    data: Dict[str, Any]

    @property
    def src(self) -> Optional["IMeta"]:
        src = self.data.get("from")
        if src is None:
            return None
        return IMeta(**src)

    @property
    def trace(self) -> List["IMeta"]:
        src = self.src
        if src is None:
            return [self]
        return [self] + src.trace

    @property
    def origin(self) -> "IMeta":
        src = self.src
        if src is None:
            return self
        return src.origin

    @property
    def represenation(self) -> str:
        if self.type == f"python.{PluginType.HTTP_FIELDS}":
            return self.data.get("identifier", "unknown")
        if self.type == f"python.{PluginType.SOCKET_FIELDS}":
            return f"{self.data.get('identifier', 'unknown')} (socket)"
        return self.type


@PluginFactory.record("meta")
class HttpMetaPlugin(IHttpTextAreaPlugin):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=400,
            h=400,
            nodeConstraint=NodeConstraints.SINGLE_NODE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/0ec1b08f9c3e4ef4813ecb80bebf3b42.png",
            pivot=PivotType.RT,
            follow=True,
            offsetY=48,
        )

    async def process(self, data: IPluginRequest) -> str:
        raw_meta = data.nodeData.meta
        if raw_meta is None:
            return "No meta found"
        meta = IMeta(**raw_meta)
        return f"""{" -> ".join([m.represenation for m in meta.trace[::-1]])}

{json.dumps(raw_meta, indent=4)}        
"""


__all__ = [
    "HttpMetaPlugin",
]
