import time

from abc import abstractmethod
from abc import ABC
from PIL import Image
from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import TypeVar
from typing import Callable
from typing import Optional
from typing import Coroutine
from aiohttp import ClientSession
from pydantic import Field
from pydantic import BaseModel

from cfdraw.utils.misc import deprecated
from cfdraw.schema.fields import IFieldDefinition
from cfdraw.parsers.noli import IStr
from cfdraw.parsers.noli import Matrix2D
from cfdraw.parsers.noli import INodeType
from cfdraw.parsers.noli import PivotType
from cfdraw.parsers.noli import SingleNodeType
from cfdraw.parsers.noli import NodeConstraints
from cfdraw.parsers.noli import NodeConstraintRules
from cfdraw.parsers.chakra import IChakra
from cfdraw.parsers.chakra import TextAlign


TPluginModel = TypeVar("TPluginModel")
ISend = Callable[["ISocketMessage"], Coroutine[Any, Any, bool]]


class PluginType(str, Enum):
    """
    These types should align with the `allPythonPlugins` locates at
    `cfdraw/.web/src/schema/plugins.ts`
    """

    FIELDS = "_python.fields"
    TEXT_AREA = "_python.textArea"
    QA = "_python.QA"
    CHAT = "_python.chat"
    PLUGIN_GROUP = "_python.pluginGroup"

    # this type of plugins will not be rendered on the drawboard 🎨
    _INTERNAL = "_internal"


class ReactPluginType(str, Enum):
    """
    These types should align with the `allReactPlugins` locates at
    `cfdraw/.web/src/schema/plugins.ts`
    """

    META = "meta"
    SETTINGS = "settings"
    PROJECT = "project"
    ADD = "add"
    ARRANGE = "arrange"
    UNDO = "undo"
    REDO = "redo"
    DOWNLOAD = "download"
    DELETE = "delete"
    WIKI = "wiki"
    GITHUB = "github"
    EMAIL = "email"
    TEXT_EDITOR = "textEditor"
    GROUP_EDITOR = "groupEditor"
    MULTI_EDITOR = "multiEditor"
    BRUSH = "brush"


# general


class IPluginInfo(BaseModel):
    """
    This should align with the following interfaces locate at `cfdraw/.web/src/schema/_python.ts`:
    * `IPythonPluginInfo`: `name`
    * `IPythonSocketIntervals`: `retryInterval`, `updateInterval`
    * `IPythonPluginWithSubmitPluginInfo`: `closeOnSubmit`, `toastOnSubmit`, `toastMessageOnSubmit`
    """

    name: Optional[IStr] = Field(None, description="The name of the plugin")
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
    toastMessageOnSubmit: Optional[IStr] = Field(
        None,
        description="The message of the toast, only take effect when `toastOnSubmit` is `True`",
    )


class IPluginSettings(IChakra):
    # required fields
    w: int = Field(..., gt=0, description="Width of the expanded plugin")  # type: ignore
    h: int = Field(..., gt=0, description="Height of the expanded plugin")  # type: ignore
    # node constraints
    nodeConstraint: Optional[NodeConstraints] = Field(
        None,
        description="""
Spcify when the plugin will be shown.
> If set to 'none', the plugin will always be shown.
> If set to 'anyNode', the plugin will be shown when any node is selected.
> If set to 'singleNode', the plugin will be shown when only one node is selected.
> If set to 'multiNode', the plugin will be shown when more than one node is selected.
> Otherwise, the plugin will be shown when the selected node is of the specified type.
""",
    )
    nodeConstraintRules: Optional[NodeConstraintRules] = Field(
        None,
        description=(
            "Specify the complex rule of the node constraint, "
            "will work together with `nodeConstraint`, but it is often "
            "not necessary to use `nodeConstraint` when this field is set."
        ),
    )
    nodeConstraintValidator: Optional[str] = Field(
        None,
        description=(
            "The universal fallback. "
            "It specifies the name of the validator registered by `register_node_validator`."
        ),
    )
    # style fields
    src: Optional[IStr] = Field(
        None,
        description="""
The image url that will be shown for the plugin.
> If not specified, we will use a default plugin-ish image.
""",
    )
    tooltip: Optional[IStr] = Field(
        None,
        description="""
The tooltip that will be shown for the plugin.
> It is recommended to specify an informative tooltip, but it's also OK to leave it as `None`,
in which case we will not show any tooltip for the plugin.
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


class ElapsedTimes(BaseModel):
    """This should align with `IElapsedTimes` at `cfdraw/.web/src/schema/meta.ts`"""

    createTime: Optional[float]
    startTime: Optional[float]
    endTime: Optional[float]
    pending: Optional[float]
    executing: Optional[float]
    upload: Optional[float]
    total: Optional[float]

    def __init__(self, **data: Any):
        super().__init__(**data)
        self.createTime = time.time()

    def start(self) -> None:
        start = time.time()
        self.startTime = start
        if self.createTime is not None:
            self.pending = start - self.createTime

    def end(self) -> None:
        end = time.time()
        self.endTime = end
        if self.startTime is not None:
            self.executing = end - self.startTime
            if self.upload is not None:
                self.executing -= self.upload
        if self.createTime is not None:
            self.total = end - self.createTime


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
    elapsedTimes: Optional[ElapsedTimes] = Field(None, description="Elapsed times.")


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
        progress: Optional[float] = None,
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
    send_message: ISend
    elapsed_times: ElapsedTimes
    extra_responses: Dict[str, Any]
    # internal
    _in_group: bool = False

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
    def filter(self, nodes: List[INodeData], target: SingleNodeType) -> List[INodeData]:
        pass

    @abstractmethod
    async def load_image(self, src: str) -> Image.Image:
        pass

    @abstractmethod
    def send_progress(
        self,
        progress: float,
        *,
        textList: Optional[List[str]] = None,
        imageList: Optional[List[str]] = None,
    ) -> bool:
        pass


class IMiddleWare(ABC):
    hash: str
    plugin: IPlugin

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

    def __init__(self, plugin: IPlugin) -> None:
        self.plugin = plugin

    async def __call__(self, response: Any) -> ISocketMessage:
        if self.plugin.type not in self.subscriptions:
            return response
        if isinstance(response, ISocketMessage) and not self.can_handle_message:
            return response
        return await self.process(response)

    def make_success(self, final: Dict[str, Any]) -> ISocketMessage:
        return ISocketMessage.make_success(self.hash, final)


# (react) bindings


class IFieldsPluginInfo(IPluginInfo):
    """This should align with `IPythonFieldsPlugin` at `cfdraw/.web/src/schema/_python.ts`"""

    header: Optional[IStr] = Field(None, description="Header of the plugin")
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

    initialText: IStr = Field(
        ...,
        description="The initial text to be displayed in the text area",
    )


class IChatPluginInfo(IPluginInfo):
    """This should align with `IPythonChatPlugin` at `cfdraw/.web/src/schema/_python.ts`"""

    initialText: IStr = Field(
        "",
        description="The initial text to be displayed in the text area",
    )


class IPluginGroupInfo(IPluginInfo):
    header: Optional[IStr] = Field(None, description="Header of the plugin group")
    plugins: Dict[str, Type[IPlugin]] = Field(..., description="Plugins in the group")


## deprecated


@deprecated("please use `ITextAreaPluginInfo` instead")
class IHttpTextAreaPluginInfo(ITextAreaPluginInfo):
    pass


@deprecated("please use `IQAPluginInfo` instead")
class IHttpQAPluginInfo(IQAPluginInfo):
    pass


__all__ = [
    "ISend",
    "PluginType",
    "ReactPluginType",
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
    "IChatPluginInfo",
    "IPluginGroupInfo",
    # deprecated
    "IHttpTextAreaPluginInfo",
    "IHttpQAPluginInfo",
]
