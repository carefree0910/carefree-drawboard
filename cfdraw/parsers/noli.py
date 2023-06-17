from enum import Enum
from typing import Any
from typing import Dict
from typing import List
from typing import Union
from typing import Optional
from typing import Generator
from pydantic import Field
from pydantic import BaseModel
from cftool.geometry import Line
from cftool.geometry import Point
from cftool.geometry import HitTest
from cftool.geometry import Matrix2D
from cftool.geometry import PivotType


class Lang(str, Enum):
    ZH = "zh"
    EN = "en"


class I18N(BaseModel):
    """This should have all fields of `Lang` defined above"""

    zh: str = Field(..., description="Chinese")
    en: str = Field(..., description="English")

    def __eq__(self, other: Union["I18N", Any]) -> bool:
        if isinstance(other, I18N):
            return self.zh == other.zh and self.en == other.en
        return self == other


IStr = Union[str, I18N]


class NodeConstraints(str, Enum):
    """This should align with the `NodeConstraints` at `cfdraw/.web/src/schema/plugins.ts`"""

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


class NodeConstraintRules(BaseModel):
    """This should align with the `NodeConstraintRules` at `cfdraw/.web/src/schema/plugins.ts`"""

    some: Optional[List[NodeConstraints]] = Field(
        None,
        description="Some of the constraints must be satisfied",
    )
    every: Optional[List[NodeConstraints]] = Field(
        None,
        description="Every constraint must be satisfied",
    )
    exactly: Optional[List[NodeConstraints]] = Field(
        None,
        description=(
            "The exact constraints. This is useful when we want to "
            "constrain certain number of nodes as well as their types"
        ),
    )


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
    FRAME = "frame"


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
    params: Optional[Dict[str, Any]] = None


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
        d = super().dict(**kwargs)
        d.pop("type")
        return dict(className=type2class_name[self.type], info=d)


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
    "Frame": GroupType.FRAME,
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
    "I18N",
    "PivotType",
    "SingleNodeType",
    "GroupType",
    "NodeConstraints",
    "NodeConstraintRules",
    "Point",
    "Line",
    "Matrix2D",
    "HitTest",
]
