import json

from cfdraw.schema.plugins import *
from cfdraw.plugins.base import *
from cfdraw.plugins.factory import PluginFactory


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

    def process(self, data: IHttpPluginRequest) -> str:
        return json.dumps(data.nodeMeta, indent=4)


__all__ = [
    "HttpMetaPlugin",
]
