import math
import base64

from io import BytesIO
from typing import Tuple
from typing import Union
from typing import Optional
from typing import NamedTuple
from typing import TYPE_CHECKING
from dataclasses import dataclass

from .array import to_torch
from .types import TArray
from .types import arr_type
from .geometry import is_close
from .geometry import Matrix2D
from .geometry import Matrix2DProperties

if TYPE_CHECKING:
    from PIL import Image
    from numpy import ndarray
    from PIL.Image import Image as TImage


class ReadImageResponse(NamedTuple):
    image: "ndarray"
    alpha: Optional["ndarray"]
    original: "TImage"
    anchored: "TImage"
    to_masked: Optional["TImage"]
    original_size: Tuple[int, int]
    anchored_size: Tuple[int, int]


def to_rgb(image: "TImage", color: Tuple[int, int, int] = (255, 255, 255)) -> "TImage":
    from PIL import Image

    if image.mode == "CMYK":
        return image.convert("RGB")
    split = image.split()
    if len(split) < 4:
        return image.convert("RGB")
    background = Image.new("RGB", image.size, color)
    background.paste(image, mask=split[3])
    return background


def to_uint8(normalized_img: TArray) -> TArray:
    import torch
    import numpy as np

    if isinstance(normalized_img, np.ndarray):
        return (np.clip(normalized_img * 255.0, 0.0, 255.0)).astype(np.uint8)  # type: ignore
    return torch.clamp(normalized_img * 255.0, 0.0, 255.0).to(torch.uint8)


def to_alpha_channel(image: "TImage") -> "TImage":
    if image.mode == "RGBA":
        return image.split()[3]
    return image.convert("L")


def np_to_bytes(img_arr: "ndarray") -> bytes:
    import numpy as np
    from PIL import Image

    if img_arr.dtype != np.uint8:
        img_arr = to_uint8(img_arr)
    bytes_io = BytesIO()
    Image.fromarray(img_arr).save(bytes_io, format="PNG")
    return bytes_io.getvalue()


def restrict_wh(w: int, h: int, max_wh: int) -> Tuple[int, int]:
    max_original_wh = max(w, h)
    if max_original_wh <= max_wh:
        return w, h
    wh_ratio = w / h
    if wh_ratio >= 1:
        return max_wh, round(max_wh / wh_ratio)
    return round(max_wh * wh_ratio), max_wh


def get_suitable_size(n: int, anchor: int) -> int:
    if n <= anchor:
        return anchor
    mod = n % anchor
    return n - mod + int(mod > 0.5 * anchor) * anchor


def read_image(
    image: Union[str, "TImage"],
    max_wh: Optional[int],
    *,
    anchor: Optional[int],
    to_gray: bool = False,
    to_mask: bool = False,
    resample: "Image.Resampling" = "auto",
    normalize: bool = True,
    to_torch_fmt: bool = True,
) -> ReadImageResponse:
    import numpy as np
    from PIL import Image

    if isinstance(image, str):
        image = Image.open(image)
    alpha = None
    original = image
    if image.mode == "RGBA":
        alpha = image.split()[3]
    if not to_mask and not to_gray:
        image = to_rgb(image)
    else:
        if to_mask and to_gray:
            raise ValueError("`to_mask` & `to_gray` should not be True simultaneously")
        if to_mask and image.mode == "RGBA":
            image = alpha
        else:
            image = image.convert("L")
    original_w, original_h = image.size
    to_masked = image if to_mask else None
    if max_wh is None:
        w, h = original_w, original_h
    else:
        w, h = restrict_wh(original_w, original_h, max_wh)
    if anchor is not None:
        w, h = map(get_suitable_size, (w, h), (anchor, anchor))
    if w != original_w or h != original_h:
        if resample == "auto":
            resample = Image.Resampling.LANCZOS
        image = image.resize((w, h), resample=resample)
    anchored = image
    anchored_size = w, h
    image = np.array(image)
    if normalize:
        image = image.astype(np.float32) / 255.0
    if alpha is not None:
        alpha = np.array(alpha)[None, None]
        if normalize:
            alpha = alpha.astype(np.float32) / 255.0
    if to_torch_fmt:
        if to_mask or to_gray:
            image = image[None, None]
        else:
            image = image[None].transpose(0, 3, 1, 2)
    return ReadImageResponse(
        image,
        alpha,
        original,
        anchored,
        to_masked,
        (original_w, original_h),
        anchored_size,
    )


def save_images(arr: arr_type, path: str, n_row: Optional[int] = None) -> None:
    import torchvision
    import numpy as np

    if isinstance(arr, np.ndarray):
        arr = to_torch(arr)
    if n_row is None:
        n_row = math.ceil(math.sqrt(len(arr)))
    torchvision.utils.save_image(arr, path, normalize=True, nrow=n_row)


def to_base64(image: "TImage") -> str:
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"


def from_base64(base64_string: str) -> "TImage":
    from PIL import Image

    base64_string = base64_string.split("base64,")[1]
    return Image.open(BytesIO(base64.b64decode(base64_string)))


@dataclass
class ImageBox:
    l: int
    t: int
    r: int
    b: int

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ImageBox):
            return False
        return all(map(is_close, self.tuple, other.tuple))

    @property
    def w(self) -> int:
        return self.r - self.l

    @property
    def h(self) -> int:
        return self.b - self.t

    @property
    def wh_ratio(self) -> float:
        return self.w / self.h

    @property
    def tuple(self) -> Tuple[int, int, int, int]:
        return self.l, self.t, self.r, self.b

    @property
    def matrix(self) -> Matrix2D:
        return Matrix2D.from_properties(
            Matrix2DProperties(x=self.l, y=self.t, w=self.w, h=self.h)
        )

    def copy(self) -> "ImageBox":
        return ImageBox(*self.tuple)

    def crop(self, image: TArray) -> TArray:
        return image[self.t : self.b + 1, self.l : self.r + 1]  # type: ignore

    def pad(
        self,
        padding: int,
        *,
        w: Optional[int] = None,
        h: Optional[int] = None,
    ) -> "ImageBox":
        l, t, r, b = self.tuple
        l = max(0, l - padding)
        r += padding
        if w is not None:
            r = min(r, w)
        t = max(0, t - padding)
        b += padding
        if h is not None:
            b = min(b, h)
        return ImageBox(l, t, r, b)

    def to_square(
        self,
        *,
        w: Optional[int] = None,
        h: Optional[int] = None,
        expand: bool = True,
    ) -> "ImageBox":
        l, t, r, b = self.tuple
        bw, bh = r - l, b - t
        diff = abs(bw - bh)
        if diff == 0:
            return self.copy()
        if expand:
            if bw > bh:
                t = max(0, t - diff // 2)
                b = t + bw
                if h is not None:
                    b = min(b, h)
            else:
                l = max(0, l - diff // 2)
                r = l + bh
                if w is not None:
                    r = min(r, w)
        else:
            if bw > bh:
                l += diff // 2
                r = l + bh
                if w is not None:
                    r = min(r, w)
            else:
                t += diff // 2
                b = t + bw
                if h is not None:
                    b = min(b, h)
        return ImageBox(l, t, r, b)

    @classmethod
    def from_mask(cls, uint8_mask: "ndarray", threshold: int = 0) -> "ImageBox":
        import numpy as np

        ys, xs = np.where(uint8_mask > threshold)
        ys, xs = np.where(uint8_mask)
        if len(ys) == 0:
            return cls(0, 0, 0, 0)
        return cls(xs.min().item(), ys.min().item(), xs.max().item(), ys.max().item())
