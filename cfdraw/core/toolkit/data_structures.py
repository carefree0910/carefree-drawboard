import gc

from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import Tuple
from typing import Generic
from typing import TypeVar
from typing import Callable
from typing import Iterator
from typing import Optional
from datetime import datetime

from . import console
from .misc import sort_dict_by_value
from .constants import TIME_FORMAT


TTypes = TypeVar("TTypes")
TBundle = TypeVar("TBundle", bound="Bundle")
TItemData = TypeVar("TItemData")
TPoolItem = TypeVar("TPoolItem", bound="IPoolItem")
PItemInit = Callable[[], TPoolItem]


class Item(Generic[TItemData]):
    def __init__(self, key: str, data: TItemData) -> None:
        self.key = key
        self.data = data


class Bundle(Generic[TItemData]):
    def __init__(self, *, no_mapping: bool = False) -> None:
        """
        * use mapping is fast at the cost of doubled memory.
        * for the `queue` use case, mapping is not needed because all operations
        focus on the first item.

        Details
        -------
        * no_mapping = False
            * get    : O(1)
            * push   : O(1)
            * remove : O(1) (if not found) / O(n)
        * no_mapping = True
            * get    : O(n)
            * push   : O(1)
            * remove : O(n)
        * `queue` (both cases, so use no_mapping = True to save memory)
            * get    : O(1)
            * push   : O(1)
            * remove : O(1)
        """

        self._items: List[Item[TItemData]] = []
        self._mapping: Optional[Dict[str, Item[TItemData]]] = None if no_mapping else {}

    def __len__(self) -> int:
        return len(self._items)

    def __iter__(self) -> Iterator[Item[TItemData]]:
        return iter(self._items)

    def __contains__(self, key: str) -> bool:
        return self.get(key) is not None

    @property
    def first(self) -> Optional[Item[TItemData]]:
        if self.is_empty:
            return None
        return self._items[0]

    @property
    def last(self) -> Optional[Item[TItemData]]:
        if self.is_empty:
            return None
        return self._items[-1]

    @property
    def is_empty(self) -> bool:
        return not self._items

    def get(self, key: str) -> Optional[Item[TItemData]]:
        if self._mapping is not None:
            return self._mapping.get(key)
        for item in self._items:
            if key == item.key:
                return item
        return None

    def get_index(self, index: int) -> Item[TItemData]:
        return self._items[index]

    def push(self: TBundle, item: Item[TItemData]) -> TBundle:
        if self.get(item.key) is not None:
            raise ValueError(f"item '{item.key}' already exists")
        self._items.append(item)
        if self._mapping is not None:
            self._mapping[item.key] = item
        return self

    def remove(self, key: str) -> Optional[Item[TItemData]]:
        if self._mapping is None:
            for i, item in enumerate(self._items):
                if key == item.key:
                    self._items.pop(i)
                    return item
            return None
        item = self._mapping.pop(key, None)  # type: ignore
        if item is not None:
            for i, _item in enumerate(self._items):
                if key == _item.key:
                    self._items.pop(i)
                    break
        return item


class Types(Generic[TTypes]):
    def __init__(self) -> None:
        self._types: Dict[str, Type[TTypes]] = {}

    def __iter__(self) -> Iterator[str]:
        return iter(self._types)

    def __setitem__(self, key: str, value: Type[TTypes]) -> None:
        self._types[key] = value

    def make(self, key: str, *args: Any, **kwargs: Any) -> Optional[TTypes]:
        t = self._types.get(key)
        return None if t is None else t(*args, **kwargs)

    def items(self) -> Iterator[Tuple[str, Type[TTypes]]]:
        return self._types.items()  # type: ignore

    def values(self) -> Iterator[Type[TTypes]]:
        return self._types.values()  # type: ignore


class IPoolItem:
    """
    Life cycle of a pool item:

        (without context) init -> collect
        (with context)    init -> (everytime) load -> (everytime) unload -> collect

    """

    def load(self, **kwargs: Any) -> None:
        """Will be called everytime the pool loads the item with context"""

    def unload(self) -> None:
        """Will be called everytime the pool finishes using the item with context"""

    def collect(self) -> None:
        """Will be called when the pool removes the item"""


class PoolItemContext:
    def __init__(self, item: Any, **kwargs: Any) -> None:
        self.item = item
        self.kwargs = kwargs

    def __enter__(self) -> Any:
        load_fn = getattr(self.item, "load", None)
        if load_fn is not None:
            load_fn(**self.kwargs)
        return self.item

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        unload_fn = getattr(self.item, "unload", None)
        if unload_fn is not None:
            unload_fn()


class PoolItemManager(Generic[TPoolItem]):
    _item: Optional[TPoolItem]

    def __init__(
        self,
        init_fn: PItemInit,
        *,
        init: bool = False,
        force_keep: bool = False,
    ):
        self.init_fn = init_fn
        self.use_time = datetime.now()
        self.force_keep = force_keep
        self._item = init_fn() if init or force_keep else None

    @property
    def ready(self) -> bool:
        return self._item is not None

    def get(self) -> TPoolItem:
        self.use_time = datetime.now()
        if self._item is None:
            self._item = self.init_fn()
        return self._item

    def use(self, **kwargs: Any) -> PoolItemContext:
        self.use_time = datetime.now()
        if self._item is None:
            self._item = self.init_fn()
        return PoolItemContext(self._item, **kwargs)

    def collect(self) -> None:
        collect_fn = getattr(self._item, "collect", None)
        if collect_fn is not None:
            collect_fn()
        del self._item
        self._item = None
        gc.collect()


class Pool(Generic[TPoolItem]):
    t_manager = PoolItemManager

    pool: Dict[str, PoolItemManager[TPoolItem]]

    # set `limit` to negative values to indicate 'no limit'
    def __init__(self, limit: int = -1, *, allow_duplicate: bool = False):
        self.pool = {}
        self.limit = limit
        self.allow_duplicate = allow_duplicate
        if limit == 0:
            raise ValueError(
                "limit should either be negative "
                "(which indicates 'no limit') or be positive"
            )

    def __contains__(self, key: str) -> bool:
        return key in self.pool

    @property
    def activated(self) -> Dict[str, PoolItemManager[TPoolItem]]:
        return {k: m for k, m in self.pool.items() if m.ready and not m.force_keep}

    def register(self, key: str, init_fn: PItemInit, **kwargs: Any) -> None:
        """
        Register a new item to the pool.

        This method will create a new item manager and store it in the pool.
        > `kwargs` will be passed to the item manager's constructor.
        """

        if key in self.pool:
            if self.allow_duplicate:
                return
            raise ValueError(f"key '{key}' already exists")
        init = self.limit < 0 or len(self.activated) < self.limit
        manager: PoolItemManager = self.t_manager(init_fn, init=init, **kwargs)
        self.pool[key] = manager

    def get(self, key: str) -> TPoolItem:
        """
        Get a registered item from the pool without context.

        - If `limit` is reached, this method will try to remove the 'earliest' item.
        """

        return self._fetch(key).get()

    def use(self, key: str, **kwargs: Any) -> PoolItemContext:
        """
        Use a registered item from the pool with context.

        - If `limit` is reached, this method will try to remove the 'earliest' item.
        > `kwargs` will be passed to the item's `load` method, if it exists.
        """

        return self._fetch(key).use(**kwargs)

    def _fetch(self, key: str) -> PoolItemManager:
        """
        Fetch the item manager from the pool.

        - If `limit` is reached, this method will try to remove the 'earliest' item.
        """

        target = self.pool.get(key)
        if target is None:
            raise ValueError(f"key '{key}' does not exist")
        if not target.ready:
            # need to remove earliest item before using the target
            use_times = {k: m.use_time for k, m in self.activated.items()}
            earliest_key = list(sort_dict_by_value(use_times).keys())[0]
            earliest = self.pool[earliest_key]
            earliest.collect()
            get_time_str = lambda m: datetime.strftime(m.use_time, TIME_FORMAT)
            console.log(
                f"'{earliest_key}' (last updated: {get_time_str(earliest)}) is collected "
                f"to make room for '{key}' (last updated: {get_time_str(target)})"
            )
        return target
