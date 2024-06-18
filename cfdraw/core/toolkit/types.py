from typing import Any
from typing import Dict
from typing import Tuple
from typing import Union
from typing import TypeVar
from typing import Optional
from typing import TYPE_CHECKING
from pathlib import Path

if TYPE_CHECKING:
    import torch
    import numpy as np

arr_type = Union["np.ndarray", "torch.Tensor"]
TArray = TypeVar("TArray", bound=arr_type)
np_dict_type = Dict[str, Union["np.ndarray", Any]]
tensor_dict_type = Dict[str, Union["torch.Tensor", Any]]

TPath = Union[str, Path]
TConfig = Optional[Union[TPath, Dict[str, Any]]]
TNumberPair = Optional[Union[int, Tuple[int, int]]]
