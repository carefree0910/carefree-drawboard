from typing import Any
from typing import Generic
from typing import TypeVar
from typing import Protocol


TResource = TypeVar("TResource")


class IResourceFn(Generic[TResource], Protocol):
    def __call__(self, *args: Any, **kwargs: Any) -> TResource:
        pass


def cache_resource(fn: IResourceFn[TResource]) -> IResourceFn[TResource]:
    class Cache:
        def __init__(self) -> None:
            self._cache = {}

        def __call__(self, *args: Any, **kwargs: Any) -> TResource:
            key = (args, tuple(kwargs.items()))
            cached = self._cache.get(key)
            if cached is None:
                cached = self._cache[key] = fn(*args, **kwargs)
            return self._cache[key]

    return Cache()
