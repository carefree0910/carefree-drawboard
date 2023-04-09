import json

from cfdraw import *


class MetaPlugin(IHttpPlugin[TextAreaResponse]):
    @property
    def settings(self) -> IPluginSettings:
        return IPluginSettings(
            w=400,
            h=400,
            p="10px",
            type=PluginType.TEXT_AREA,
            nodeConstraint=NodeConstraints.SINGLE_NODE,
            src="https://ailab-huawei-cdn.nolibox.com/upload/images/0ec1b08f9c3e4ef4813ecb80bebf3b42.png",
            pivot=PivotType.RT,
            follow=True,
            iconW=42,
            iconH=42,
            offsetY=-42,
            expandOffsetY=-400,
        )

    def process(self, data: IParsedHttpPluginRequest) -> TextAreaResponse:
        meta = data.node.params["meta"]
        meta_json = json.dumps(meta, indent=4)
        return TextAreaResponse(
            success=True,
            message="",
            data=TextAreaModel(text=meta_json),
        )


__all__ = [
    "MetaPlugin",
]
