import json

from cfdraw.schema.plugins import *


class HttpMetaPlugin(IHttpPlugin[HttpTextAreaResponse]):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=400,
            h=400,
            p="10px",
            type=PluginType.HTTP_TEXT_AREA,
            nodeConstraint=NodeConstraints.SINGLE_NODE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/0ec1b08f9c3e4ef4813ecb80bebf3b42.png",
            pivot=PivotType.RT,
            follow=True,
            iconW=42,
            iconH=42,
            offsetY=-42,
            expandOffsetY=-400,
        )

    def process(self, data: IHttpPluginRequest) -> HttpTextAreaResponse:
        meta = data.node.params["meta"]
        meta_json = json.dumps(meta, indent=4)
        return HttpTextAreaResponse(
            success=True,
            message="",
            data=HttpTextAreaModel(text=meta_json),
        )


__all__ = [
    "HttpMetaPlugin",
]
