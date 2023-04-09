from abc import abstractmethod
from abc import ABC
from abc import ABCMeta
from enum import Enum
from typing import Any
from typing import Dict
from typing import Generic
from typing import TypeVar
from typing import Optional
from typing import NamedTuple
from pydantic import Field
from pydantic import BaseModel

from cfdraw.parsers import utils
from cfdraw.parsers.noli import parse_node
from cfdraw.parsers.noli import INode
from cfdraw.parsers.noli import PivotType
from cfdraw.parsers.noli import NodeConstraints
from cfdraw.parsers.chakra import IChakra
from cfdraw.parsers.chakra import TextAlign


TPluginModel = TypeVar("TPluginModel")
THttpResponse = TypeVar("THttpResponse", bound="IHttpResponse", covariant=True)


class PluginType(str, Enum):
    HTTP_TEXT_AREA = "httpTextArea"


# general


class DefaultPluginSettings(NamedTuple):
    iconW: int
    iconH: int
    pivot: PivotType
    follow: bool
    bgOpacity: float
    modalOpacity: float
    offsetX: int
    offsetY: int
    expandOffsetX: int
    expandOffsetY: int


_plugin_settings_pivot = "export const DEFAULT_PLUGIN_SETTINGS = "
_plugin_settings = utils.parse_dict_from_ts_constants(_plugin_settings_pivot)
DEFAULT_PLUGIN_SETTINGS = DefaultPluginSettings(**_plugin_settings)


class IPluginInfo(BaseModel):
    """The actual data used in `usePython` hook & each React component."""

    updateInterval: int = Field(
        0,
        ge=0,
        description="If > 0, the plugin will be called every `updateInterval` ms",
    )


class IPluginSettings(IChakra):
    # required fields
    w: int = Field(..., gt=0, description="Width of the expanded plugin")
    h: int = Field(..., gt=0, description="Height of the expanded plugin")
    type: "PluginType" = Field(..., description="Type of the plugin")
    nodeConstraint: NodeConstraints = Field(
        ...,
        description="""
Spcify when the plugin will be shown.
> If set to 'none', the plugin will always be shown.
> If set to 'anyNode', the plugin will be shown when any node is selected.
> If set to 'singleNode', the plugin will be shown when only one node is selected.
> If set to 'multiNode', the plugin will be shown when more than one node is selected.
> Otherwise, the plugin will be shown when the selected node is of the specified type.
""",
    )
    # style fields
    src: str = Field(
        "",
        description="""
The image url that will be shown for the plugin.
> If not specified, we will use a default plugin-ish image.
""",
    )
    pivot: PivotType = Field(
        DEFAULT_PLUGIN_SETTINGS.pivot,
        description="""
Pivot of the plugin.
> If `follow` is set to `true`, the plugin will be shown at the pivot of the selected node.
> Otherwise, the plugin will be shown at the pivot of the entire drawboard.
""",
    )
    follow: bool = Field(
        DEFAULT_PLUGIN_SETTINGS.follow,
        description="Whether the plugin follows the node",
    )
    expandOffsetX: int = Field(
        DEFAULT_PLUGIN_SETTINGS.expandOffsetX,
        description="X offset of the expanded plugin",
    )
    expandOffsetY: int = Field(
        DEFAULT_PLUGIN_SETTINGS.expandOffsetY,
        description="Y offset of the expanded plugin",
    )
    iconW: int = Field(
        DEFAULT_PLUGIN_SETTINGS.iconW,
        description="Width of the plugin button",
    )
    iconH: int = Field(
        DEFAULT_PLUGIN_SETTINGS.iconH,
        description="Height of the plugin button",
    )
    offsetX: int = Field(
        DEFAULT_PLUGIN_SETTINGS.offsetX,
        description="X offset of the plugin button",
    )
    offsetY: int = Field(
        DEFAULT_PLUGIN_SETTINGS.offsetY,
        description="Y offset of the plugin button",
    )
    bgOpacity: float = Field(
        DEFAULT_PLUGIN_SETTINGS.bgOpacity,
        description="Opacity of the plugin button",
    )
    useModal: bool = Field(False, description="Whether popup a modal for the plugin")
    modalOpacity: float = Field(
        DEFAULT_PLUGIN_SETTINGS.modalOpacity,
        description="Opacity of the modal panel",
    )
    # React fields
    pluginInfo: IPluginInfo = Field(IPluginInfo(), description="Plugin info")

    def to_plugin_settings(self, identifier: str) -> Dict[str, Any]:
        d = self.dict()
        plugin_info = d.pop("pluginInfo")
        # `identifier` has hashed into `{identifier}.{hash}`
        plugin_info["endpoint"] = f"/{'.'.join(identifier.split('.')[:-1])}"
        plugin_info["identifier"] = identifier
        plugin_type = f"_python.{d.pop('type')}"
        offset_x = d.pop("offsetX")
        offset_y = d.pop("offsetY")
        node_constraint = d.pop("nodeConstraint")
        chakra_props = {}
        for field in IChakra.__fields__:
            chakra_value = d.pop(field)
            if chakra_value is not None:
                chakra_props[field] = chakra_value
        return dict(
            type=plugin_type,
            props=dict(
                offsetX=offset_x,
                offsetY=offset_y,
                nodeConstraint=node_constraint,
                pluginInfo=plugin_info,
                renderInfo=d,
                **chakra_props,
            ),
        )


# web

## http


class IRawHttpPluginRequest(BaseModel):
    identifier: str = Field(..., description="The identifier of the plugin")
    node: Optional[Dict[str, Any]] = Field(
        None,
        description="JSON data of the selected node",
    )

    def parse(self) -> "IHttpPluginRequest":
        if self.node is None:
            return self
        d = self.dict()
        d["node"] = parse_node(self.node)
        return IHttpPluginRequest(**d)


class IHttpPluginRequest(IRawHttpPluginRequest):
    node: Optional[INode] = Field(None, description="The parsed selected node")


class IHttpResponse(BaseModel):
    success: bool = Field(..., description="Whether returned successfully")
    message: str = Field(..., description="The message of the response")
    data: BaseModel = Field(..., description="The data of the response")


# interface


class IPlugin(ABC):
    identifier: str

    @property
    @abstractmethod
    def settings(self) -> IPluginSettings:
        pass

    @abstractmethod
    def __call__(self, data: Any) -> Any:
        pass


class IHttpPlugin(Generic[THttpResponse], IPlugin, metaclass=ABCMeta):
    @abstractmethod
    def process(self, data: IHttpPluginRequest) -> THttpResponse:
        pass

    def __call__(self, data: IRawHttpPluginRequest) -> THttpResponse:
        return self.process(data.parse())


class ISocketPlugin(IPlugin):
    pass


# (react) bindings

## text area


class ITextAreaPluginInfo(IPluginInfo):
    noLoading: bool = Field(
        False, description="Whether to show the 'Loading...' text or not"
    )
    textAlign: Optional[TextAlign] = Field(None, description="Text align")


class TextAreaModel(BaseModel):
    text: str = Field(..., description="The text to be displayed")


class TextAreaResponse(IHttpResponse):
    data: TextAreaModel = Field(..., description="The data of the response")


__all__ = [
    # noli
    "PivotType",
    "NodeConstraints",
    # chakra
    "TextAlign",
    # plugins
    "IRawHttpPluginRequest",
    "IHttpPluginRequest",
    "IHttpResponse",
    "PluginType",
    "IPluginSettings",
    "IPlugin",
    "IHttpPlugin",
    "ITextAreaPluginInfo",
    "TextAreaModel",
    "TextAreaResponse",
]
