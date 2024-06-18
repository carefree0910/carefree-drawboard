import math

from typing import Any
from typing import Dict
from typing import List
from typing import Tuple
from typing import Union
from typing import Callable
from typing import Optional
from typing import NamedTuple
from typing import TYPE_CHECKING
from collections import Counter

from .misc import to_path
from .misc import random_hash
from .misc import get_file_size
from .misc import timeit
from .types import TPath
from .types import TArray
from .types import arr_type
from .types import tensor_dict_type

if TYPE_CHECKING:
    import torch
    import numpy as np


def is_int(arr: arr_type) -> bool:
    import torch
    import numpy as np

    if isinstance(arr, (np.ndarray, np.number)):
        return np.issubdtype(arr.dtype, np.integer)
    return not torch.is_floating_point(arr) and not torch.is_complex(arr)


def is_float(arr: arr_type) -> bool:
    import torch
    import numpy as np

    if isinstance(arr, (np.ndarray, np.number)):
        return np.issubdtype(arr.dtype, np.floating)
    return torch.is_floating_point(arr)


def is_string(arr: arr_type) -> bool:
    import numpy as np

    if isinstance(arr, (np.ndarray, np.character)):
        return np.issubdtype(arr.dtype, str)
    return False


def is_real_numeric(arr: arr_type) -> bool:
    return is_float(arr) or is_int(arr)


def sigmoid(arr: TArray) -> TArray:
    import torch
    import numpy as np

    if isinstance(arr, np.ndarray):
        return 1.0 / (1.0 + np.exp(-arr))
    return torch.sigmoid(arr)


def softmax(arr: TArray) -> TArray:
    import numpy as np
    import torch.nn.functional as F

    if isinstance(arr, np.ndarray):
        logits = arr - np.max(arr, axis=1, keepdims=True)
        exp = np.exp(logits)
        return exp / exp.sum(1, keepdims=True)
    return F.softmax(arr, dim=1)


def l2_normalize(arr: TArray) -> TArray:
    import numpy as np

    if isinstance(arr, np.ndarray):
        return arr / np.linalg.norm(arr, axis=-1, keepdims=True)
    return arr / arr.norm(dim=-1, keepdim=True)  # type: ignore


def normalize(
    arr: TArray,
    *,
    global_norm: bool = True,
    return_stats: bool = False,
    eps: float = 1.0e-8,
) -> Union[TArray, Tuple[TArray, Dict[str, Any]]]:
    import torch
    import numpy as np

    if global_norm:
        arr_mean, arr_std = arr.mean().item(), arr.std().item()
        arr_std = max(eps, arr_std)
        out = (arr - arr_mean) / arr_std
        if not return_stats:
            return out
        return out, dict(mean=arr_mean, std=arr_std)
    if isinstance(arr, np.ndarray):
        arr_mean, arr_std = arr.mean(axis=0), arr.std(axis=0)
        std = np.maximum(eps, arr_std)
    else:
        arr_mean, arr_std = arr.mean(dim=0), arr.std(dim=0)  # type: ignore
        std = torch.clip(arr_std, min=eps)
    out = (arr - arr_mean) / std
    if not return_stats:
        return out
    return out, dict(mean=arr_mean.tolist(), std=std.tolist())


def normalize_from(arr: TArray, stats: Dict[str, Any]) -> TArray:
    mean, std = stats["mean"], stats["std"]
    return (arr - mean) / std


def recover_normalize_from(arr: TArray, stats: Dict[str, Any]) -> TArray:
    mean, std = stats["mean"], stats["std"]
    return arr * std + mean


def min_max_normalize(
    arr: TArray,
    *,
    global_norm: bool = True,
    return_stats: bool = False,
    eps: float = 1.0e-8,
) -> Union[TArray, Tuple[TArray, Dict[str, Any]]]:
    import torch
    import numpy as np

    if global_norm:
        arr_min, arr_max = arr.min().item(), arr.max().item()
        diff = max(eps, arr_max - arr_min)
        out = (arr - arr_min) / diff
        if not return_stats:
            return out
        return out, dict(min=arr_min, diff=diff)
    if isinstance(arr, np.ndarray):
        arr_min, arr_max = arr.min(axis=0), arr.max(axis=0)
        diff = np.maximum(eps, arr_max - arr_min)
    else:
        arr_min, arr_max = arr.min(dim=0).values, arr.max(dim=0).values  # type: ignore
        diff = torch.clip(arr_max - arr_min, min=eps)
    out = (arr - arr_min) / diff
    if not return_stats:
        return out
    return out, dict(min=arr_min.tolist(), diff=diff.tolist())


def min_max_normalize_from(arr: TArray, stats: Dict[str, Any]) -> TArray:
    arr_min, diff = stats["min"], stats["diff"]
    return (arr - arr_min) / diff


def recover_min_max_normalize_from(arr: TArray, stats: Dict[str, Any]) -> TArray:
    arr_min, diff = stats["min"], stats["diff"]
    return arr * diff + arr_min


def quantile_normalize(
    arr: TArray,
    *,
    q: float = 0.01,
    global_norm: bool = True,
    return_stats: bool = False,
    eps: float = 1.0e-8,
) -> Union[TArray, Tuple[TArray, Dict[str, Any]]]:
    import torch
    import numpy as np

    # quantiles
    if isinstance(arr, np.ndarray):
        kw = {"axis": 0}
        quantile_fn = np.quantile
    else:
        kw = {"dim": 0}
        quantile_fn = torch.quantile
    if global_norm:
        arr_min = quantile_fn(arr, q)
        arr_max = quantile_fn(arr, 1.0 - q)
    else:
        arr_min = quantile_fn(arr, q, **kw)  # type: ignore
        arr_max = quantile_fn(arr, 1.0 - q, **kw)  # type: ignore
    # diff
    if global_norm:
        diff = max(eps, arr_max - arr_min)
    else:
        if isinstance(arr, np.ndarray):
            diff = np.maximum(eps, arr_max - arr_min)
        else:
            diff = torch.clip(arr_max - arr_min, min=eps)
    arr = arr.clip(arr_min, arr_max)
    out = (arr - arr_min) / diff
    if not return_stats:
        return out
    if not global_norm:
        arr_min = arr_min.item()
        diff = diff.item()
    else:
        arr_min = arr_min.tolist()
        diff = diff.tolist()
    return out, dict(min=arr_min, diff=diff)


def quantile_normalize_from(arr: TArray, stats: Dict[str, Any]) -> TArray:
    arr_min, diff = stats["min"], stats["diff"]
    return (arr - arr_min) / diff


def recover_quantile_normalize_from(arr: TArray, stats: Dict[str, Any]) -> TArray:
    arr_min, diff = stats["min"], stats["diff"]
    return arr * diff + arr_min


def clip_normalize(arr: TArray) -> TArray:
    import torch
    import numpy as np

    fn = np if isinstance(arr, np.ndarray) else torch
    if arr.dtype == fn.uint8:
        return arr
    return fn.clip(arr, 0.0, 1.0)


# will return at least 2d
def squeeze(arr: TArray) -> TArray:
    n = arr.shape[0]
    arr = arr.squeeze()  # type: ignore
    if n == 1:
        arr = arr[None, ...]  # type: ignore
    return arr


def to_standard(arr: "np.ndarray") -> "np.ndarray":
    import numpy as np

    if is_int(arr):
        arr = arr.astype(np.int64)
    elif is_float(arr):
        arr = arr.astype(np.float32)
    return arr


def to_torch(arr: "np.ndarray") -> "torch.Tensor":
    import torch

    return torch.from_numpy(to_standard(arr))


def to_numpy(tensor: "torch.Tensor") -> "np.ndarray":
    return tensor.detach().cpu().numpy()


def to_device(
    batch: tensor_dict_type,
    device: Optional["torch.device"],
    **kwargs: Any,
) -> tensor_dict_type:
    import torch

    def to(v: Any) -> Any:
        if isinstance(v, torch.Tensor):
            return v.to(device, **kwargs)
        if isinstance(v, dict):
            return {vk: to(vv) for vk, vv in v.items()}
        if isinstance(v, list):
            return [to(vv) for vv in v]
        return v

    if device is None:
        return batch
    return {k: to(v) for k, v in batch.items()}


def iou(logits: TArray, labels: TArray) -> TArray:
    import numpy as np

    is_numpy = isinstance(logits, np.ndarray)
    num_classes = logits.shape[1]
    if num_classes == 1:
        heat_map = sigmoid(logits)
    elif num_classes == 2:
        heat_map = softmax(logits)[:, [1]]  # type: ignore
    else:
        raise ValueError("`IOU` only supports binary situations")
    intersect = heat_map * labels
    union = heat_map + labels - intersect
    kwargs = {"axis" if is_numpy else "dim": tuple(range(1, len(intersect.shape)))}
    return intersect.sum(**kwargs) / union.sum(**kwargs)


def corr(
    predictions: TArray,
    target: TArray,
    weights: Optional[TArray] = None,
    *,
    get_diagonal: bool = False,
    eps: float = 1.0e-8,
) -> TArray:
    import torch
    import numpy as np

    is_numpy = isinstance(predictions, np.ndarray)
    keepdim_kw: Dict[str, Any] = {"keepdims" if is_numpy else "keepdim": True}
    norm_fn = np.linalg.norm if is_numpy else torch.norm
    matmul_fn = np.matmul if is_numpy else torch.matmul
    sqrt_fn = np.sqrt if is_numpy else torch.sqrt
    transpose_fn = np.transpose if is_numpy else torch.t

    w_sum = 0.0 if weights is None else weights.sum().item()
    if weights is None:
        mean = predictions.mean(0, **keepdim_kw)
    else:
        mean = (predictions * weights).sum(0, **keepdim_kw) / w_sum
    vp = predictions - mean
    if weights is None:
        kw = keepdim_kw.copy()
        kw["axis" if is_numpy else "dim"] = 0
        vp_norm = norm_fn(vp, 2, **kw)
    else:
        vp_norm = sqrt_fn((weights * (vp**2)).sum(0, **keepdim_kw))
    if predictions is target:
        vp_norm_t = transpose_fn(vp_norm)
        if weights is None:
            mat = matmul_fn(transpose_fn(vp), vp) / (vp_norm * vp_norm_t)
        else:
            mat = matmul_fn(transpose_fn(weights * vp), vp) / (vp_norm * vp_norm_t)
    else:
        if weights is None:
            target_mean = target.mean(0, **keepdim_kw)
        else:
            target_mean = (target * weights).sum(0, **keepdim_kw) / w_sum
        vt = transpose_fn(target - target_mean)
        if weights is None:
            kw = keepdim_kw.copy()
            kw["axis" if is_numpy else "dim"] = 1
            vt_norm = norm_fn(vt, 2, **kw)
        else:
            vt_norm = sqrt_fn((transpose_fn(weights) * (vt**2)).sum(1, **keepdim_kw))
        if weights is None:
            mat = matmul_fn(vt, vp) / (vp_norm * vt_norm + eps)
        else:
            mat = matmul_fn(vt, weights * vp) / (vp_norm * vt_norm + eps)
    if not get_diagonal:
        return mat
    if mat.shape[0] != mat.shape[1]:
        raise ValueError(
            "`get_diagonal` is set to True but the correlation matrix "
            "is not a squared matrix, which is an invalid condition"
        )
    return np.diag(mat) if is_numpy else mat.diag()


def get_one_hot(feature: Union[list, "np.ndarray"], dim: int) -> "np.ndarray":
    """
    Get one-hot representation.

    Parameters
    ----------
    feature : array-like, source data of one-hot representation.
    dim : int, dimension of the one-hot representation.

    Returns
    -------
    one_hot : np.ndarray, one-hot representation of `feature`

    """

    import numpy as np

    one_hot = np.zeros([len(feature), dim], np.int64)
    one_hot[range(len(one_hot)), np.asarray(feature, np.int64).ravel()] = 1
    return one_hot


def get_indices_from_another(
    base: "np.ndarray",
    segment: "np.ndarray",
    *,
    already_sorted: bool = False,
) -> "np.ndarray":
    """
    Get `segment` elements' indices in `base`.

    Warnings
    ----------
    All elements in segment should appear in base to ensure validity.

    Parameters
    ----------
    base : np.ndarray, base array.
    segment : np.ndarray, segment array.
    already_sorted : bool, whether `base` is already sorted.

    Returns
    -------
    indices : np.ndarray, positions where elements in `segment` appear in `base`

    Examples
    -------
    >>> import numpy as np
    >>> base, segment = np.arange(100), np.random.permutation(100)[:10]
    >>> assert np.allclose(get_indices_from_another(base, segment), segment)

    """

    import numpy as np

    if already_sorted:
        return np.searchsorted(base, segment)
    base_sorted_args = np.argsort(base)
    positions = np.searchsorted(base[base_sorted_args], segment)
    return base_sorted_args[positions]


class UniqueIndices(NamedTuple):
    """
    unique           : np.ndarray, unique values of the given array (`arr`).
    unique_cnt       : np.ndarray, counts of each unique value.
    sorting_indices  : np.ndarray, indices which can (stably) sort the given
                                   array by its value.
    split_arr        : np.ndarray, array which can split the `sorting_indices`
                                   to make sure that. Each portion of the split
                                   indices belong & only belong to one of the
                                   unique values.
    """

    unique: "np.ndarray"
    unique_cnt: "np.ndarray"
    sorting_indices: "np.ndarray"
    split_arr: "np.ndarray"

    @property
    def split_indices(self) -> List["np.ndarray"]:
        import numpy as np

        return np.split(self.sorting_indices, self.split_arr)


def get_unique_indices(arr: "np.ndarray") -> UniqueIndices:
    """
    Get indices for unique values of an array.

    Parameters
    ----------
    arr : np.ndarray, target array which we wish to find indices of each unique value.

    Returns
    -------
    UniqueIndices

    Examples
    -------
    >>> import numpy as np
    >>> arr = np.array([1, 2, 3, 2, 4, 1, 0, 1], np.int64)
    >>> # UniqueIndices(
    >>> #   unique          = array([0, 1, 2, 3, 4], dtype=int64),
    >>> #   unique_cnt      = array([1, 3, 2, 1, 1], dtype=int64),
    >>> #   sorting_indices = array([6, 0, 5, 7, 1, 3, 2, 4], dtype=int64),
    >>> #   split_arr       = array([1, 4, 6, 7], dtype=int64))
    >>> #   split_indices   = [array([6], dtype=int64), array([0, 5, 7], dtype=int64),
    >>> #                      array([1, 3], dtype=int64), array([2], dtype=int64),
    >>> #                      array([4], dtype=int64)]
    >>> print(get_unique_indices(arr))

    """

    import numpy as np

    unique, unique_inv, unique_cnt = np.unique(
        arr,
        return_inverse=True,
        return_counts=True,
    )
    sorting_indices, split_arr = (
        np.argsort(unique_inv, kind="mergesort"),
        np.cumsum(unique_cnt)[:-1],
    )
    return UniqueIndices(unique, unique_cnt, sorting_indices, split_arr)


def get_counter_from_arr(arr: "np.ndarray") -> Counter:
    """
    Get `Counter` of an array.

    Parameters
    ----------
    arr : np.ndarray, target array which we wish to get `Counter` from.

    Returns
    -------
    Counter

    Examples
    -------
    >>> import numpy as np
    >>> arr = np.array([1, 2, 3, 2, 4, 1, 0, 1], np.int64)
    >>> # Counter({1: 3, 2: 2, 0: 1, 3: 1, 4: 1})
    >>> print(get_counter_from_arr(arr))

    """

    import numpy as np

    return Counter(dict(zip(*np.unique(arr, return_counts=True))))


def allclose(*arrays: "np.ndarray", **kwargs: Any) -> bool:
    """
    Perform `np.allclose` to `arrays` one by one.

    Parameters
    ----------
    arrays : np.ndarray, target arrays.
    **kwargs : keyword arguments which will be passed into `np.allclose`.

    Returns
    -------
    allclose : bool

    """

    import numpy as np

    for i, arr in enumerate(arrays[:-1]):
        if not np.allclose(arr, arrays[i + 1], **kwargs):
            return False
    return True


class StrideArray:
    def __init__(
        self,
        arr: "np.ndarray",
        *,
        copy: bool = False,
        writable: Optional[bool] = None,
    ):
        self.arr = arr
        self.shape = arr.shape
        self.num_dim = len(self.shape)
        self.strides = arr.strides
        self.copy = copy
        if writable is None:
            writable = copy
        self.writable = writable

    def __str__(self) -> str:
        return self.arr.__str__()

    def __repr__(self) -> str:
        return self.arr.__repr__()

    def _construct(
        self,
        shapes: Tuple[int, ...],
        strides: Tuple[int, ...],
    ) -> "np.ndarray":
        from numpy.lib.stride_tricks import as_strided

        arr = self.arr.copy() if self.copy else self.arr
        return as_strided(
            arr,
            shape=shapes,
            strides=strides,
            writeable=self.writable,
        )

    @staticmethod
    def _get_output_dim(in_dim: int, window: int, stride: int) -> int:
        return (in_dim - window) // stride + 1

    def roll(self, window: int, *, axis: int, stride: int = 1) -> "np.ndarray":
        while axis < 0:
            axis += self.num_dim
        target_dim = self.shape[axis]
        rolled_dim = self._get_output_dim(target_dim, window, stride)
        if rolled_dim <= 0:
            msg = f"window ({window}) is too large for target dimension ({target_dim})"
            raise ValueError(msg)
        # shapes
        rolled_shapes = tuple(self.shape[:axis]) + (rolled_dim, window)
        if axis < self.num_dim - 1:
            rolled_shapes = rolled_shapes + self.shape[axis + 1 :]
        # strides
        previous_strides = tuple(self.strides[:axis])
        target_stride = (self.strides[axis] * stride,)
        latter_strides = tuple(self.strides[axis:])
        rolled_strides = previous_strides + target_stride + latter_strides
        # construct
        return self._construct(rolled_shapes, rolled_strides)

    def patch(
        self,
        patch_w: int,
        patch_h: Optional[int] = None,
        *,
        h_stride: int = 1,
        w_stride: int = 1,
        h_axis: int = -2,
    ) -> "np.ndarray":
        if self.num_dim < 2:
            raise ValueError("`patch` requires input with at least 2d")
        while h_axis < 0:
            h_axis += self.num_dim
        w_axis = h_axis + 1
        if patch_h is None:
            patch_h = patch_w
        h_shape, w_shape = self.shape[h_axis], self.shape[w_axis]
        if h_shape < patch_h:
            msg = f"patch_h ({patch_h}) is too large for target dimension ({h_shape})"
            raise ValueError(msg)
        if w_shape < patch_w:
            msg = f"patch_w ({patch_w}) is too large for target dimension ({w_shape})"
            raise ValueError(msg)
        # shapes
        patched_h_dim = self._get_output_dim(h_shape, patch_h, h_stride)
        patched_w_dim = self._get_output_dim(w_shape, patch_w, w_stride)
        patched_dim: Tuple[int, ...]
        patched_dim = (patched_h_dim, patched_w_dim)
        patched_dim = patched_dim + (patch_h, patch_w)
        patched_shapes = tuple(self.shape[:h_axis]) + patched_dim
        if w_axis < self.num_dim - 1:
            patched_shapes = patched_shapes + self.shape[w_axis + 1 :]
        # strides
        arr_h_stride, arr_w_stride = self.strides[h_axis], self.strides[w_axis]
        previous_strides = tuple(self.strides[:h_axis])
        target_stride: Tuple[int, ...]
        target_stride = (arr_h_stride * h_stride, arr_w_stride * w_stride)
        target_stride = target_stride + (arr_h_stride, arr_w_stride)
        latter_strides = tuple(self.strides[w_axis + 1 :])
        patched_strides = previous_strides + target_stride + latter_strides
        # construct
        return self._construct(patched_shapes, patched_strides)

    def repeat(self, k: int, axis: int = -1) -> "np.ndarray":
        while axis < 0:
            axis += self.num_dim
        target_dim = self.shape[axis]
        if target_dim != 1:
            raise ValueError("`repeat` can only be applied on axis with dim == 1")
        # shapes
        repeated_shapes = tuple(self.shape[:axis]) + (k,)
        if axis < self.num_dim - 1:
            repeated_shapes = repeated_shapes + self.shape[axis + 1 :]
        # strides
        previous_strides = tuple(self.strides[:axis])
        target_stride = (0,)
        latter_strides = tuple(self.strides[axis + 1 :])
        repeated_strides = previous_strides + target_stride + latter_strides
        # construct
        return self._construct(repeated_shapes, repeated_strides)


class SharedArray:
    value: "np.ndarray"

    def __init__(
        self,
        name: str,
        dtype: Union[type, "np.dtype"],
        shape: Union[List[int], Tuple[int, ...]],
        *,
        create: bool = True,
        data: Optional["np.ndarray"] = None,
    ):
        import numpy as np
        from multiprocessing.shared_memory import SharedMemory

        self.name = name
        self.dtype = dtype
        self.shape = shape
        if create:
            d_size = np.dtype(dtype).itemsize * np.prod(shape).item()
            self._shm = SharedMemory(name, create=True, size=int(round(d_size)))
        else:
            if data is not None:
                raise ValueError("`data` should not be provided when `create` is False")
            self._shm = SharedMemory(name)
        self.value = np.ndarray(shape=shape, dtype=dtype, buffer=self._shm.buf)
        if data is not None:
            self.value[:] = data[:]

    def close(self) -> None:
        self._shm.close()

    def destroy(self) -> None:
        self._shm.close()
        self._shm.unlink()

    @classmethod
    def from_data(cls, data: "np.ndarray") -> "SharedArray":
        return cls(random_hash()[:16], data.dtype, data.shape, data=data)


def to_labels(logits: "np.ndarray", threshold: Optional[float] = None) -> "np.ndarray":
    # binary classification
    if logits.shape[-1] == 2:
        logits = logits[..., [1]] - logits[..., [0]]
    if logits.shape[-1] == 1:
        if threshold is None:
            threshold = 0.5
        logit_threshold = math.log(threshold / (1.0 - threshold))
        return (logits > logit_threshold).astype(int)
    return logits.argmax(1)[..., None]


def get_full_logits(logits: "np.ndarray") -> "np.ndarray":
    import numpy as np

    # binary classification
    if logits.shape[-1] == 1:
        logits = np.concatenate([-logits, logits], axis=-1)
    return logits


def make_grid(arr: arr_type, n_row: Optional[int] = None) -> "torch.Tensor":
    import torchvision
    import numpy as np

    if isinstance(arr, np.ndarray):
        arr = to_torch(arr)
    if n_row is None:
        n_row = math.ceil(math.sqrt(len(arr)))
    return torchvision.utils.make_grid(arr, n_row)


class NpSafeSerializer:
    size_file = "size.txt"
    array_file = "array.npy"

    @classmethod
    def save(
        cls,
        folder: TPath,
        data: Union["np.ndarray", Callable[[], "np.ndarray"]],
        *,
        verbose: bool = True,
    ) -> None:
        import numpy as np
        from filelock import FileLock

        folder = to_path(folder)
        with FileLock(folder / "NpSafeSerializer.lock", timeout=30000):
            if cls.try_load(folder, no_load=True) is None:
                folder.mkdir(parents=True, exist_ok=True)
                array_path = folder / cls.array_file
                with timeit(f"save '{folder}'", enabled=verbose):
                    if not isinstance(data, np.ndarray):
                        data = data()
                    np.save(array_path, data)
                    with (folder / cls.size_file).open("w") as f:
                        f.write(str(get_file_size(array_path)))

    @classmethod
    def load(cls, folder: TPath, *, mmap_mode: Optional[str] = None) -> "np.ndarray":
        import numpy as np

        return np.load(to_path(folder) / cls.array_file, mmap_mode=mmap_mode)  # type: ignore

    @classmethod
    def try_load(
        cls,
        folder: TPath,
        *,
        mmap_mode: Optional[str] = None,
        no_load: bool = False,
        **kwargs: Any,
    ) -> Optional["np.ndarray"]:
        import numpy as np

        folder = to_path(folder)
        array_path = folder / cls.array_file
        if not array_path.exists():
            return None
        size_path = folder / cls.size_file
        if not size_path.is_file():
            return None
        with (folder / cls.size_file).open("r") as f:
            try:
                size = int(f.read().strip())
            except ValueError:
                return None
        if size != get_file_size(array_path):
            return None
        if no_load:
            return np.zeros(0)
        return np.load(array_path, mmap_mode=mmap_mode, **kwargs)  # type: ignore

    @classmethod
    def load_with(
        cls,
        folder: TPath,
        init_fn: Callable[[], "np.ndarray"],
        *,
        mmap_mode: Optional[str] = None,
        no_load: bool = False,
        verbose: bool = True,
        **kwargs: Any,
    ) -> "np.ndarray":
        """
        This method uses `FileLock` to ensure that only one rank will save the array.
        > It will also ensure that all ranks will load the array after it's saved. The load
        procedure will even be executed on the rank that saved the array in order to make
        use of the `mmap_mode` feature at the first time.
        """

        load_func = lambda: cls.try_load(
            folder,
            mmap_mode=mmap_mode,
            no_load=no_load,
            **kwargs,
        )
        array = load_func()
        if array is None:
            folder = to_path(folder)
            folder.mkdir(parents=True, exist_ok=True)
            cls.save(folder, init_fn, verbose=verbose)
            array = load_func()
            if array is None:
                raise RuntimeError(f"failed to load array from '{folder}'")
        return array

    @classmethod
    def cleanup(cls, folder: TPath) -> None:
        from filelock import FileLock

        folder = to_path(folder)
        with FileLock(folder / "NpSafeSerializer.lock", timeout=30000):
            (folder / cls.array_file).unlink(missing_ok=True)
            (folder / cls.size_file).unlink(missing_ok=True)
