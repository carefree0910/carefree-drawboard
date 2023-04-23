from abc import abstractmethod
from abc import ABC
from abc import ABCMeta
from PIL import Image
from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import TypeVar
from typing import Callable
from typing import Optional
from typing import Coroutine
from aiohttp import ClientSession
from pydantic import Field
from pydantic import BaseModel

from cfdraw.utils.misc import deprecated
from cfdraw.schema.fields import IFieldDefinition
from cfdraw.parsers.noli import Matrix2D
from cfdraw.parsers.noli import INodeType
from cfdraw.parsers.noli import PivotType
from cfdraw.parsers.noli import NodeConstraints
from cfdraw.parsers.chakra import IChakra
from cfdraw.parsers.chakra import TextAlign


TPluginModel = TypeVar("TPluginModel")
ISendSocketText = Callable[["ISocketMessage"], Coroutine[Any, Any, None]]


class PluginType(str, Enum):
    # These types should align with the `allAvailablePythonPlugins` locates at
    # `cfdraw/.web/src/schema/plugins.ts` (without the `_python.` prefix)
    TEXT_AREA = "textArea"
    HTTP_QA = "httpQA"
    HTTP_FIELDS = "httpFields"
    SOCKET_FIELDS = "socketFields"
    # this type of plugins will not be rendered on the drawboard 🎨
    _INTERNAL = "_internal"


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
    toastMessageOnSubmit: Optional[str] = Field(
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


class INodeData(BaseModel):
    """This should align with `INodeData` at `src/schema/_python.ts`"""

    type: Optional[INodeType] = Field(None, description="Type of the node")
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
        description="""
Image url of the node, will be `None` if the node is not intended to be converted to image.
> Currently only `ImageNode` and `PathNode` will have this field defined.
""",
    )
    meta: Optional[Dict[str, Any]] = Field(None, description="Meta of the node")
    children: Optional[List["INodeData"]] = Field(
        None,
        description=(
            "Will be a list of `INodeData` if and only if "
            "the node is a `Group` (i.e. `type` == 'group')"
        ),
    )


class IPluginRequest(BaseModel):
    """This should align with `IPythonRequest` at `src/schema/_python.ts`"""

    userId: str = Field(..., description="The id of the user")
    identifier: str = Field(..., description="The identifier of the plugin")
    nodeData: INodeData = Field(
        ...,
        description="""
Data extracted from `node`.
> If multiple nodes are selected, this field will be empty and please use `nodeDataList` instead.
""",
    )
    nodeDataList: List[INodeData] = Field(
        ...,
        description="""
List of data extracted from `nodes`.
> If only one node is selected, this field will be empty and please use `nodeData` instead.
""",
    )
    extraData: Dict[str, Any] = Field(..., description="Extra data of each plugin")
    isInternal: bool = Field(False, description="Whether the request is internal")


class IPluginResponse(BaseModel):
    """This should align with `IPythonResponse` at `src/schema/_python.ts`"""

    success: bool = Field(..., description="Whether returned successfully")
    message: str = Field(..., description="The message of the response")
    data: Dict[str, Any] = Field(..., description="The data of the response")


class ISocketRequest(IPluginRequest):
    """This should align with `IPythonSocketRequest` at `src/schema/_python.ts`"""

    hash: str = Field(..., description="The hash of the request")


class SocketStatus(str, Enum):
    """This should align with `PythonSocketStatus` at `src/schema/_python.ts`"""

    PENDING = "pending"
    WORKING = "working"
    FINISHED = "finished"
    EXCEPTION = "exception"


class ISocketIntermediate(BaseModel):
    """This should align with `IPythonSocketIntermediate` at `src/schema/_python.ts`"""

    imageList: Optional[List[str]] = Field(
        None,
        description="Intermediate images, if any",
    )
    textList: Optional[List[str]] = Field(
        None,
        description="Intermediate texts, if any",
    )


class ISocketResponse(BaseModel):
    """This should align with `IPythonSocketResponse` at `src/schema/_python.ts`"""

    progress: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Progress of current task, if any",
    )
    intermediate: Optional[ISocketIntermediate] = Field(
        None,
        description="Intermediate responses, if any",
    )
    final: Optional[Dict[str, Any]] = Field(None, description="Final response, if any")


class ISocketData(BaseModel):
    """This should align with `IPythonSocketData` at `src/schema/_python.ts`"""

    hash: str = Field(..., description="Hash of the current task")
    status: SocketStatus = Field(..., description="Status of the current task")
    total: int = Field(..., description="Number of tasks")
    pending: int = Field(..., description="Number of pending tasks")
    message: str = Field(..., description="Message of the current status")
    data: ISocketResponse = Field(ISocketResponse(), description="Response data")


class ISocketMessage(IPluginResponse):
    data: ISocketData = Field(..., description="Socket data of the current task")

    @classmethod
    def from_response(cls, hash: str, response: IPluginResponse) -> "ISocketData":
        return cls(
            success=True,
            message="",
            data=ISocketData(
                hash=hash,
                status=SocketStatus.FINISHED
                if response.success
                else SocketStatus.EXCEPTION,
                total=0,
                pending=0,
                message=response.message,
                data=ISocketResponse(final=response.data),
            ),
        )


# plugin interface


class IPlugin(ABC):
    hash: str
    identifier: str
    http_session: ClientSession

    @property
    @abstractmethod
    def type(self) -> PluginType:
        pass

    @property
    @abstractmethod
    def settings(self) -> IPluginSettings:
        pass

    @abstractmethod
    async def __call__(self, data: IPluginRequest) -> IPluginResponse:
        pass

    @abstractmethod
    def to_plugin_settings(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def load_image(self, src: str) -> Image.Image:
        pass


class IMiddleWare(ABC):
    # abstract

    @property
    @abstractmethod
    def subscriptions(self) -> List[PluginType]:
        pass

    @abstractmethod
    async def process(self, response: Any) -> IPluginResponse:
        """
        If `can_inject_response` is `False`, the `response` here could be anything except
        `IPluginResponse`, because in this case if `response` is already an `IPluginResponse`,
        it will be returned directly in the `__call__` method.
        """

    # optional callbacks

    @property
    def can_handle_response(self) -> bool:
        return False

    async def before(self, request: IPluginRequest) -> None:
        pass

    # api

    async def __call__(self, plugin: IPlugin, response: Any) -> IPluginResponse:
        if plugin.type not in self.subscriptions:
            return response
        if isinstance(response, IPluginResponse) and not self.can_handle_response:
            return response
        return await self.process(response)


class ISocketMiddleWare(IMiddleWare, metaclass=ABCMeta):
    def __init__(self, send_text: ISendSocketText) -> None:
        self.send_text = send_text


# (react) bindings


class IFieldsPluginInfo(IPluginInfo):
    header: Optional[str] = Field(None, description="Header of the plugin")
    definitions: Dict[str, IFieldDefinition] = Field(
        ...,
        description="Field definitions",
    )
    numColumns: Optional[int] = Field(None, description="Number of columns")


## text area


class ITextAreaPluginInfo(IPluginInfo):
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


## deprecated


@deprecated("please use `ITextAreaPluginInfo` instead")
class IHttpTextAreaPluginInfo(ITextAreaPluginInfo):
    pass


__all__ = [
    "ISendSocketText",
    "PluginType",
    # general
    "IPluginInfo",
    "IPluginSettings",
    # web
    "INodeData",
    "IPluginRequest",
    "IPluginResponse",
    "SocketStatus",
    "ISocketData",
    "ISocketMessage",
    # plugin interface
    "IPlugin",
    "IMiddleWare",
    "IFieldsPluginInfo",
    # bindings
    "ITextAreaPluginInfo",
    "IHttpQAPluginInfo",
    # deprecated
    "IHttpTextAreaPluginInfo",
]
