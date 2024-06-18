import shutil

from abc import abstractmethod
from abc import ABCMeta
from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import Union
from typing import Generic
from typing import Mapping
from typing import TypeVar
from typing import Optional
from typing import ContextManager
from pathlib import Path
from zipfile import ZipFile
from tempfile import mkdtemp

from .misc import to_path
from .misc import shallow_copy_dict
from .misc import WithRegister
from .misc import ISerializable
from .misc import ISerializableDataClass
from .types import TPath


TB = TypeVar("TB", bound="IBlock")
TBlock = TypeVar("TBlock", bound="IBlock")
TConfig = TypeVar("TConfig", bound="ISerializableDataClass")
T_p = TypeVar("T_p", bound="IPipeline", covariant=True)
TPipeline = TypeVar("TPipeline", bound="IPipeline")

pipelines: Dict[str, Type["IPipeline"]] = {}
pipeline_blocks: Dict[str, Type["IBlock"]] = {}


def get_folder(folder: TPath, *, force_new: bool = False) -> ContextManager:
    class _:
        tmp_folder: Optional[Path]

        def __init__(self) -> None:
            self.tmp_folder = None

        def __enter__(self) -> Path:
            folder = to_path(folder_input)
            if folder.is_dir():
                if not force_new:
                    return folder
                self.tmp_folder = Path(mkdtemp())
                shutil.copytree(folder, self.tmp_folder, dirs_exist_ok=True)
                return self.tmp_folder
            path = Path(f"{folder}.zip")
            if not path.is_file():
                raise ValueError(f"neither '{folder}' nor '{path}' exists")
            self.tmp_folder = Path(mkdtemp())
            with ZipFile(path, "r") as ref:
                ref.extractall(self.tmp_folder)
            return self.tmp_folder

        def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
            if self.tmp_folder is not None:
                shutil.rmtree(self.tmp_folder)

    folder_input = folder
    return _()


def get_req_choices(req: "IBlock") -> List[str]:
    return [r.strip() for r in req.__identifier__.split("|")]


def check_requirement(block: "IBlock", previous: Mapping[str, "IBlock"]) -> None:
    for req in block.requirements:
        choices = get_req_choices(req)  # type: ignore
        if all(c != "none" and c not in previous for c in choices):
            raise ValueError(
                f"'{block.__identifier__}' requires '{req}', "
                "but none is provided in the previous blocks"
            )


class IBlock(Generic[TBlock], WithRegister["IBlock"], metaclass=ABCMeta):
    d = pipeline_blocks

    """
    This property should be injected by the `IPipeline`.
    > In runtime (i.e. executing the `run` method), this property will represent ALL `IBlock`s used in the `IPipeline`.
    """
    previous: Dict[str, TBlock]

    @abstractmethod
    def build(self, config: Any) -> None:
        """This method can modify the `config` inplace, which will affect the following blocks"""

    @property
    def requirements(self) -> List[Type[TBlock]]:
        return []

    def try_get_previous(self, block: Union[str, Type[TB]]) -> Optional[TB]:
        if not isinstance(block, str):
            block = block.__identifier__
        return self.previous.get(block)  # type: ignore

    def get_previous(self, block: Union[str, Type[TB]]) -> TB:
        b = self.try_get_previous(block)
        if b is None:
            raise ValueError(f"cannot find '{block}' in `previous`")
        return b


class IPipeline(
    Generic[TBlock, TConfig, TPipeline],
    ISerializable[TPipeline],
    metaclass=ABCMeta,
):
    d = pipelines  # type: ignore

    config: TConfig
    blocks: List[TBlock]

    def __init__(self) -> None:
        self.blocks = []

    # abstract

    @classmethod
    @abstractmethod
    def init(cls: Type[TPipeline], config: TConfig) -> TPipeline:
        pass

    @property
    @abstractmethod
    def config_base(self) -> Type[TConfig]:
        pass

    @property
    @abstractmethod
    def block_base(self) -> Type[TBlock]:
        pass

    # inheritance

    def to_info(self) -> Dict[str, Any]:
        return dict(
            blocks=[
                (
                    b.to_pack().asdict()  # type: ignore
                    if isinstance(b, ISerializable)
                    else b.__identifier__
                )
                for b in self.blocks
            ],
            config=self.config.to_pack().asdict(),
        )

    def from_info(self: T_p, info: Dict[str, Any]) -> T_p:
        self.config = self.config_base.from_pack(info["config"])
        block_base = self.block_base
        blocks: List[TBlock] = []
        for block in info["blocks"]:
            blocks.append(
                block_base.from_pack(block)  # type: ignore
                if issubclass(block_base, ISerializable)
                else block_base.make(block, {})
            )
        self.build(*blocks)
        return self

    # optional callbacks

    def before_block_build(self, block: TBlock) -> None:
        pass

    def after_block_build(self, block: TBlock) -> None:
        pass

    # api

    @property
    def block_mappings(self) -> Dict[str, TBlock]:
        return {b.__identifier__: b for b in self.blocks}

    def try_get_block(self, block: Union[str, Type[TB]]) -> Optional[TB]:
        if not isinstance(block, str):
            block = block.__identifier__
        return self.block_mappings.get(block)  # type: ignore

    def get_block(self, block: Union[str, Type[TB]]) -> TB:
        b = self.try_get_block(block)
        if b is None:
            raise ValueError(f"cannot find '{block}' in `previous`")
        return b

    def build(self, *blocks: TBlock) -> None:
        previous: Dict[str, TBlock] = self.block_mappings
        for block in blocks:
            check_requirement(block, previous)
            block.previous = shallow_copy_dict(previous)
            self.before_block_build(block)
            block.build(self.config)
            self.after_block_build(block)
            previous[block.__identifier__] = block
            self.blocks.append(block)


__all__ = [
    "IBlock",
    "IPipeline",
    "TPipeline",
    "get_folder",
    "get_req_choices",
]
