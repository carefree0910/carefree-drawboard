import os
import sys
import json
import math
import time
import random
import shutil
import decimal
import inspect
import hashlib
import operator
import unicodedata

from abc import abstractmethod
from abc import ABC
from abc import ABCMeta
from typing import Any
from typing import Set
from typing import Dict
from typing import List
from typing import Type
from typing import Tuple
from typing import Union
from typing import Generic
from typing import TypeVar
from typing import Callable
from typing import Iterable
from typing import Optional
from typing import Protocol
from typing import Coroutine
from typing import NamedTuple
from typing import TYPE_CHECKING
from typing import ContextManager
from pathlib import Path
from argparse import Namespace
from datetime import datetime
from datetime import timedelta
from functools import reduce
from collections import OrderedDict
from dataclasses import asdict
from dataclasses import fields
from dataclasses import dataclass
from dataclasses import is_dataclass
from dataclasses import Field

from . import console
from .types import TPath
from .types import TConfig
from .types import arr_type
from .types import np_dict_type
from .constants import TIME_FORMAT

if TYPE_CHECKING:
    from accelerate import InitProcessGroupKwargs


# torch distributed utils


@dataclass
class DDPInfo:
    """
    A dataclass for storing Distributed Data Parallel (DDP) information.

    Attributes
    ----------
    rank : int
        The rank of the current process in the DDP group.
    world_size : int
        The total number of processes in the DDP group.
    local_rank : int
        The rank of the current process within its machine.

    """

    rank: int
    world_size: int
    local_rank: int


def get_ddp_info() -> Optional[DDPInfo]:
    """
    Get DDP information from the environment variables.

    Returns
    -------
    Optional[DDPInfo]
        The DDP information if the relevant environment variables are set, otherwise None.

    Examples
    --------
    >>> get_ddp_info()

    """

    if "RANK" in os.environ and "WORLD_SIZE" in os.environ:
        rank = int(os.environ["RANK"])
        world_size = int(os.environ["WORLD_SIZE"])
        local_rank = int(os.environ["LOCAL_RANK"])
        return DDPInfo(rank, world_size, local_rank)
    return None


def is_ddp() -> bool:
    return get_ddp_info() is not None


def is_rank_0() -> bool:
    """
    Check if the rank is 0.

    Returns
    -------
    bool
        True if the rank is 0 or DDP is not being used, False otherwise.

    Examples
    --------
    >>> is_rank_0()
    True

    """

    ddp_info = get_ddp_info()
    return ddp_info is None or ddp_info.rank == 0


def is_local_rank_0() -> bool:
    """
    Check if the local rank is 0.

    Returns
    -------
    bool
        True if the local rank is 0 or DDP is not being used, False otherwise.

    Examples
    --------
    >>> is_local_rank_0()
    True

    """

    ddp_info = get_ddp_info()
    return ddp_info is None or ddp_info.local_rank == 0


def get_world_size() -> int:
    """
    Get the world size.

    Returns
    -------
    int
        The world size if DDP is being used, otherwise 1.

    Examples
    --------
    >>> get_world_size()
    1

    """

    ddp_info = get_ddp_info()
    return 1 if ddp_info is None else ddp_info.world_size


def is_dist_initialized() -> bool:
    import torch.distributed as dist

    return dist.is_initialized()


def is_fsdp() -> bool:
    from accelerate import PartialState
    from accelerate import DistributedType

    if not is_dist_initialized():
        return False
    return PartialState().distributed_type == DistributedType.FSDP


def init_process_group(*, cpu: bool, handler: "InitProcessGroupKwargs") -> None:
    from accelerate import PartialState

    PartialState(cpu, **handler.to_kwargs())


def wait_for_everyone() -> None:
    from accelerate.utils import wait_for_everyone as accelerate_wait

    if is_dist_initialized():
        accelerate_wait()


# util functions


T = TypeVar("T")
FAny = TypeVar("FAny", bound=Callable[..., Any])
FNone = TypeVar("FNone", bound=Callable[..., None])
T_co = TypeVar("T_co", covariant=True)
TDict = TypeVar("TDict", bound="dict")
TRetryResponse = TypeVar("TRetryResponse")
TFutureResponse = TypeVar("TFutureResponse")


class Fn(Protocol[T_co]):
    def __call__(self, *args: Any, **kwargs: Any) -> T_co:
        pass


def walk(
    root: str,
    hierarchy_callback: Callable[[List[str], str], None],
    filter_extensions: Optional[Set[str]] = None,
) -> None:
    from tqdm import tqdm

    walked = list(os.walk(root))
    for folder, _, files in tqdm(walked, desc="folders", position=0, mininterval=1):
        for file in tqdm(files, desc="files", position=1, leave=False, mininterval=1):
            if filter_extensions is not None:
                if not any(file.endswith(ext) for ext in filter_extensions):
                    continue
            hierarchy = folder.split(os.path.sep) + [file]
            hierarchy_callback(hierarchy, os.path.join(folder, file))


def parse_config(config: TConfig) -> Dict[str, Any]:
    if config is None:
        return {}
    if isinstance(config, (str, Path)):
        with open(config, "r") as f:
            return json.load(f)
    return shallow_copy_dict(config)


def check_requires(fn: Any, name: str, strict: bool = True) -> bool:
    if isinstance(fn, type):
        fn = fn.__init__  # type: ignore
    signature = inspect.signature(fn)
    for k, param in signature.parameters.items():
        if not strict and param.kind is inspect.Parameter.VAR_KEYWORD:
            return True
        if k == name:
            if param.kind is inspect.Parameter.VAR_POSITIONAL:
                return False
            return True
    return False


def get_requirements(fn: Any) -> List[str]:
    remove_first = False
    if isinstance(fn, type):
        fn = fn.__init__  # type: ignore
        remove_first = True  # remove `self`
    requirements = []
    signature = inspect.signature(fn)
    for k, param in signature.parameters.items():
        if param.kind is inspect.Parameter.VAR_KEYWORD:
            continue
        if param.kind is inspect.Parameter.VAR_POSITIONAL:
            continue
        if param.default is not inspect.Parameter.empty:
            continue
        requirements.append(k)
    if remove_first:
        requirements = requirements[1:]
    return requirements


def filter_kw(
    fn: Callable,
    kwargs: Dict[str, Any],
    *,
    strict: bool = False,
) -> Dict[str, Any]:
    kw = {}
    for k, v in kwargs.items():
        if check_requires(fn, k, strict):
            kw[k] = v
    return kw


def safe_execute(fn: Fn[T], kw: Dict[str, Any], *, strict: bool = False) -> T:
    return fn(**filter_kw(fn, kw, strict=strict))


def safe_instantiate(cls: Type[T], kw: Dict[str, Any], *, strict: bool = False) -> T:
    return cls(**filter_kw(cls, kw, strict=strict))


def get_num_positional_args(fn: Callable) -> Union[int, float]:
    signature = inspect.signature(fn)
    counter = 0
    for param in signature.parameters.values():
        if param.kind is inspect.Parameter.VAR_POSITIONAL:
            return math.inf
        if param.kind is inspect.Parameter.POSITIONAL_ONLY:
            counter += 1
        elif param.kind is inspect.Parameter.POSITIONAL_OR_KEYWORD:
            counter += 1
    return counter


def prepare_workspace_from(
    workspace: str,
    *,
    timeout: timedelta = timedelta(30),
    make: bool = True,
) -> str:
    current_time = datetime.now()
    if os.path.isdir(workspace):
        for stuff in os.listdir(workspace):
            if not os.path.isdir(os.path.join(workspace, stuff)):
                continue
            try:
                stuff_time = datetime.strptime(stuff, TIME_FORMAT)
                stuff_delta = current_time - stuff_time
                if stuff_delta > timeout:
                    console.warn(f"{stuff} will be removed (already {stuff_delta} ago)")
                    shutil.rmtree(os.path.join(workspace, stuff))
            except:
                pass
    workspace = os.path.join(workspace, current_time.strftime(TIME_FORMAT))
    if make:
        os.makedirs(workspace)
    return workspace


def get_sub_workspaces(root: TPath) -> List[Path]:
    root = to_path(root)
    if not root.is_dir():
        return []
    all_workspaces = []
    for stuff in root.iterdir():
        if not stuff.is_dir():
            continue
        try:
            datetime.strptime(stuff.name, TIME_FORMAT)
            all_workspaces.append(stuff)
        except:
            pass
    return all_workspaces


def get_sorted_workspaces(root: TPath) -> List[Path]:
    sub_workspaces = get_sub_workspaces(root)
    return sorted(sub_workspaces, key=lambda x: datetime.strptime(x.name, TIME_FORMAT))


def get_latest_workspace(root: TPath) -> Optional[Path]:
    sorted_workspaces = get_sorted_workspaces(root)
    if not sorted_workspaces:
        return None
    return sorted_workspaces[-1]


def sort_dict_by_value(d: Dict[Any, Any], *, reverse: bool = False) -> OrderedDict:
    sorted_items = sorted([(v, k) for k, v in d.items()], reverse=reverse)
    return OrderedDict({item[1]: item[0] for item in sorted_items})


def parse_args(args: Any) -> Namespace:
    return Namespace(**{k: None if not v else v for k, v in args.__dict__.items()})


def get_arguments(
    *,
    num_back: int = 0,
    pop_class_attributes: bool = True,
) -> Dict[str, Any]:
    frame = inspect.currentframe()
    if frame is None:
        raise ValueError("`get_arguments` should be called in a frame")
    frame = frame.f_back
    for i in range(num_back):
        if frame is None:
            raise ValueError(f"`get_arguments` failed at {i}th frame backword")
        frame = frame.f_back
    if frame is None:
        raise ValueError(f"`get_arguments` failed at {num_back}th frame backword")
    arguments = inspect.getargvalues(frame)[-1]
    if pop_class_attributes:
        arguments.pop("self", None)
        arguments.pop("__class__", None)
    return arguments


def timestamp(*, simplify: bool = False, ensure_different: bool = False) -> str:
    """
    Return current timestamp.

    Parameters
    ----------
    simplify : bool. If True, format will be simplified to 'year-month-day'.
    ensure_different : bool. If True, format will include millisecond.

    Returns
    -------
    timestamp : str

    """

    now = datetime.now()
    if simplify:
        return now.strftime(TIME_FORMAT[:8])
    if ensure_different:
        time.sleep(1.0e-6)  # ensure different by sleep 1 tick
        return now.strftime(TIME_FORMAT)
    return now.strftime(TIME_FORMAT[:-3])


def prod(iterable: Iterable) -> float:
    """Return cumulative production of an iterable."""

    return float(reduce(operator.mul, iterable, 1))


def hash_code(code: str) -> str:
    """Return hash code for a string."""

    return hashlib.md5(code.encode()).hexdigest()


def hash_dict(d: Dict[str, Any], *, static_keys: bool = False) -> str:
    """
    Return a consistent hash code for an arbitrary dict.
    * `static_keys` is used to control whether to include dict keys in the hash code.
    Default is False, which means the hash code will be consistent even if the dict
    has different keys but same values.
    """

    def _hash(_d: Dict[str, Any]) -> str:
        sorted_keys = sorted(_d)
        hashes = []
        for k in sorted_keys:
            v = _d[k]
            if not static_keys:
                hashes.append(str(k))
            if isinstance(v, dict):
                hashes.append(_hash(v))
            elif isinstance(v, set):
                hashes.append(hash_code(str(sorted(v))))
            else:
                hashes.append(hash_code(str(v)))
        return hash_code("".join(hashes))

    return _hash(d)


def hash_str_dict(
    d: Dict[str, str],
    *,
    key_order: Optional[List[str]] = None,
    static_keys: bool = False,
) -> str:
    """A specific fast path for `hash_dict` when all values are strings."""

    if key_order is None:
        key_order = sorted(d)
    if static_keys:
        return hash_code("$?^^?$".join([d[k] for k in key_order]))
    return hash_code("$?^^?$".join([f"{k}$?%%?${d[k]}" for k in key_order]))


def random_hash() -> str:
    return hash_code(str(random.random()))


def prefix_dict(d: TDict, prefix: str) -> TDict:
    """Prefix every key in dict `d` with `prefix`."""

    return {f"{prefix}_{k}": v for k, v in d.items()}  # type: ignore


def shallow_copy_dict(d: TDict) -> TDict:
    def _copy(d_: T) -> T:
        if isinstance(d_, list):
            return [_copy(item) for item in d_]  # type: ignore
        if isinstance(d_, dict):
            return {k: _copy(v) for k, v in d_.items()}  # type: ignore
        return d_

    return _copy(d)


def update_dict(src_dict: dict, tgt_dict: dict) -> dict:
    """
    Update tgt_dict with src_dict.
    * Notice that changes will happen only on keys which src_dict holds.

    Parameters
    ----------
    src_dict : dict
    tgt_dict : dict

    Returns
    -------
    tgt_dict : dict

    """

    for k, v in src_dict.items():
        tgt_v = tgt_dict.get(k)
        if tgt_v is None:
            tgt_dict[k] = v
        elif not isinstance(v, dict):
            tgt_dict[k] = v
        else:
            update_dict(v, tgt_v)
    return tgt_dict


def fix_float_to_length(num: float, length: int) -> str:
    """Change a float number to string format with fixed length."""

    ctx = decimal.Context()
    ctx.prec = 2 * length
    d = ctx.create_decimal(repr(num))
    str_num = format(d, "f").lower()
    if str_num == "nan":
        return f"{str_num:^{length}s}"
    idx = str_num.find(".")
    if idx == -1:
        diff = length - len(str_num)
        if diff <= 0:
            return str_num
        if diff == 1:
            return f"{str_num}."
        return f"{str_num}.{'0' * (diff - 1)}"
    length = max(length, idx)
    return str_num[:length].ljust(length, "0")


def truncate_string_to_length(string: str, length: int) -> str:
    """Truncate a string to make sure its length not exceeding a given length."""

    if len(string) <= length:
        return string
    half_length = int(0.5 * length) - 1
    head = string[:half_length]
    tail = string[-half_length:]
    return f"{head}{'.' * (length - 2 * half_length)}{tail}"


def grouped(iterable: Iterable, n: int, *, keep_tail: bool = False) -> List[tuple]:
    """Group an iterable every `n` elements."""

    if not keep_tail:
        return list(zip(*[iter(iterable)] * n))
    with batch_manager(iterable, batch_size=n, max_batch_size=n) as manager:
        return [tuple(batch) for batch in manager]


def grouped_into(iterable: Iterable, n: int) -> List[tuple]:
    """Group an iterable into `n` groups."""

    elements = list(iterable)
    num_elements = len(elements)
    num_elem_per_group = int(math.ceil(num_elements / n))
    results: List[tuple] = []
    split_idx = num_elements + n - n * num_elem_per_group
    start = 0
    for _ in range(split_idx):
        end = start + num_elem_per_group
        results.append(tuple(elements[start:end]))
        start = end
    for _ in range(split_idx, n):
        end = start + num_elem_per_group - 1
        results.append(tuple(elements[start:end]))
        start = end
    return results


def is_numeric(s: Any) -> bool:
    """Check whether `s` is a number."""

    try:
        s = float(s)
        return True
    except (TypeError, ValueError):
        try:
            unicodedata.numeric(s)
            return True
        except (TypeError, ValueError):
            return False


def register_core(
    name: str,
    global_dict: Dict[str, T],
    *,
    allow_duplicate: bool = False,
    before_register: Optional[Callable] = None,
    after_register: Optional[Callable] = None,
) -> Callable[[T], T]:
    def _register(cls: T) -> T:
        if before_register is not None:
            before_register(cls)
        registered = global_dict.get(name)
        if registered is not None and not allow_duplicate:
            console.warn(
                f"'{name}' has already registered "
                f"in the given global dict ({global_dict})"
            )
            return cls
        global_dict[name] = cls
        if after_register is not None:
            after_register(cls)
        return cls

    return _register


def get_err_msg(err: Exception) -> str:
    return " | ".join(map(repr, sys.exc_info()[:2] + (str(err),)))


async def retry(
    fn: Callable[[], Coroutine[None, None, TRetryResponse]],
    num_retry: Optional[int] = None,
    *,
    health_check: Optional[Callable[[TRetryResponse], bool]] = None,
    error_verbose_fn: Optional[Callable[[TRetryResponse], None]] = None,
) -> TRetryResponse:
    counter = 0
    if num_retry is None:
        num_retry = 1
    while counter < num_retry:
        try:
            res = await fn()
            if health_check is None or health_check(res):
                if counter > 0:
                    console.log(f"succeeded after {counter} retries")
                return res
            if error_verbose_fn is not None:
                error_verbose_fn(res)
            else:
                raise ValueError("response did not pass health check")
        except Exception as e:
            console.warn(f"{e}, retrying ({counter + 1})")
        finally:
            counter += 1
    raise ValueError(f"failed after {num_retry} retries")


async def offload(future: Coroutine[Any, Any, TFutureResponse]) -> TFutureResponse:
    import asyncio
    from concurrent.futures import ThreadPoolExecutor

    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(
            executor,
            lambda new_loop, f: new_loop.run_until_complete(f),
            asyncio.new_event_loop(),
            future,
        )


def compress(absolute_folder: TPath, remove_original: bool = True) -> None:
    shutil.make_archive(str(absolute_folder), "zip", absolute_folder)
    if remove_original:
        shutil.rmtree(absolute_folder)


def to_path(path: TPath) -> Path:
    if isinstance(path, Path):
        return path
    return Path(path)


class FileInfo(NamedTuple):
    """
    Represents information about a (remote) file, often generated by
    `check_available` / `get_file_info`.

    Attributes
    ----------
    sha : str
        The sha of the (remote) file.
    st_size : int
        The size of the (remote) file in bytes.
    download_url : Optional[str]
        The download url of the (remote) file, if available.

    """

    sha: str
    st_size: int
    download_url: Optional[str] = None


def get_file_size(path: TPath) -> int:
    """
    Get the size of a file.

    Parameters
    ----------
    path : TPath
        The path of the file.

    Returns
    -------
    int
        The size of the file in bytes.

    Examples
    --------
    >>> get_file_size(Path("..."))

    """

    return to_path(path).stat().st_size


def get_file_info(path: TPath) -> FileInfo:
    """
    Get the information of a file.

    Parameters
    ----------
    path : TPath
        The path of the file.

    Returns
    -------
    FileInfo
        The FileInfo object containing information about the file.

    Examples
    --------
    >>> get_file_info(Path("..."))

    """

    path = to_path(path)
    with path.open("rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    return FileInfo(sha, get_file_size(path))


def check_sha_with(path: TPath, tgt_sha: str) -> bool:
    """
    Check if the SHA256 hash of a file matches a target hash.

    Parameters
    ----------
    path : TPath
        The path of the file.
    tgt_sha : str
        The target SHA256 hash to compare with.

    Returns
    -------
    bool
        True if the file's hash matches the target hash, False otherwise.

    Examples
    --------
    >>> check_sha_with(Path("..."), "...")

    """

    return get_file_info(path).sha == tgt_sha


def to_set(inp: Any) -> Set:
    if isinstance(inp, set):
        return inp
    if isinstance(inp, (list, tuple, dict)):
        return set(inp)
    return {inp}


def wait_for_everyone_at_end(fn: FAny) -> FAny:
    def _wrapper(*args: Any, **kwargs: Any) -> Any:
        result = fn(*args, **kwargs)
        wait_for_everyone()
        return result

    return _wrapper  # type: ignore


def only_execute_on_rank0(fn: FNone) -> FNone:
    @wait_for_everyone_at_end
    def _wrapper(*args: Any, **kwargs: Any) -> None:
        if is_rank_0():
            fn(*args, **kwargs)

    return _wrapper  # type: ignore


def only_execute_on_local_rank0(fn: FNone) -> FNone:
    @wait_for_everyone_at_end
    def _wrapper(*args: Any, **kwargs: Any) -> None:
        if is_local_rank_0():
            fn(*args, **kwargs)

    return _wrapper  # type: ignore


def get_memory_size(obj: Any, seen: Optional[Set] = None) -> int:
    import numpy as np

    try:
        from pandas import Index
        from pandas import DataFrame
    except ImportError:
        Index = DataFrame = None

    if seen is None:
        seen = set()
    obj_id = id(obj)
    if obj_id in seen:
        return 0

    if isinstance(obj, np.ndarray):
        return obj.nbytes
    if Index is not None and isinstance(obj, Index):
        return obj.memory_usage(deep=True)
    if DataFrame is not None and isinstance(obj, DataFrame):
        return obj.memory_usage(deep=True).sum()

    size = sys.getsizeof(obj)
    seen.add(obj_id)

    if isinstance(obj, dict):
        for k, v in obj.items():
            size += get_memory_size(k, seen)
            size += get_memory_size(v, seen)
    elif hasattr(obj, "__dict__"):
        size += get_memory_size(obj.__dict__, seen)
    elif hasattr(obj, "__iter__") and not isinstance(obj, (str, bytes, bytearray)):
        for i_obj in obj:
            size += get_memory_size(i_obj, seen)

    return size


def get_memory_mb(obj: Any) -> float:
    return get_memory_size(obj) / 1024 / 1024


# util modules


TRegister = TypeVar("TRegister", bound="WithRegister", covariant=True)
TTRegister = TypeVar("TTRegister", bound=Type["WithRegister"])
T_s = TypeVar("T_s", bound="ISerializable", covariant=True)
T_sd = TypeVar("T_sd", bound="ISerializableDataClass", covariant=True)
TSerializable = TypeVar("TSerializable", bound="ISerializable", covariant=True)
T_sa = TypeVar("T_sa", bound="ISerializableArrays", covariant=True)
TSArrays = TypeVar("TSArrays", bound="ISerializableArrays", covariant=True)
TSDataClass = TypeVar("TSDataClass", bound="ISerializableDataClass", covariant=True)
TDataClass = TypeVar("TDataClass", bound="DataClassBase")


class DataClassBase:
    """
    To use this base class, you should not only inherit from `DataClassBase`,
    but also decorate your class with `@dataclass`.
    """

    @property
    def fields(self) -> List[Field]:
        return fields(self)  # type: ignore

    @property
    def field_names(self) -> List[str]:
        return [f.name for f in self.fields]

    @property
    def attributes(self) -> List[Any]:
        return [getattr(self, name) for name in self.field_names]

    def asdict(self) -> Dict[str, Any]:
        def _to_item(ins: Any) -> Any:
            if isinstance(ins, DataClassBase):
                return ins.asdict()
            if isinstance(ins, dict):
                return {k: _to_item(v) for k, v in ins.items()}
            if isinstance(ins, list):
                return [_to_item(item) for item in ins]
            if is_dataclass(ins):
                return asdict(ins)
            return ins

        return {k: _to_item(v) for k, v in zip(self.field_names, self.attributes)}

    def as_modified_dict(
        self,
        *,
        focuses: Optional[Union[str, List[str]]] = None,
        excludes: Optional[Union[str, List[str]]] = None,
    ) -> Dict[str, Any]:
        cls = self.__class__
        requirements = set(get_requirements(cls))
        d = {k: getattr(self, k) for k in requirements}
        defaults = cls(**d)
        excludes_set = to_set(excludes)
        if focuses is not None:
            focus_set = to_set(focuses)
            for k in self.field_names:
                if k not in focus_set:
                    excludes_set.add(k)
        modified_dict = {
            k: getattr(self, k)
            for k in self.field_names
            if k not in excludes_set
            and (k in requirements or getattr(self, k) != getattr(defaults, k))
        }
        modified_dict = {
            k: v.as_modified_dict() if isinstance(v, DataClassBase) else v
            for k, v in modified_dict.items()
        }
        return modified_dict

    def copy(self: TDataClass) -> TDataClass:
        return self.__class__.construct(self.asdict())

    def update_with(self: TDataClass, other: TDataClass) -> TDataClass:
        d = update_dict(other.asdict(), self.asdict())
        updated = self.__class__.construct(d)
        for field_name in self.field_names:
            setattr(self, field_name, getattr(updated, field_name))
        return self

    def to_hash(
        self,
        *,
        focuses: Optional[Union[str, List[str]]] = None,
        excludes: Optional[Union[str, List[str]]] = None,
    ) -> str:
        return hash_dict(self.as_modified_dict(focuses=focuses, excludes=excludes))

    @classmethod
    def construct(cls: Type[TDataClass], d: Dict[str, Any]) -> TDataClass:
        def _construct(t: Type, d: Dict[str, Any]) -> Any:
            instance = safe_instantiate(t, d)
            if not is_dataclass(instance):
                return instance
            for field in fields(instance):
                if is_dataclass(field.type):
                    setattr(
                        instance,
                        field.name,
                        _construct(field.type, getattr(instance, field.name)),
                    )
                    continue
                t_origin = getattr(field.type, "__origin__", None)
                if t_origin is None:
                    continue
                if t_origin is list and hasattr(field.type, "__args__"):
                    t_value = field.type.__args__[0]
                    if is_dataclass(t_value):
                        setattr(
                            instance,
                            field.name,
                            [
                                _construct(t_value, item)
                                for item in getattr(instance, field.name)
                            ],
                        )
                    continue
                if t_origin is dict and hasattr(field.type, "__args__"):
                    t_value = field.type.__args__[1]
                    if is_dataclass(t_value):
                        setattr(
                            instance,
                            field.name,
                            {
                                k: _construct(t_value, v)
                                for k, v in getattr(instance, field.name).items()
                            },
                        )
                    continue
            return instance

        return _construct(cls, d)


class WithRegister(Generic[TRegister]):
    d: Dict[str, Type[TRegister]]
    __identifier__: str

    @classmethod
    def get(cls: Type[TRegister], name: str) -> Type[TRegister]:
        return cls.d[name]

    @classmethod
    def has(cls, name: str) -> bool:
        return name in cls.d

    @classmethod
    def make(
        cls: Type[TRegister],
        name: str,
        config: Dict[str, Any],
        *,
        ensure_safe: bool = False,
    ) -> TRegister:
        base = cls.get(name)
        if not ensure_safe:
            return base(**config)  # type: ignore
        return safe_instantiate(base, config)

    @classmethod
    def make_multiple(
        cls: Type[TRegister],
        names: Union[str, List[str]],
        configs: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None,
        *,
        ensure_safe: bool = False,
    ) -> List[TRegister]:
        if configs is None:
            configs = {}
        if isinstance(names, str):
            assert isinstance(configs, dict)
            return cls.make(names, configs, ensure_safe=ensure_safe)  # type: ignore
        if not isinstance(configs, list):
            configs = [configs.get(name, {}) for name in names]
        return [
            cls.make(name, shallow_copy_dict(config), ensure_safe=ensure_safe)
            for name, config in zip(names, configs)
        ]

    @classmethod
    def register(
        cls,
        name: str,
        *,
        allow_duplicate: bool = False,
    ) -> Callable[[TTRegister], TTRegister]:
        def before(cls_: TTRegister) -> None:
            cls_.__identifier__ = name

        return register_core(  # type: ignore
            name,
            cls.d,
            allow_duplicate=allow_duplicate,
            before_register=before,
        )

    @classmethod
    def check_subclass(cls, name: str) -> bool:
        return issubclass(cls.d[name], cls)


@dataclass
class JsonPack(DataClassBase):
    type: str
    info: Dict[str, Any]


class ISerializable(
    Generic[TSerializable],
    WithRegister[TSerializable],
    metaclass=ABCMeta,
):
    # abstract

    @abstractmethod
    def to_info(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def from_info(self: T_s, info: Dict[str, Any]) -> T_s:
        pass

    # optional callbacks

    def after_load(self) -> None:
        pass

    # api

    def to_pack(self) -> JsonPack:
        return JsonPack(self.__identifier__, self.to_info())

    @classmethod
    def from_pack(cls: Type[TSerializable], pack: Dict[str, Any]) -> TSerializable:
        obj: TSerializable = cls.make(pack["type"], {})
        obj.from_info(pack["info"])
        obj.after_load()
        return obj

    def to_json(self) -> str:
        return json.dumps(self.to_pack().asdict())

    @classmethod
    def from_json(cls: Type[TSerializable], json_string: str) -> TSerializable:
        return cls.from_pack(json.loads(json_string))

    def copy(self: T_s) -> T_s:
        copied = self.__class__()
        copied.from_info(shallow_copy_dict(self.to_info()))
        return copied


class ISerializableArrays(
    Generic[TSArrays],
    ISerializable[TSArrays],
    metaclass=ABCMeta,
):
    @abstractmethod
    def to_npd(self) -> np_dict_type:
        pass

    @abstractmethod
    def from_npd(self: T_sa, npd: np_dict_type) -> T_sa:
        pass

    def copy(self: T_sa) -> T_sa:
        copied = super().copy()
        copied.from_npd(shallow_copy_dict(self.to_npd()))
        return copied


class ISerializableDataClass(  # type: ignore
    Generic[TSDataClass],
    DataClassBase,
    ISerializable[TSDataClass],
):
    def to_info(self) -> Dict[str, Any]:
        return self.asdict()

    def from_info(self: T_sd, info: Dict[str, Any]) -> T_sd:
        new = self.__class__.construct(info)
        self.update_with(new)
        return self


class Serializer:
    id_file: str = "id.txt"
    info_file: str = "info.json"
    npd_folder: str = "npd"

    @classmethod
    def save_info(
        cls,
        folder: TPath,
        *,
        info: Optional[Dict[str, Any]] = None,
        serializable: Optional[ISerializable] = None,
    ) -> None:
        folder = to_path(folder)
        folder.mkdir(parents=True, exist_ok=True)
        if info is None and serializable is None:
            raise ValueError("either `info` or `serializable` should be provided")
        if info is None:
            info = serializable.to_info()  # type: ignore
        with (folder / cls.info_file).open("w") as f:
            json.dump(info, f)

    @classmethod
    def load_info(cls, folder: TPath) -> Dict[str, Any]:
        return cls.try_load_info(folder, strict=True)  # type: ignore

    @classmethod
    def try_load_info(
        cls,
        folder: TPath,
        *,
        strict: bool = False,
    ) -> Optional[Dict[str, Any]]:
        folder = to_path(folder)
        info_path = folder / cls.info_file
        if not info_path.is_file():
            if not strict:
                return None
            raise ValueError(f"'{info_path}' does not exist")
        with info_path.open("r") as f:
            info = json.load(f)
        return info

    @classmethod
    def save_npd(
        cls,
        folder: TPath,
        *,
        npd: Optional[np_dict_type] = None,
        serializable: Optional[ISerializableArrays] = None,
    ) -> None:
        import numpy as np

        folder = to_path(folder)
        folder.mkdir(parents=True, exist_ok=True)
        if npd is None and serializable is None:
            raise ValueError("either `npd` or `serializable` should be provided")
        if npd is None:
            npd = serializable.to_npd()  # type: ignore
        npd_folder = folder / cls.npd_folder
        npd_folder.mkdir(exist_ok=True)
        for k, v in npd.items():
            np.save(npd_folder / f"{k}.npy", v)

    @classmethod
    def load_npd(cls, folder: TPath) -> np_dict_type:
        import numpy as np

        folder = to_path(folder)
        folder.mkdir(parents=True, exist_ok=True)
        npd_folder = folder / cls.npd_folder
        if not npd_folder.is_dir():
            raise ValueError(f"'{npd_folder}' does not exist")
        npd = {}
        for file in npd_folder.iterdir():
            npd[file.stem] = np.load(npd_folder / file)
        return npd

    @classmethod
    def save(
        cls,
        folder: TPath,
        serializable: ISerializable,
        *,
        save_npd: bool = True,
    ) -> None:
        folder = to_path(folder)
        cls.save_info(folder, serializable=serializable)
        if save_npd and isinstance(serializable, ISerializableArrays):
            cls.save_npd(folder, serializable=serializable)
        with (folder / cls.id_file).open("w") as f:
            f.write(serializable.__identifier__)

    @classmethod
    def load(
        cls,
        folder: TPath,
        base: Type[TSerializable],
        *,
        swap_id: Optional[str] = None,
        swap_info: Optional[Dict[str, Any]] = None,
        load_npd: bool = True,
    ) -> TSerializable:
        serializable = cls.load_empty(folder, base, swap_id=swap_id)
        serializable.from_info(swap_info or cls.load_info(folder))
        if load_npd and isinstance(serializable, ISerializableArrays):
            serializable.from_npd(cls.load_npd(folder))
        serializable.after_load()
        return serializable

    @classmethod
    def load_empty(
        cls,
        folder: TPath,
        base: Type[TSerializable],
        *,
        swap_id: Optional[str] = None,
    ) -> TSerializable:
        if swap_id is not None:
            s_type = swap_id
        else:
            folder = to_path(folder)
            id_path = folder / cls.id_file
            if not id_path.is_file():
                raise ValueError(f"cannot find '{id_path}'")
            with id_path.open("r") as f:
                s_type = f.read().strip()
        return base.make(s_type, {})


class Incrementer:
    """
    Util class which can calculate running mean & running std efficiently.

    Parameters
    ----------
    window_size : {int, None}, window size of running statistics.
    * If None, then all history records will be used for calculation.

    Examples
    ----------
    >>> incrementer = Incrementer(window_size=5)
    >>> for i in range(10):
    >>>     incrementer.update(i)
    >>>     if i >= 4:
    >>>         print(incrementer.mean)  # will print 2.0, 3.0, ..., 6.0, 7.0

    """

    def __init__(self, window_size: Optional[int] = None):
        if window_size is not None:
            if not isinstance(window_size, int):
                msg = f"window size should be integer, {type(window_size)} found"
                raise ValueError(msg)
            if window_size < 2:
                msg = f"window size should be at least 2, {window_size} found"
                raise ValueError(msg)
        self.previous: List[float] = []
        self.num_record = 0.0
        self.window_size = window_size
        self.running_sum = self.running_square_sum = 0.0

    @property
    def mean(self) -> float:
        return self.running_sum / self.num_record

    @property
    def std(self) -> float:
        return math.sqrt(
            max(
                0.0,
                self.running_square_sum / self.num_record - self.mean**2,
            )
        )

    def update(self, new_value: float) -> None:
        self.num_record += 1
        self.running_sum += new_value
        self.running_square_sum += new_value**2
        if self.window_size is not None:
            self.previous.append(new_value)
            if self.num_record == self.window_size + 1:
                self.num_record -= 1
                previous = self.previous.pop(0)
                self.running_sum -= previous
                self.running_square_sum -= previous**2


class OPTBase(ABC):
    def __init__(self) -> None:
        self._opt = self.defaults
        self.update_from_env()

    def __getattr__(self, __name: str) -> Any:
        return self._opt[__name]

    # abstract

    @property
    @abstractmethod
    def env_key(self) -> str:
        pass

    @property
    @abstractmethod
    def defaults(self) -> Dict[str, Any]:
        pass

    # optional callbacks

    def update_from_env(self) -> None:
        env_opt_json = os.environ.get(self.env_key)
        if env_opt_json is not None:
            update_dict(json.loads(env_opt_json), self._opt)

    # api

    def opt_context(self, increment: Dict[str, Any]) -> ContextManager:
        class _:
            def __init__(self) -> None:
                self._increment = increment
                self._backup = shallow_copy_dict(instance._opt)

            def __enter__(self) -> None:
                update_dict(self._increment, instance._opt)

            def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
                instance._opt = self._backup

        instance = self
        return _()

    def opt_env_context(self, increment: Dict[str, Any]) -> ContextManager:
        class _:
            def __init__(self) -> None:
                self._increment = increment
                self._backup = os.environ.get(instance.env_key)

            def __enter__(self) -> None:
                os.environ[instance.env_key] = json.dumps(self._increment)

            def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
                if self._backup is None:
                    del os.environ[instance.env_key]
                else:
                    os.environ[instance.env_key] = self._backup

        instance = self
        return _()


# contexts


class timeit:
    """
    Timing context manager.

    Examples
    --------
    >>> with timeit("something"):
    >>>     # do something here
    >>> # will print ">  [ info ] timing for    something     : x.xxxx"

    """

    t: float

    def __init__(self, message: str, *, precision: int = 6, enabled: bool = True):
        self.p = precision
        self.message = message
        self.enabled = enabled

    def __enter__(self) -> None:
        if self.enabled:
            self.t = time.time()

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self.enabled:
            console.log(
                f"timing for {self.message:^16s} : "
                f"{time.time() - self.t:{self.p}.{self.p-2}f}",
                _stack_offset=3,
            )


class batch_manager:
    """
    Process data in batch.

    Parameters
    ----------
    inputs : tuple(np.ndarray), auxiliary array inputs.
    num_elem : {int, float}, indicates how many elements will be processed in a batch.
    > `element` here means every single entry of the `inputs`.
    batch_size : int, indicates the batch_size; if None, batch_size will be
                      calculated by `num_elem`.

    Examples
    --------
    >>> with batch_manager(np.arange(5), np.arange(1, 6), batch_size=2) as manager:
    >>>     for arr, tensor in manager:
    >>>         print(arr, tensor)
    >>>         # Will print:
    >>>         #   [0 1], [1 2]
    >>>         #   [2 3], [3 4]
    >>>         #   [4]  , [5]

    """

    start: int
    end: int

    def __init__(
        self,
        *inputs: arr_type,
        num_elem: Union[int, float] = 1e6,
        batch_size: Optional[int] = None,
        max_batch_size: int = 1024,
    ):
        if not inputs:
            raise ValueError("inputs should be provided in general_batch_manager")
        input_lengths = list(map(len, inputs))
        self.num_samples, self.inputs = input_lengths[0], inputs
        assert_msg = "inputs should be of same length"
        assert all(length == self.num_samples for length in input_lengths), assert_msg
        if batch_size is not None:
            self.batch_size = batch_size
        else:
            self.batch_size = int(
                int(num_elem) / sum(map(lambda arr: prod(arr.shape[1:]), inputs))
            )
        self.batch_size = min(max_batch_size, min(self.num_samples, self.batch_size))
        self.num_epoch = int(self.num_samples / self.batch_size)
        self.num_epoch += int(self.num_epoch * self.batch_size < self.num_samples)

    def __enter__(self) -> "batch_manager":
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        pass

    def __iter__(self) -> "batch_manager":
        self.start, self.end = 0, self.batch_size
        return self

    def __next__(self) -> Union[Tuple[arr_type, ...], arr_type]:
        if self.start >= self.num_samples:
            raise StopIteration
        batched_data = tuple(
            map(
                lambda arr: arr[self.start : self.end],
                self.inputs,
            )
        )
        self.start, self.end = self.end, self.end + self.batch_size
        if len(batched_data) == 1:
            return batched_data[0]
        return batched_data

    def __len__(self) -> int:
        return self.num_epoch
