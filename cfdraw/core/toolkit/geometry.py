import math

from enum import Enum
from typing import List
from typing import Tuple
from typing import Union
from typing import TypeVar
from typing import Optional
from typing import TYPE_CHECKING
from pydantic import BaseModel
from dataclasses import dataclass

if TYPE_CHECKING:
    import numpy as np


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


# start from left-top, clockwise, plus the center point
outer_pivots: List[PivotType] = [
    PivotType.LT,
    PivotType.TOP,
    PivotType.RT,
    PivotType.RIGHT,
    PivotType.RB,
    PivotType.BOTTOM,
    PivotType.LB,
    PivotType.LEFT,
]
all_pivots: List[PivotType] = outer_pivots + [PivotType.CENTER]
# start from left-top, clockwise, four corner points
corner_pivots: List[PivotType] = [
    PivotType.LT,
    PivotType.RT,
    PivotType.RB,
    PivotType.LB,
]
edge_pivots: List[PivotType] = [
    PivotType.TOP,
    PivotType.RIGHT,
    PivotType.BOTTOM,
    PivotType.LEFT,
]
mid_pivots: List[PivotType] = edge_pivots + [PivotType.CENTER]


def is_close(a: float, b: float, *, atol: float = 1.0e-6, rtol: float = 1.0e-4) -> bool:
    diff = abs(a - b)
    a = max(a, 1.0e-8)
    b = max(b, 1.0e-8)
    if diff >= atol or abs(diff / a) >= rtol or abs(diff / b) >= rtol:
        return False
    return True


@dataclass
class Point:
    x: float
    y: float

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Point):
            return False
        return all(map(is_close, self.tuple, other.tuple))

    def __add__(self, other: "Point") -> "Point":
        return Point(self.x + other.x, self.y + other.y)

    def __sub__(self, other: "Point") -> "Point":
        return Point(self.x - other.x, self.y - other.y)

    def __rmatmul__(self, other: "Matrix2D") -> "Point":
        x, y = self.x, self.y
        a, b, c, d, e, f = other.tuple
        return Point(x=a * x + c * y + e, y=b * x + d * y + f)

    @property
    def tuple(self) -> Tuple[float, float]:
        return self.x, self.y

    @property
    def theta(self) -> float:
        return math.atan2(self.y, self.x)

    def rotate(self, theta: float) -> "Point":
        l = math.sqrt(self.x**2 + self.y**2)
        theta += self.theta
        return Point(l * math.cos(theta), l * math.sin(theta))

    def inside(self, box: "Matrix2D") -> bool:
        x, y = (box.inverse @ self).tuple
        return 0 <= x <= 1 and 0 <= y <= 1

    @classmethod
    def origin(cls) -> "Point":
        return cls(x=0.0, y=0.0)


@dataclass
class Line:
    start: Point
    end: Point

    def intersect(self, other: "Line", extendable: bool = False) -> Optional[Point]:
        x1, y1 = self.start.tuple
        x2, y2 = self.end.tuple
        x3, y3 = other.start.tuple
        x4, y4 = other.end.tuple
        x13 = x1 - x3
        x21 = x2 - x1
        x43 = x4 - x3
        y13 = y1 - y3
        y21 = y2 - y1
        y43 = y4 - y3
        denom = y43 * x21 - x43 * y21
        if is_close(denom, 0):
            return None
        uA = (x43 * y13 - y43 * x13) / denom
        uB = (x21 * y13 - y21 * x13) / denom
        if extendable or (0 <= uA <= 1 and 0 <= uB <= 1):
            return Point(x1 + uA * (x2 - x1), y1 + uA * (y2 - y1))
        return None

    def distance_to(self, target_line: "Line") -> float:
        x1, y1 = self.start.tuple
        x2, y2 = self.end.tuple
        x4, y4 = target_line.end.tuple
        dy = y1 - y2 or 10e-10
        k = (x1 - x2) / dy
        d = (k * (y2 - y4) + x4 - x2) / math.sqrt(1 + k**2)
        return d


class Matrix2DProperties(BaseModel):
    x: float
    y: float
    w: float
    h: float
    theta: float = 0.0
    skew_x: float = 0.0
    skew_y: float = 0.0


TMatMul = TypeVar("TMatMul", bound=Union[Point, "Matrix2D"])


class ExpandType(str, Enum):
    IOU = "iou"
    FIX_W = "fix_w"
    FIX_H = "fix_h"


@dataclass
class Box:
    left: float
    top: float
    right: float
    bottom: float


class Matrix2D(BaseModel):
    a: float
    b: float
    c: float
    d: float
    e: float
    f: float

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Matrix2D):
            return False
        return all(map(is_close, self.tuple, other.tuple))

    def __matmul__(self, other: TMatMul) -> TMatMul:
        if isinstance(other, Point):
            return other.__rmatmul__(self)  # type: ignore
        if isinstance(other, Matrix2D):
            a1, b1, c1, d1, e1, f1 = self.tuple
            a2, b2, c2, d2, e2, f2 = other.tuple
            return Matrix2D(  # type: ignore
                a=a1 * a2 + c1 * b2,
                b=b1 * a2 + d1 * b2,
                c=a1 * c2 + c1 * d2,
                d=b1 * c2 + d1 * d2,
                e=a1 * e2 + c1 * f2 + e1,
                f=b1 * e2 + d1 * f2 + f1,
            )
        msg = f"unsupported operand type(s) for @: 'Matrix2D' and '{type(other)}'"
        raise TypeError(msg)

    @property
    def tuple(self) -> Tuple[float, float, float, float, float, float]:
        return self.a, self.b, self.c, self.d, self.e, self.f

    @property
    def x(self) -> float:
        return self.e

    @property
    def y(self) -> float:
        return self.f

    @property
    def position(self) -> Point:
        return Point(self.e, self.f)

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
    def abs_wh(self) -> Tuple[float, float]:
        w, h = self.wh
        return w, abs(h)

    @property
    def wh_ratio(self) -> float:
        w, h = self.wh
        h_sign = math.copysign(1.0, h)
        return w / max(abs(h), 1.0e-12) * h_sign

    @property
    def abs_wh_ratio(self) -> float:
        w, h = self.abs_wh
        return w / max(h, 1.0e-12)

    @property
    def area(self) -> float:
        w, h = self.abs_wh
        return w * h

    @property
    def theta(self) -> float:
        return -math.atan2(self.b, self.a)

    @property
    def shear(self) -> float:
        a, b, c, d = self.a, self.b, self.c, self.d
        return math.atan2(a * c + b * d, a**2 + b**2)

    @property
    def translation(self) -> Point:
        return Point(self.e, self.f)

    @property
    def determinant(self) -> float:
        return self.a * self.d - self.b * self.c

    @property
    def matrix(self) -> "np.ndarray":
        import numpy as np

        return np.array([[self.a, self.c, self.e], [self.b, self.d, self.f]])

    @property
    def inverse(self) -> "Matrix2D":
        a, b, c, d, e, f = self.tuple
        ad = a * d
        bc = b * c
        return Matrix2D(
            a=d / (ad - bc),
            b=b / (bc - ad),
            c=c / (bc - ad),
            d=a / (ad - bc),
            e=(d * e - c * f) / (bc - ad),
            f=(b * e - a * f) / (ad - bc),
        )

    @property
    def lt(self) -> Point:
        return Point(self.e, self.f)

    @property
    def top(self) -> Point:
        return Point(0.5 * self.a + self.e, 0.5 * self.b + self.f)

    @property
    def rt(self) -> Point:
        return Point(self.a + self.e, self.b + self.f)

    @property
    def right(self) -> Point:
        return self @ Point(1.0, 0.5)

    @property
    def rb(self) -> Point:
        return self @ Point(1.0, 1.0)

    @property
    def bottom(self) -> Point:
        return self @ Point(0.5, 1.0)

    @property
    def lb(self) -> Point:
        return Point(self.c + self.e, self.d + self.f)

    @property
    def left(self) -> Point:
        return Point(0.5 * self.c + self.e, 0.5 * self.d + self.f)

    @property
    def center(self) -> Point:
        return self @ Point(0.5, 0.5)

    def pivot(self, pivot: PivotType) -> Point:
        return getattr(self, pivot.value)

    # lt -> rt -> rb -> lb
    @property
    def corner_points(self) -> List[Point]:
        return [self.pivot(pivot) for pivot in corner_pivots]

    # top -> right -> bottom -> left -> center
    @property
    def mid_points(self) -> List[Point]:
        return [self.pivot(pivot) for pivot in mid_pivots]

    # lt -> top -> rt -> right -> rb -> bottom -> lb -> left -> center
    @property
    def all_points(self) -> List[Point]:
        return [self.pivot(pivot) for pivot in all_pivots]

    # top -> right -> bottom -> left
    @property
    def edges(self) -> List[Line]:
        corners = self.corner_points
        return [Line(corner, corners[(i + 1) % 4]) for i, corner in enumerate(corners)]

    @property
    def outer_most(self) -> Box:
        import numpy as np

        corner_points = self.corner_points
        xs = np.array([point.x for point in corner_points])
        ys = np.array([point.y for point in corner_points])
        left, right = xs.min().item(), xs.max().item()
        top, bottom = ys.min().item(), ys.max().item()
        return Box(left, top, right, bottom)

    @property
    def bounding(self) -> "Matrix2D":
        box = self.outer_most
        return Matrix2D.from_properties(
            Matrix2DProperties(
                x=box.left,
                y=box.top,
                w=box.right - box.left,
                h=box.bottom - box.top,
            )
        )

    @property
    def css_property(self) -> str:
        return f"matrix({self.a},{self.b},{self.c},{self.d},{self.e},{self.f})"

    @property
    def no_move(self) -> "Matrix2D":
        return Matrix2D(a=self.a, b=self.b, c=self.c, d=self.d, e=0.0, f=0.0)

    @property
    def no_skew(self) -> "Matrix2D":
        return self @ Matrix2D.skew_matrix(-self.shear, 0.0, Point.origin())

    @property
    def no_scale(self) -> "Matrix2D":
        a, b, c, d, e, f = self.tuple
        w, h = self.wh
        return Matrix2D(a=a / w, b=b / w, c=c / h, d=d / h, e=e, f=f)

    @property
    def no_scale_but_flip(self) -> "Matrix2D":
        a, b, c, d, e, f = self.tuple
        w, h = self.abs_wh
        return Matrix2D(a=a / w, b=b / w, c=c / h, d=d / h, e=e, f=f)

    @property
    def no_rotation(self) -> "Matrix2D":
        return self.rotate(-self.theta, self.translation)

    @property
    def no_move_scale_but_flip(self) -> "Matrix2D":
        return self.no_scale_but_flip.no_move

    def scale(
        self,
        scale: float,
        scale_y: Optional[float] = None,
        center: Optional[Point] = None,
    ) -> "Matrix2D":
        if scale_y is None:
            scale_y = scale
        if center is None:
            return Matrix2D(
                a=self.a * scale,
                b=self.b * scale,
                c=self.c * scale_y,
                d=self.d * scale_y,
                e=self.e,
                f=self.f,
            )
        return Matrix2D.scale_matrix(scale, scale_y, center=center) @ self

    def scale_to(
        self,
        scale: float,
        scale_y: Optional[float] = None,
        center: Optional[Point] = None,
    ) -> "Matrix2D":
        if scale_y is None:
            scale_y = scale
        w, h = self.wh
        return self.scale(scale / w, scale_y / h, center=center)

    def flip(
        self,
        flip_x: bool,
        flip_y: bool,
        center: Optional[Point] = None,
    ) -> "Matrix2D":
        return Matrix2D.flip_matrix(flip_x, flip_y, center) @ self

    def rotate(self, theta: float, center: Optional[Point] = None) -> "Matrix2D":
        if math.isclose(theta, 0.0):
            return self.model_copy()
        return Matrix2D.rotation_matrix(theta, center) @ self

    def rotate_to(self, theta: float, center: Optional[Point] = None) -> "Matrix2D":
        return self.rotate(theta - self.theta, center)

    def move(self, point: Point) -> "Matrix2D":
        a, b, c, d, e, f = self.tuple
        return Matrix2D(a=a, b=b, c=c, d=d, e=point.x + e, f=point.y + f)

    def move_to(self, point: Point) -> "Matrix2D":
        a, b, c, d, _, _ = self.tuple
        return Matrix2D(a=a, b=b, c=c, d=d, e=point.x, f=point.y)

    def set_w(self, w: float) -> "Matrix2D":
        properties = self.decompose()
        properties.w = w
        return Matrix2D.from_properties(properties)

    def set_h(self, h: float) -> "Matrix2D":
        properties = self.decompose()
        properties.h = h
        return Matrix2D.from_properties(properties)

    def set_wh(self, w: float, h: float) -> "Matrix2D":
        properties = self.decompose()
        properties.w = w
        properties.h = h
        return Matrix2D.from_properties(properties)

    def set_wh_ratio(
        self,
        wh_ratio: float,
        *,
        type: ExpandType = ExpandType.IOU,
        pivot: PivotType = PivotType.CENTER,
    ) -> "Matrix2D":
        o_pivot = self.pivot(pivot)
        w, h = self.wh
        abs_h = abs(h)
        h_sign = math.copysign(1.0, h)
        if type == "fix_w":
            new_w = w
            new_h = h_sign * w / wh_ratio
        elif type == "fix_h":
            new_w = abs_h * wh_ratio
            new_h = h
        else:
            area = w * abs_h
            new_w = math.sqrt(area * wh_ratio)
            new_h = h_sign * area / new_w
        bbox = self.set_wh(new_w, new_h)
        delta = o_pivot - bbox.pivot(pivot)
        return bbox.move(delta)

    def decompose(self) -> Matrix2DProperties:
        w, h = self.wh
        a, b, c, d, e, f = self.tuple
        return Matrix2DProperties(
            x=e,
            y=f,
            w=w,
            h=h,
            theta=self.theta,
            skew_x=math.atan2(a * c + b * d, w**2),
        )

    @classmethod
    def skew_matrix(
        cls,
        skew_x: float,
        skew_y: float,
        center: Optional[Point] = None,
    ) -> "Matrix2D":
        center = center or Point.origin()
        tx = math.tan(skew_x)
        ty = math.tan(skew_y)
        return cls(a=1, b=ty, c=tx, d=1, e=-tx * center.y, f=-ty * center.x)

    @classmethod
    def scale_matrix(
        cls,
        w: float,
        h: float,
        center: Optional[Point] = None,
    ) -> "Matrix2D":
        center = center or Point.origin()
        return cls(a=w, b=0, c=0, d=h, e=center.x * (1 - w), f=center.y * (1 - h))

    @classmethod
    def rotation_matrix(
        cls,
        theta: float,
        center: Optional[Point] = None,
    ) -> "Matrix2D":
        center = center or Point.origin()
        sin = math.sin(theta)
        cos = math.cos(theta)
        return cls(
            a=cos,
            b=-sin,
            c=sin,
            d=cos,
            e=(1.0 - cos) * center.x - center.y * sin,
            f=(1.0 - cos) * center.y + center.x * sin,
        )

    @classmethod
    def move_matrix(cls, x: float, y: float) -> "Matrix2D":
        return cls(a=1, b=0, c=0, d=1, e=x, f=y)

    @classmethod
    def flip_matrix(
        self,
        flip_x: bool,
        flip_y: bool,
        center: Optional[Point] = None,
    ) -> "Matrix2D":
        fx = -1 if flip_x else 1
        fy = -1 if flip_y else 1
        return Matrix2D.scale_matrix(fx, fy, center)

    @classmethod
    def identical(cls) -> "Matrix2D":
        return cls(a=1, b=0, c=0, d=1, e=0, f=0)

    @classmethod
    def from_properties(cls, properties: Matrix2DProperties) -> "Matrix2D":
        return (
            cls.move_matrix(properties.x, properties.y)
            @ cls.rotation_matrix(properties.theta)
            @ cls.scale_matrix(properties.w, properties.h)
            @ cls.skew_matrix(properties.skew_x, properties.skew_y)
        )

    @classmethod
    def from_css_property(cls, css_property: str) -> "Matrix2D":
        css_property = css_property.replace("matrix(", "").replace(")", "")
        a, b, c, d, e, f = [float(x.strip()) for x in css_property.split(",")]
        return cls(a=a, b=b, c=c, d=d, e=e, f=f)

    @classmethod
    def get_bounding_of(cls, bboxes: List["Matrix2D"]) -> "Matrix2D":
        if not bboxes:
            return cls.identical()
        boxes = [bbox.outer_most for bbox in bboxes]
        lx = min(box.left for box in boxes)
        rx = max(box.right for box in boxes)
        ty = min(box.top for box in boxes)
        by = max(box.bottom for box in boxes)
        return Matrix2D.from_properties(
            Matrix2DProperties(x=lx, y=ty, w=rx - lx, h=by - ty)
        )


class HitTest:
    @staticmethod
    def line_line(a: Line, b: Line) -> bool:
        return a.intersect(b) is not None

    @staticmethod
    def line_box(a: Line, b: Matrix2D) -> bool:
        edges = b.edges
        for edge in edges:
            if HitTest.line_line(a, edge):
                return True
        return False

    @staticmethod
    def box_box(a: Matrix2D, b: Matrix2D) -> bool:
        b_edges = b.edges
        for b_edge in b_edges:
            if HitTest.line_box(b_edge, a):
                return True
        if a.position.inside(b):
            return True
        if b.position.inside(a):
            return True
        return False


__all__ = [
    "PivotType",
    "ExpandType",
    "Point",
    "Line",
    "Box",
    "Matrix2D",
    "HitTest",
]
