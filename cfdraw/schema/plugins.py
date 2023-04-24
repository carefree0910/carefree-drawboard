from abc import abstractmethod
from abc import ABC
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
ISendSocketMessage = Callable[["ISocketMessage"], Coroutine[Any, Any, None]]


class PluginType(str, Enum):
    # These types should align with the `allAvailablePythonPlugins` locates at
    # `cfdraw/.web/src/schema/plugins.ts` (without the `_python.` prefix)
    TEXT_AREA = "textArea"
    QA = "QA"
    FIELDS = "fields"
    # this type of plugins will not be rendered on the drawboard 🎨
    _INTERNAL = "_internal"


# general


class IPluginInfo(BaseModel):
    """
    This should align with:
    * `cfdraw/.web/src/schema/_python.ts`
    * `IPythonSocketIntervals`: `retryInterval`, `updateInterval`
    * `IPythonPluginWithSubmitPluginInfo`: `closeOnSubmit`, `toastOnSubmit`, `toastMessageOnSubmit`
    """

    retryInterval: Optional[int] = Field(
        None,
        ge=0,
        description="If not None, the plugin will retry in `retryInterval` ms when exception occurred",
    )
    updateInterval: Optional[int] = Field(
        None,
        gt=0,
        description="If not None, the plugin will be called every `updateInterval` ms",
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


class ISocketRequest(BaseModel):
    """This should align with `IPythonSocketRequest` at `src/schema/_python.ts`"""

    hash: str = Field(..., description="The hash of the request")
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


class ISocketMessage(BaseModel):
    """This should align with `IPythonSocketMessage` at `src/schema/_python.ts`"""

    hash: str = Field(..., description="Hash of the current task")
    status: SocketStatus = Field(..., description="Status of the current task")
    total: int = Field(..., description="Number of tasks")
    pending: int = Field(..., description="Number of pending tasks")
    message: str = Field(..., description="Message of the current status")
    data: ISocketResponse = Field(ISocketResponse(), description="Response data")

    @classmethod
    def make_progress(
        cls,
        hash: str,
        progress: float,
        intermediate: Optional[ISocketIntermediate] = None,
    ) -> "ISocketMessage":
        return cls(
            hash=hash,
            status=SocketStatus.WORKING,
            total=0,
            pending=0,
            message="",
            data=ISocketResponse(progress=progress, intermediate=intermediate),
        )

    @classmethod
    def make_success(cls, hash: str, final: Dict[str, Any]) -> "ISocketMessage":
        return cls(
            hash=hash,
            status=SocketStatus.FINISHED,
            total=0,
            pending=0,
            message="",
            data=ISocketResponse(final=final),
        )

    @classmethod
    def make_exception(cls, hash: str, message: str) -> "ISocketMessage":
        return cls(
            hash=hash,
            status=SocketStatus.EXCEPTION,
            total=0,
            pending=0,
            message=message,
        )


# plugin interface


class IPlugin(ABC):
    hash: str
    identifier: str
    http_session: ClientSession
    # task specific
    task_hash: str
    send_message: ISendSocketMessage

    @property
    @abstractmethod
    def type(self) -> PluginType:
        pass

    @property
    @abstractmethod
    def settings(self) -> IPluginSettings:
        pass

    @abstractmethod
    async def __call__(self, data: ISocketRequest) -> ISocketMessage:
        pass

    @abstractmethod
    def to_plugin_settings(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def load_image(self, src: str) -> Image.Image:
        pass


class IMiddleWare(ABC):
    hash: str
    send_message: ISendSocketMessage

    # abstract

    @property
    @abstractmethod
    def subscriptions(self) -> List[PluginType]:
        pass

    @abstractmethod
    async def process(self, response: Any) -> ISocketMessage:
        """
        If `can_handle_message` is `False`, the `response` here could be anything except
        `ISocketMessage`, because in this case if `response` is already an `ISocketMessage`,
        it will be returned directly in the `__call__` method.
        """

    # optional callbacks

    @property
    def can_handle_message(self) -> bool:
        return False

    async def before(self, request: ISocketRequest) -> None:
        self.hash = request.hash

    # api

    def __init__(self, send_message: ISendSocketMessage) -> None:
        self.send_message = send_message

    async def __call__(self, plugin: IPlugin, response: Any) -> ISocketMessage:
        if plugin.type not in self.subscriptions:
            return response
        if isinstance(response, ISocketMessage) and not self.can_handle_message:
            return response
        return await self.process(response)

    def make_success(self, final: Dict[str, Any]) -> ISocketMessage:
        return ISocketMessage.make_success(self.hash, final)


# (react) bindings


class IFieldsPluginInfo(IPluginInfo):
    """This should align with `IPythonFieldsPlugin` at `cfdraw/.web/src/schema/_python.ts`"""

    header: Optional[str] = Field(None, description="Header of the plugin")
    definitions: Dict[str, IFieldDefinition] = Field(
        ...,
        description="Field definitions",
    )
    numColumns: Optional[int] = Field(None, description="Number of columns")
    noErrorToast: Optional[bool] = Field(None, description="Whether not to toast error")


class ITextAreaPluginInfo(IPluginInfo):
    """This should align with `IPythonTextAreaPlugin` at `cfdraw/.web/src/schema/_python.ts`"""

    noLoading: bool = Field(
        False, description="Whether to show the 'Loading...' text or not"
    )
    textAlign: Optional[TextAlign] = Field(None, description="Text align")


class IQAPluginInfo(IPluginInfo):
    """This should align with `IPythonQAPlugin` at `cfdraw/.web/src/schema/_python.ts`"""

    initialText: str = Field(
        ...,
        description="The initial text to be displayed in the text area",
    )


## deprecated


@deprecated("please use `ITextAreaPluginInfo` instead")
class IHttpTextAreaPluginInfo(ITextAreaPluginInfo):
    pass


@deprecated("please use `IQAPluginInfo` instead")
class IHttpQAPluginInfo(IQAPluginInfo):
    pass


__all__ = [
    "ISendSocketMessage",
    "PluginType",
    # general
    "IPluginInfo",
    "IPluginSettings",
    # web
    "INodeData",
    "ISocketRequest",
    "SocketStatus",
    "ISocketIntermediate",
    "ISocketResponse",
    "ISocketMessage",
    # plugin interface
    "IPlugin",
    "IMiddleWare",
    "IFieldsPluginInfo",
    # bindings
    "ITextAreaPluginInfo",
    "IQAPluginInfo",
    # deprecated
    "IHttpTextAreaPluginInfo",
    "IHttpQAPluginInfo",
]
