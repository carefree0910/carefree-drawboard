import json
import time

from abc import abstractmethod
from abc import ABC
from PIL import Image
from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import Union
from typing import TypeVar
from typing import Callable
from typing import Optional
from typing import Coroutine
from aiohttp import ClientSession
from pydantic import Field
from pydantic import BaseModel
from cftool.data_structures import Workflow

from cfdraw import constants
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

    PLUGIN_GROUP = "_python.pluginGroup"
    FIELDS = "_python.fields"
    WORKFLOW = "_python.workflow"
    TEXT_AREA = "_python.textArea"
    QA = "_python.QA"
    CHAT = "_python.chat"
    MARKDOWN = "_python.markdown"

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
    EMAIL = "email"
    GITHUB = "github"
    LOGO = "logo"
    TEXT_EDITOR = "textEditor"
    GROUP_EDITOR = "groupEditor"
    MULTI_EDITOR = "multiEditor"
    BRUSH = "brush"


# general


def hash_identifier(hash: str, identifier: str) -> str:
    return f"{identifier}.{hash}"


class IPluginInfo(BaseModel):
    """
    This should align with the following interfaces locate at `cfdraw/.web/src/schema/_python.ts`:
    * `IPythonPluginInfo`: `name`, `noErrorToast`
    * `IPythonSocketIntervals`: `retryInterval`, `updateInterval`
    """

    name: Optional[IStr] = Field(None, description="The name of the plugin")
    noErrorToast: Optional[bool] = Field(None, description="Whether not to toast error")
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
    exportFullImages: Optional[bool] = Field(
        None,
        description="Whether to export full images when multiple images are selected",
    )


class IPluginSettings(IChakra):
    """
    This should align with the `IPythonPlugin` locate at `cfdraw/.web/src/schema/_python.ts`,
    but for the sake of accessibility, we 'flattened' the fields. Here's a detailed explanation:

    --- IChakra --

    > Fields of `IChakra`, except `w` & `h`, will be injected to the `buttonProps`.
    >> `w` & `h` has special meanings so we need to skip them.
    > Documents of `charaProps` is listed below (the --- React fields --- section).

    --- required fields ---

    * `w` and `h` are the width and height of the expanded plugin, respectively.
    > Sometimes a plugin need not to be expanded, in this case, you can set `w` and `h` to `0`.
    > These two fields will go to the `renderInfo` part of the `IRender`, locates at
    `cfdraw/.web/src/schema/plugins.ts`.

    --- node constraints ---

    > These fields will go to the `NodeConstraintSettings` part of the `IRender`, locates at
    `cfdraw/.web/src/schema/plugins.ts`.
    > See Plugin Positioning (https://carefree0910.me/carefree-drawboard-doc/docs/plugins/#plugin-positioning)
    for detailed explanations of these fields.

    --- style fields ---

    > These fields will go to the `renderInfo` part of the `IRender`, locates at
    `cfdraw/.web/src/schema/plugins.ts`.
    > Which means they should align with the `IRenderInfo` locates at the same file.

    --- React fields ---

    * the `pluginInfo` maps to `IPythonPluginInfo`, but the `identifier` is injected on the fly.
    * the `buttonProps` is the universal fallback for you to inject any `ButtonProps` to the
    plugin button. (see `cfdraw/.web/src/schema/plugins.ts`, where you can see
    `export interface IFloating extends ButtonProps`)
    """

    # required fields
    w: Union[float, int] = Field(  # type: ignore
        ...,
        ge=0,
        description="""
Width of the expanded plugin.
> If it is less or equal than 1, we'll treat it as a ratio of the drawboard width.
""",
    )
    h: Union[float, int] = Field(  # type: ignore
        ...,
        ge=0,
        description="""
Height of the expanded plugin.
> If it is less or equal than 1, we'll treat it as a ratio of the drawboard height.
""",
    )
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
    minW: Optional[int] = Field(  # type: ignore
        None,
        description="Minimum width of the expanded plugin",
    )
    minH: Optional[int] = Field(  # type: ignore
        None,
        description="Minimum height of the expanded plugin",
    )
    maxW: Optional[int] = Field(  # type: ignore
        None,
        description="Maximum width of the expanded plugin",
    )
    maxH: Optional[int] = Field(  # type: ignore
        None,
        description="Maximum height of the expanded plugin",
    )
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
    expandPivot: Optional[PivotType] = Field(
        None,
        description="Pivot of the expanded panel, will be `pivot` if not specified",
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
    keepOpen: bool = Field(
        False,
        description="Whether should we keep the expanded panel of the plugin open, even when users already clicked on the drawboard.",
    )
    expandOpacity: Optional[float] = Field(None, description="Opacity of the modal")
    expandProps: Optional[IChakra] = Field(
        None,
        description="Extra (chakra) props of the plugin's expanded panel",
    )
    # React fields
    pluginInfo: IPluginInfo = Field(IPluginInfo(), description="Plugin info")
    buttonProps: Optional[Dict[str, Any]] = Field(
        None,
        description="Extra (chakra) props of the plugin button",
    )
    # internal fields
    no_offload: bool = Field(
        False,
        description=(
            "Whether not to offload the plugin to sub-thread when it is executed, "
            "useful when you know the plugin is fast enough.\n"
            "> This is introduced mainly because some libraries (e.g., `matplotlib`) "
            "need to be executed in the main thread."
        ),
    )

    def to_react(self, type: str, hash: str, identifier: str) -> Dict[str, Any]:
        def _pop_none(_d: Dict[str, Any]) -> None:
            for k, v in list(_d.items()):
                if v is None:
                    _d.pop(k)
                elif isinstance(v, dict):
                    _pop_none(v)

        d = self.dict(exclude={"pluginInfo"})
        pI = self.pluginInfo
        kw = dict(exclude={"plugins"}) if isinstance(pI, IPluginGroupInfo) else {}
        plugin_info = self.pluginInfo.dict(**kw)
        plugin_info["identifier"] = identifier
        if isinstance(pI, IPluginGroupInfo):
            plugins: List[Dict[str, Any]] = []
            for p_identifier, p_base in pI.plugins.items():
                p_base.hash = hash
                p = p_base()
                p.identifier = p_identifier
                plugins.append(p.to_react())
            plugin_info["plugins"] = plugins
        node_constraint = d.pop("nodeConstraint")
        node_constraint_rules = d.pop("nodeConstraintRules")
        node_constraint_validator = d.pop("nodeConstraintValidator")
        button_props = d.pop("buttonProps", None) or {}
        for field in IChakra.__fields__:
            # `w`, `h`, ... are special fields, should not be included in `chakra_props`
            if field in ["w", "h", "minW", "minH", "maxW", "maxH"]:
                continue
            chakra_value = d.pop(field)
            if chakra_value is not None:
                button_props[field] = chakra_value
        for k, v in list(d.items()):
            if v is None:
                d.pop(k)
        # src
        if not isinstance(pI, IPluginGroupInfo):
            d.setdefault("src", constants.DEFAULT_PLUGIN_ICON)
        else:
            d.setdefault("src", constants.DEFAULT_PLUGIN_GROUP_ICON)
        # gather
        props = dict(pluginInfo=plugin_info, renderInfo=d, **button_props)
        if node_constraint is not None:
            props["nodeConstraint"] = node_constraint
        if node_constraint_rules is not None:
            props["nodeConstraintRules"] = node_constraint_rules
        if node_constraint_validator is not None:
            props["nodeConstraintValidator"] = node_constraint_validator
        # pop None
        _pop_none(props)
        return dict(type=type, props=props)


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
    z: Optional[float] = Field(None, description="Layer of the node")
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
> Currently only `ImageNode` / `PathNode` / `BlankNode` will have this field defined.
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

    @property
    def identifier(self) -> Optional[str]:
        if self.meta is None:
            return None
        return self.meta.get("data", {}).get("identifier")

    @property
    def extra_responses(self) -> Optional[Dict[str, Any]]:
        if self.meta is None:
            return None
        return self.meta.get("data", {}).get("response", {}).get("extra")

    @property
    def workflow(self) -> Optional[Workflow]:
        extra_responses = self.extra_responses
        if extra_responses is None:
            return None
        workflow_json = extra_responses.get(constants.WORKFLOW_KEY)
        if workflow_json is None:
            return None
        return Workflow.from_json(workflow_json)


class ISocketRequest(BaseModel):
    """This should align with `IPythonSocketRequest` at `src/schema/_python.ts`"""

    hash: str = Field(..., description="The hash of the request")
    userId: str = Field(..., description="The id of the user")
    userJson: Optional[str] = Field(None, description="Full json of the user info")
    baseURL: str = Field(..., description="The base url of the request")
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

    def get_user_json(self) -> str:
        if self.userJson is not None:
            return self.userJson
        return json.dumps(dict(userId=self.userId))


class SocketStatus(str, Enum):
    """This should align with `PythonSocketStatus` at `src/schema/_python.ts`"""

    PENDING = "pending"
    WORKING = "working"
    FINISHED = "finished"
    EXCEPTION = "exception"
    INTERRUPTED = "interrupted"


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
    injections: Optional[Dict[str, Any]] = Field(None, description="Injections, if any")
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
    injections: Dict[str, Any]
    # internal
    _in_group: bool = False

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
    async def __call__(self, data: ISocketRequest) -> None:
        pass

    @abstractmethod
    def to_react(self) -> Dict[str, Any]:
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

    # optional

    ## Whether the images generated by this plugin should be audited
    image_should_audit: bool = True
    ## The notification (introductions, hardware requirements, etc.) you want to print out
    notification: Optional[str] = None


class Subscription(str, Enum):
    ALL = "__all__"


class IMiddleware(ABC):
    hash: str
    plugin: IPlugin

    # abstract

    @property
    @abstractmethod
    def subscriptions(self) -> Union[List[PluginType], Subscription]:
        pass

    @abstractmethod
    async def process(self, response: Any) -> Any:
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

    async def __call__(self, response: Any) -> Any:
        if (
            self.subscriptions != Subscription.ALL
            and self.plugin.type not in self.subscriptions
        ):
            return response
        if isinstance(response, ISocketMessage) and not self.can_handle_message:
            return response
        return await self.process(response)

    def make_success(self, final: Dict[str, Any]) -> ISocketMessage:
        return ISocketMessage.make_success(self.hash, final)


# (react) bindings


class ILogoPluginInfo(IPluginInfo):
    """This should align with `ILogoPlugin` at `cfdraw/.web/src/schema/plugins.ts`"""

    redirectUrl: Optional[IStr] = Field(
        None,
        description="Redirection target when clicking the logo, `None` means no redirection",
    )


class ILogoSettings(IPluginSettings):
    w: int = Field(0, ge=0, description="Width of the expanded plugin")  # type: ignore
    h: int = Field(0, ge=0, description="Height of the expanded plugin")  # type: ignore


class IPluginGroupInfo(IPluginInfo):
    header: Optional[IStr] = Field(None, description="Header of the plugin group")
    plugins: Dict[str, Type[IPlugin]] = Field(..., description="Plugins in the group")


class IWorkflowPluginInfo(IPluginInfo):
    """This should align with `IPythonWorkflowPlugin` at `cfdraw/.web/src/schema/_python.ts`"""

    header: Optional[IStr] = Field(None, description="Header of the plugin")
    numColumns: Optional[int] = Field(None, description="Number of columns")
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


class IFieldsPluginInfo(IWorkflowPluginInfo):
    """This should align with `IPythonFieldsPlugin` at `cfdraw/.web/src/schema/_python.ts`"""

    definitions: Dict[str, IFieldDefinition] = Field(
        ...,
        description="Field definitions",
    )


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


__all__ = [
    "ISend",
    "PluginType",
    "ReactPluginType",
    # general
    "hash_identifier",
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
    "IMiddleware",
    # bindings
    "ILogoPluginInfo",
    "ILogoSettings",
    "IPluginGroupInfo",
    "IFieldsPluginInfo",
    "IWorkflowPluginInfo",
    "ITextAreaPluginInfo",
    "IQAPluginInfo",
    "IChatPluginInfo",
]
