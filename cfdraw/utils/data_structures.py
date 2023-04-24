from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import Tuple
from typing import Generic
from typing import TypeVar
from typing import Optional
from typing import Iterator


TItemData = TypeVar("TItemData")
TTypes = TypeVar("TTypes")


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
        * `queue` (both cases, so use no_mapping = False to save memory)
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

    def push(self, item: Item[TItemData]) -> None:
        if self.get(item.key) is not None:
            raise ValueError(f"item '{item.key}' already exists")
        self._items.append(item)
        if self._mapping is not None:
            self._mapping[item.key] = item

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


class QueuesInQueue(Generic[TItemData]):
    def __init__(self, *, no_mapping: bool = True) -> None:
        self._cursor = 0
        self._queues: Bundle[Bundle[TItemData]] = Bundle(no_mapping=no_mapping)

    def __iter__(self) -> Iterator[Item[Bundle[TItemData]]]:
        return iter(self._queues)

    @property
    def is_empty(self) -> bool:
        return self.num_items == 0

    @property
    def num_queues(self) -> int:
        return len(self._queues)

    @property
    def num_items(self) -> int:
        return sum(len(q.data) for q in self._queues)

    def get(self, queue_id: str) -> Optional[Item[Bundle[TItemData]]]:
        return self._queues.get(queue_id)

    def push(self, queue_id: str, item: Item[TItemData]) -> None:
        queue_item = self._queues.get(queue_id)
        if queue_item is not None:
            queue = queue_item.data
        else:
            queue = Bundle()
            self._queues.push(Item(queue_id, queue))
        queue.push(item)

    def next(self) -> Tuple[Optional[str], Optional[Item[TItemData]]]:
        if self._queues.is_empty:
            return None, None
        self._cursor %= len(self._queues)
        queue = self._queues.get_index(self._cursor)
        item = queue.data.first
        if item is None:
            self._queues.remove(queue.key)
            return self.next()
        self._cursor += 1
        return queue.key, item

    def remove(self, queue_id: str, item_key: str) -> None:
        queue_item = self._queues.get(queue_id)
        if queue_item is None:
            return
        queue_item.data.remove(item_key)
        if queue_item.data.is_empty:
            self._queues.remove(queue_id)

    def get_pending(self, item_key: str) -> Optional[List[Item[TItemData]]]:
        if self._queues.is_empty:
            return None
        layer = 0
        searched = False
        pending: List[Item[TItemData]] = []
        finished_searching = [False] * len(self._queues)
        while not all(finished_searching):
            for i, queue in enumerate(self._queues):
                if finished_searching[i]:
                    continue
                if layer >= len(queue.data):
                    finished_searching[i] = True
                    continue
                item = queue.data.get_index(layer)
                if item.key == item_key:
                    searched = True
                    break
                pending.append(item)
            if searched:
                break
            layer += 1
        return pending if searched else None


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
