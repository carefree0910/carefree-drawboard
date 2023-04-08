import json
import math

from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Tuple
from typing import Union
from typing import Optional
from typing import Generator
from typing import NamedTuple
from pydantic import Field
from pydantic import BaseModel

from cfdraw import constants


class PivotType(str, Enum):
    LT = "lt"
    TOP = "top"
    RT = "rt"
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"
    LB = "lb"
    BOTTOM = "bottom"
    RB = "rb"


class PluginType(str, Enum):
    TEXT_AREA = "textArea"


class NodeConstraints(str, Enum):
    # shape
    POLYGON = "polygon"
    ELLIPSE = "ellipse"
    RECTANGLE = "rectangle"
    STAR = "star"
    LINE = "line"
    # single node
    SVG = "svg"
    TEXT = "text"
    IMAGE = "image"
    PATH = "path"
    NOLI_FRAME = "noliFrame"
    NOLI_TEXT_FRAME = "noliTextFrame"
    # group
    GROUP = "group"
    # special
    NONE = "none"
    ANY_NODE = "anyNode"
    SINGLE_NODE = "singleNode"
    MULTI_NODE = "multiNode"


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


def _get_default_plugin_settings() -> DefaultPluginSettings:
    pivot = "export const DEFAULT_PLUGIN_SETTINGS = "
    with open(constants.TS_CONSTANTS_FILE, "r") as f:
        start = False
        target_lines = []
        for line in f:
            line = line.strip()
            if line.startswith(pivot):
                start = True
                target_lines.append("{")
            elif start:
                if line.endswith("};"):
                    target_lines[-1] = target_lines[-1][:-1]  # strip the trailing comma
                    target_lines.append("}")
                    break
                left, right = line.split(": ")
                line = f'"{left}": {right}'
                target_lines.append(line)
    json_str = "".join(target_lines)
    d = json.loads(json_str)
    return DefaultPluginSettings(**d)


DEFAULT_PLUGIN_SETTINGS = _get_default_plugin_settings()


class IPluginInfo(BaseModel):
    """The actual data used in `usePython` hook & each React component."""

    updateInterval: int = Field(
        0,
        ge=0,
        description="If > 0, the plugin will be called every `updateInterval` ms",
    )


class IPluginSettings(BaseModel):
    # required fields
    w: int = Field(..., gt=0, description="Width of the expanded plugin")
    h: int = Field(..., gt=0, description="Height of the expanded plugin")
    type: PluginType = Field(..., description="Type of the plugin")
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
    # functional fields
    requireNode: bool = Field(
        True,
        description="Whether the plugin requires the drawboard to send the JSON data of the selected node to it",
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
    # chakra fields
    p: Optional[str] = Field(None, description="Padding of the plugin")
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
        return dict(
            type=plugin_type,
            props=dict(
                offsetX=offset_x,
                offsetY=offset_y,
                nodeConstraint=node_constraint,
                pluginInfo=plugin_info,
                renderInfo=d,
            ),
        )


# data structures


class Matrix2D(BaseModel):
    a: float
    b: float
    c: float
    d: float
    e: float
    f: float

    @property
    def w(self) -> float:
        return math.sqrt(self.a**2 + self.b**2)

    @property
    def h(self) -> float:
        return (self.a * self.d - self.b * self.c) / max(self.w, 1.0e-12)

    @property
    def wh(self) -> Tuple[float, float]:
        w = self.w
        h = (self.a * self.d - self.b * self.c) / max(w, 1.0e-12)
        return w, h

    @property
    def area(self) -> float:
        w, h = self.wh
        return w * abs(h)

    @property
    def theta(self) -> float:
        return -math.atan2(self.b, self.a)

    @property
    def decompose(self) -> Dict[str, float]:
        a, b, c, d, e, f = self
        w, h = self.wh
        return {
            "x": e,
            "y": f,
            "theta": self.theta,
            "skew_x": math.atan2(a * c + b * d, w**2),
            "skew_y": 0.0,
            "w": w,
            "h": h,
        }


class SingleNodeType(str, Enum):
    POLYGON = "polygon"
    ELLIPSE = "ellipse"
    RECTANGLE = "rectangle"
    STAR = "star"
    LINE = "line"
    SVG = "svg"
    TEXT = "text"
    IMAGE = "image"
    NOLI_FRAME = "noliFrame"
    NOLI_TEXT_FRAME = "noliTextFrame"


class GroupType(str, Enum):
    GROUP = "group"


class SingleNode(BaseModel):
    type: SingleNodeType
    alias: str
    transform: Matrix2D
    z: float
    params: Dict[str, Any]
    render_params: Optional[Dict[str, Any]]


class Group(BaseModel):
    type: GroupType
    alias: str
    transform: Matrix2D
    nodes: List["INode"]


class INode(BaseModel):
    type: Union[SingleNodeType, GroupType]
    alias: str
    transform: Matrix2D
    z: Optional[float]  # only for single node
    params: Optional[Dict[str, Any]]  # only for single node
    render_params: Optional[Dict[str, Any]]  # only for single node
    nodes: Optional[List["INode"]]  # only for group


class Graph(BaseModel):
    root_nodes: List[INode]

    def get(self, alias: str) -> INode:
        def _search(nodes: List[INode]) -> Optional[INode]:
            for node in nodes:
                if node.alias == alias:
                    return node
                if isinstance(node, Group):
                    result = _search(node.nodes)
                    if result is not None:
                        return result

        node = _search(self.root_nodes)
        if node is None:
            raise ValueError(f"node {alias} not found")
        return node

    @property
    def all_single_nodes(self) -> Generator[SingleNode, None, None]:
        def _generate(nodes: List[INode]) -> List[SingleNode]:
            for node in nodes:
                if isinstance(node, SingleNode):
                    yield node
                elif isinstance(node, Group):
                    yield from _generate(node.nodes)

        yield from _generate(self.root_nodes)

    @property
    def bg_node(self) -> SingleNode:
        for node in self.all_single_nodes:
            if node.params.get("isBackground"):
                return node


class_name2type = {
    "PolygonShapeNode": SingleNodeType.POLYGON,
    "EllipseShapeNode": SingleNodeType.ELLIPSE,
    "RectangleShapeNode": SingleNodeType.RECTANGLE,
    "StarShapeNode": SingleNodeType.STAR,
    "LineNode": SingleNodeType.LINE,
    "SVGNode": SingleNodeType.SVG,
    "TextNode": SingleNodeType.TEXT,
    "ImageNode": SingleNodeType.IMAGE,
    "NoliFrameNode": SingleNodeType.NOLI_FRAME,
    "NoliTextFrameNode": SingleNodeType.NOLI_TEXT_FRAME,
}


def _parse_single_node(info: Dict[str, Any]) -> SingleNode:
    core_info = info["info"]
    return SingleNode(
        type=class_name2type[info["className"]],
        alias=core_info["alias"],
        transform=Matrix2D(**core_info["bboxFields"]),
        z=core_info["layerParams"]["z"],
        params=core_info["params"],
        render_params=core_info.get("renderParams"),
    )


def _parse_group(info: Dict[str, Any]) -> Group:
    core_info = info["info"]
    return Group(
        type=GroupType.GROUP,
        alias=core_info["alias"],
        transform=Matrix2D(**core_info["transform"]),
        nodes=list(map(parse_node, core_info["nodes"])),
    )


def parse_node(info: Dict[str, Any]) -> INode:
    class_name = info["className"]
    if class_name == "Group":
        return _parse_group(info)
    return _parse_single_node(info)


def parse_graph(render_info_list: List[Dict[str, Any]]) -> Graph:
    return Graph(root_nodes=list(map(parse_node, render_info_list)))


__all__ = [
    "PivotType",
    "PluginType",
    "NodeConstraints",
    "IPluginInfo",
    "IPluginSettings",
]
