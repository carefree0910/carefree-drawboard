import json

from cfdraw.schema.plugins import *
from cfdraw.plugins.base import *
from cfdraw.plugins.factory import PluginFactory


@PluginFactory.record("meta")
class HttpMetaPlugin(IHttpPlugin[HttpTextAreaResponse]):
    @property
    def type(self) -> PluginType:
        return PluginType.HTTP_TEXT_AREA

    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=400,
            h=400,
            p="10px",
            nodeConstraint=NodeConstraints.SINGLE_NODE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/0ec1b08f9c3e4ef4813ecb80bebf3b42.png",
            pivot=PivotType.RT,
            follow=True,
            iconW=42,
            iconH=42,
            offsetY=-42,
            expandOffsetY=-400,
        )

    def process(self, data: IHttpPluginRequest) -> str:
        meta = data.node.params["meta"]
        return json.dumps(meta, indent=4)


__all__ = [
    "HttpMetaPlugin",
]
