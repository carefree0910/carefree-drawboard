import requests

from io import BytesIO
from abc import abstractmethod
from abc import ABC
from PIL import Image
from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import TypeVar
from typing import Optional
from pydantic import Field
from pydantic import BaseModel

from cfdraw.schema.fields import IFieldDefinition
from cfdraw.parsers.noli import parse_node
from cfdraw.parsers.noli import INode
from cfdraw.parsers.noli import Matrix2D
from cfdraw.parsers.noli import PivotType
from cfdraw.parsers.noli import NodeConstraints
from cfdraw.parsers.chakra import IChakra
from cfdraw.parsers.chakra import TextAlign


TPluginModel = TypeVar("TPluginModel")


class PluginType(str, Enum):
    HTTP_TEXT_AREA = "httpTextArea"
    HTTP_QA = "httpQA"
    HTTP_FIELDS = "httpFields"


# general


class IPluginInfo(BaseModel):
    """The common data used in `usePython` hook & each React component."""

    updateInterval: int = Field(
        0,
        ge=0,
        description="If > 0, the plugin will be called every `updateInterval` ms",
    )
    closeOnSubmit: Optional[bool] = Field(
        None,
        description="Whether close the expanded panel when the submit button is clicked",
    )
    toastOnSubmit: Optional[bool] = Field(
        None,
        description="Whether trigger a toast message when the submit button is clicked",
    )
    submitToastMessage: Optional[str] = Field(
        None,
        description="The message of the toast, only take effect when `toastOnSubmit` is `True`",
    )


class IPluginSettings(IChakra):
    # required fields
    w: int = Field(..., gt=0, description="Width of the expanded plugin")
    h: int = Field(..., gt=0, description="Height of the expanded plugin")
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
    pivot: Optional[PivotType] = Field(
        None,
        description="""
Pivot of the plugin.
> If `follow` is set to `true`, the plugin will be shown at the pivot of the selected node.
> Otherwise, the plugin will be shown at the pivot of the entire drawboard.
""",
    )
    follow: Optional[bool] = Field(
        None,
        description="Whether the plugin follows the node",
    )
    expandOffsetX: Optional[int] = Field(
        None,
        description="X offset of the expanded plugin",
    )
    expandOffsetY: Optional[int] = Field(
        None,
        description="Y offset of the expanded plugin",
    )
    iconW: Optional[int] = Field(None, description="Width of the plugin button")
    iconH: Optional[int] = Field(None, description="Height of the plugin button")
    offsetX: Optional[int] = Field(None, description="X offset of the plugin button")
    offsetY: Optional[int] = Field(None, description="Y offset of the plugin button")
    bgOpacity: Optional[float] = Field(None, description="Opacity of the plugin button")
    useModal: bool = Field(False, description="Whether popup a modal for the plugin")
    modalOpacity: Optional[float] = Field(None, description="Opacity of the modal")
    expandProps: Optional[IChakra] = Field(
        None,
        description="Extra (chakra) props of the plugin's expanded panel",
    )
    # React fields
    pluginInfo: IPluginInfo = Field(IPluginInfo(), description="Plugin info")


# web

## http


class INodeData(BaseModel):
    """This should align with `INodeData` at `src/schema/_python.ts`"""

    x: Optional[float] = Field(None, description="X of the node")
    y: Optional[float] = Field(None, description="Y of the node")
    w: Optional[float] = Field(None, description="Width of the node")
    h: Optional[float] = Field(None, description="Height of the node")
    transform: Optional[Matrix2D] = Field(
        None,
        description="Transform matrix of the node",
    )
    text: Optional[str] = Field(
        None,
        description="Content of the (text) node, will be `None` if the node is not a text node",
    )
    src: Optional[str] = Field(
        None,
        description="Image url of the node, will be `None` if the node is not an image node",
    )


class IHttpPluginRequest(BaseModel):
    identifier: str = Field(..., description="The identifier of the plugin")
    nodeData: INodeData = Field(..., description="Data extracted from `node`")
    nodeMeta: Dict[str, Any] = Field(..., description="Meta data of the `node`")
    extraData: Dict[str, Any] = Field(..., description="Extra data of each plugin")


class IHttpPluginResponse(BaseModel):
    success: bool = Field(..., description="Whether returned successfully")
    message: str = Field(..., description="The message of the response")
    data: Dict[str, Any] = Field(..., description="The data of the response")


## socket


class ISocketPluginMessage(IHttpPluginRequest):
    data: Dict[str, Any] = Field(..., description="The extra data of the message")


class ISocketResponse(BaseModel):
    data: BaseModel = Field(..., description="The data of the response")


# plugin interface


class IPlugin(ABC):
    identifier: str

    # abstract

    @property
    @abstractmethod
    def type(self) -> PluginType:
        pass

    @property
    @abstractmethod
    def settings(self) -> IPluginSettings:
        pass

    @abstractmethod
    def __call__(self, data: Any) -> Any:
        pass

    # api

    def to_plugin_settings(self, identifier: str) -> Dict[str, Any]:
        d = self.settings.dict()
        plugin_info = d.pop("pluginInfo")
        # `identifier` has hashed into `{identifier}.{hash}`
        plugin_info["endpoint"] = f"/{'.'.join(identifier.split('.')[:-1])}"
        plugin_info["identifier"] = identifier
        plugin_type = f"_python.{self.type}"
        offset_x = d.pop("offsetX")
        offset_y = d.pop("offsetY")
        node_constraint = d.pop("nodeConstraint")
        chakra_props = {}
        for field in IChakra.__fields__:
            chakra_value = d.pop(field)
            if chakra_value is not None:
                chakra_props[field] = chakra_value
        for k, v in list(d.items()):
            if v is None:
                d.pop(k)
        props = dict(
            nodeConstraint=node_constraint,
            pluginInfo=plugin_info,
            renderInfo=d,
            **chakra_props,
        )
        if offset_x is not None:
            props["offsetX"] = offset_x
        if offset_y is not None:
            props["offsetY"] = offset_y
        return dict(type=plugin_type, props=props)

    def load_image(self, src: str) -> Image.Image:
        return Image.open(BytesIO(requests.get(src).content))


class IMiddleWare(ABC):
    # abstract

    @property
    @abstractmethod
    def subscriptions(self) -> List[PluginType]:
        pass

    @abstractmethod
    def process(self, response: Any) -> Any:
        pass

    # optional callbacks

    def before(self, request: Any) -> None:
        pass

    # api

    def __call__(self, plugin: IPlugin, response: Any) -> Any:
        if plugin.type not in self.subscriptions:
            return response
        return self.process(response)


# (react) bindings

## (http) text area


class IHttpTextAreaPluginInfo(IPluginInfo):
    noLoading: bool = Field(
        False, description="Whether to show the 'Loading...' text or not"
    )
    textAlign: Optional[TextAlign] = Field(None, description="Text align")


## (http) qa


class IHttpQAPluginInfo(IPluginInfo):
    initialText: str = Field(
        ...,
        description="The initial text to be displayed in the text area",
    )


## (http) fields


class IHttpFieldsPluginInfo(IPluginInfo):
    header: Optional[str] = Field(None, description="Header of the plugin")
    definitions: Dict[str, IFieldDefinition] = Field(
        ...,
        description="Field definitions",
    )
    numColumns: Optional[int] = Field(None, description="Number of columns")


__all__ = [
    "PluginType",
    # noli
    "PivotType",
    "NodeConstraints",
    # chakra
    "TextAlign",
    # plugins
    "IPluginSettings",
    "IHttpPluginRequest",
    "IHttpPluginResponse",
    "ISocketPluginMessage",
    "ISocketResponse",
    "IPlugin",
    "IMiddleWare",
    # bindings
    "IHttpTextAreaPluginInfo",
    "IHttpQAPluginInfo",
    "IHttpFieldsPluginInfo",
]
