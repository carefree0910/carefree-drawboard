import asyncio

from typing import Any
from typing import TypeVar
from typing import Coroutine
from concurrent.futures import ThreadPoolExecutor


TFutureResponse = TypeVar("TFutureResponse")


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
