from typing import Any
from typing import Callable
from cftool.misc import print_warning


def deprecated(message: str) -> Callable[[type], type]:
    def _deprecated(cls: type) -> type:
        def init(self: Any, *args: Any, **kwargs: Any) -> None:
            if not cls._warned_deprecation:  # type: ignore
                print_warning(f"{cls.__name__} is deprecated, {message}")
                cls._warned_deprecation = True  # type: ignore
            original_init(self, *args, **kwargs)

        cls._warned_deprecation = False  # type: ignore
        original_init = cls.__init__  # type: ignore
        cls.__init__ = init  # type: ignore
        return cls

    return _deprecated
