import asyncio
import logging
import threading

from typing import Any
from typing import TypeVar
from typing import Callable
from typing import Coroutine
from cftool.misc import get_err_msg
from cftool.misc import print_error
from cftool.misc import print_warning
from concurrent.futures import ThreadPoolExecutor


TFutureResponse = TypeVar("TFutureResponse")


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


# TODO : maybe there will be better solutions?
async def offload(future: Coroutine[Any, Any, TFutureResponse]) -> TFutureResponse:
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(
            executor,
            lambda new_loop, _future: new_loop.run_until_complete(_future),
            asyncio.new_event_loop(),
            future,
        )


# TODO : maybe there will be better solutions?
def offload_run(future: Coroutine[Any, Any, bool]) -> bool:
    """
    Return `True` if the `future` is successfully executed.

    * future: Coroutine[Any, Any, bool]
        should return `True` if successfully executed, and `False` otherwise.

    """

    def _run() -> None:
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            success = loop.run_until_complete(future)
            loop.close()
            if success:
                event.set()
            else:
                print_error("[offload_run] Failed to execute future")
        except Exception:
            logging.exception("[offload_run] failed to execute future")

    event = asyncio.Event()
    progress = threading.Thread(target=_run)
    progress.start()
    progress.join()
    return event.is_set()
