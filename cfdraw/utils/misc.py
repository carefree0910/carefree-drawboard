from typing import Any
from typing import Callable
from cftool.misc import print_warning


def deprecated(message: str) -> Callable[[type], type]:
    def _deprecated(cls: type) -> type:
        def init(self, *args: Any, **kwargs: Any) -> None:
            if not cls._warned_deprecation:
                print_warning(f"{cls.__name__} is deprecated, {message}")
                cls._warned_deprecation = True
            original_init(self, *args, **kwargs)

        cls._warned_deprecation = False
        original_init = cls.__init__
        cls.__init__ = init
        return cls

    return _deprecated
