import math

import numpy as np

from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Tuple
from typing import Union
from typing import Optional
from typing import Generator
from pydantic import BaseModel
from dataclasses import dataclass


class Lang(str, Enum):
    ZH = "zh"
    EN = "en"


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


# data structures


@dataclass
class Point:
    x: float
    y: float

    @property
    def tuple(self) -> Tuple[float, float]:
        return self.x, self.y

    def __rmatmul__(self, other: "Matrix2D") -> "Point":
        a, b, c, d, e, f = [pair[1] for pair in other]
        x, y = self.x, self.y
        return Point(x=a * x + c * y + e, y=b * x + d * y + f)


class Matrix2D(BaseModel):
    a: float
    b: float
    c: float
    d: float
    e: float
    f: float

    def __matmul__(self, other: Point) -> Point:
        return other.__rmatmul__(self)

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

    @property
    def matrix(self) -> np.ndarray:
        return np.array([[self.a, self.c, self.e], [self.b, self.d, self.f]])


class SingleNodeType(str, Enum):
    POLYGON = "polygon"
    ELLIPSE = "ellipse"
    RECTANGLE = "rectangle"
    STAR = "star"
    LINE = "line"
    PATH = "path"
    SVG = "svg"
    TEXT = "text"
    IMAGE = "image"
    NOLI_FRAME = "noliFrame"
    NOLI_TEXT_FRAME = "noliTextFrame"


class GroupType(str, Enum):
    GROUP = "group"


class LayerParams(BaseModel):
    z: float


class RenderParams(BaseModel):
    src: Optional[str]


class SingleNode(BaseModel):
    type: SingleNodeType
    alias: str
    bboxFields: Matrix2D
    layerParams: LayerParams
    params: Dict[str, Any]
    renderParams: Optional[RenderParams]


class Group(BaseModel):
    type: GroupType
    alias: str
    transform: Matrix2D
    nodes: List["INode"]


INodeType = Union[SingleNodeType, GroupType]


class INode(BaseModel):
    type: INodeType
    alias: str
    bboxFields: Matrix2D
    layerParams: Optional[LayerParams]  # only for single node
    params: Optional[Dict[str, Any]]  # only for single node
    renderParams: Optional[RenderParams]  # only for single node
    nodes: Optional[List["INode"]]  # only for group

    def dict(self, **kwargs: Any) -> Dict[str, Any]:
        return dict(className=type2class_name[self.type], info=super().dict(**kwargs))


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
            return None

        node = _search(self.root_nodes)
        if node is None:
            raise ValueError(f"node {alias} not found")
        return node

    @property
    def all_single_nodes(self) -> Generator[SingleNode, None, None]:
        def _generate(nodes: List[INode]) -> Generator[SingleNode, None, None]:
            for node in nodes:
                if node.type in SingleNodeType:
                    yield node
                elif node.type in GroupType:
                    if node.nodes is None:
                        raise ValueError(f"`Group` '{node.alias}' has no nodes")
                    yield from _generate(node.nodes)

        yield from _generate(self.root_nodes)

    @property
    def bg_node(self) -> Optional[SingleNode]:
        for node in self.all_single_nodes:
            if node.params.get("isBackground"):
                return node
        return None


class_name2type = {
    "PolygonShapeNode": SingleNodeType.POLYGON,
    "EllipseShapeNode": SingleNodeType.ELLIPSE,
    "RectangleShapeNode": SingleNodeType.RECTANGLE,
    "StarShapeNode": SingleNodeType.STAR,
    "LineNode": SingleNodeType.LINE,
    "PathNode": SingleNodeType.PATH,
    "SVGNode": SingleNodeType.SVG,
    "TextNode": SingleNodeType.TEXT,
    "ImageNode": SingleNodeType.IMAGE,
    "NoliFrameNode": SingleNodeType.NOLI_FRAME,
    "NoliTextFrameNode": SingleNodeType.NOLI_TEXT_FRAME,
    "Group": GroupType.GROUP,
}
type2class_name = {v: k for k, v in class_name2type.items()}


def _parse_single_node(info: Dict[str, Any]) -> SingleNode:
    core_info = info["info"]
    return SingleNode(type=class_name2type[info["className"]], **core_info)


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
    "Lang",
    "PivotType",
    "SingleNodeType",
    "GroupType",
    "NodeConstraints",
]
