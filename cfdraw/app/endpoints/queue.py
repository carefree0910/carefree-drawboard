import asyncio

from typing import Any
from typing import Dict
from typing import Tuple
from typing import TypeVar
from typing import Coroutine
from cftool.misc import print_error
from cftool.misc import random_hash
from cftool.misc import print_warning
from concurrent.futures import ThreadPoolExecutor

from cfdraw.utils.server import get_err_msg
from cfdraw.utils.data_structures import Item
from cfdraw.utils.data_structures import QueuesInQueue
from cfdraw.schema.plugins import SocketStatus
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.app.schema import ISend
from cfdraw.app.schema import IRequestQueue
from cfdraw.app.schema import IRequestQueueData


DEBUG = False
log: Any = print if DEBUG else lambda *args, **kwargs: None

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


class RequestQueue(IRequestQueue):
    def __init__(self) -> None:
        self._is_busy = False
        self._queues = QueuesInQueue[IRequestQueueData]()
        self._senders: Dict[str, Tuple[str, ISend]] = {}

    def push(self, data: IRequestQueueData, send_message: ISend) -> str:
        uid = random_hash()
        self._queues.push(data.request.userId, Item(uid, data))
        hash = data.request.hash
        self._senders[uid] = hash, send_message
        log("~" * 50)
        log("> push.uid", uid)
        log("> push.userId", data.request.userId)
        log("> push.hash", hash)
        return uid

    async def run(self) -> None:
        if self._is_busy:
            return
        self._is_busy = True
        while True:
            user_id, request_item = self._queues.next()
            if user_id is None or request_item is None:
                self._is_busy = False
                break
            uid = request_item.key
            plugin = request_item.data.plugin
            request = request_item.data.request
            log(">>> run", uid)
            try:
                await self._broadcast_working(uid)
                await offload(plugin(request))
            except Exception as err:
                await self._broadcast_exception(uid, get_err_msg(err))
            # cleanup
            request_item.data.event.set()
            self._queues.remove(user_id, uid)
            self._senders.pop(uid, None)
            await self._broadcast_pending()
            await asyncio.sleep(0)
            log(">>> cleanup", uid)

    async def wait(self, user_id: str, uid: str) -> None:
        # Maybe in some rare cases, the task completes so fast that
        # the corresponding data has already been removed.
        # So here we simply warn instead of raise.
        queue_item = self._queues.get(user_id)
        if queue_item is None:
            print_warning("cannot find user request queue after submitted")
            return
        request_item = queue_item.data.get(uid)
        if request_item is None:
            print_warning("cannot find request item after submitted")
            return
        await self._broadcast_pending()
        asyncio.create_task(self.run())
        await request_item.data.event.wait()
        log("=" * 50)
        log("> finished", uid)
        log("^" * 50)

    # broadcast

    async def _broadcast_pending(self) -> None:
        for uid, (hash, sender) in self._senders.items():
            pending = self._queues.get_pending(uid)
            log("-" * 50)
            log(">> uid", uid)
            log(">> hash", hash)
            log(
                ">> queues\n\n",
                "\n".join(
                    [
                        f"{queue_item.key} : "
                        + ", ".join(
                            [
                                getattr(item.data.request, "hash", "None")
                                for item in queue_item.data
                            ]
                        )
                        for queue_item in self._queues
                    ]
                ),
                "\n",
            )
            try:
                if pending is None:
                    await sender(
                        ISocketMessage.make_exception(
                            hash,
                            message=(
                                f"Internal error occurred: "
                                f"cannot find pending request after submitted"
                            ),
                        )
                    )
                elif len(pending) > 0:
                    await sender(
                        ISocketMessage(
                            hash=hash,
                            status=SocketStatus.PENDING,
                            total=self._queues.num_items,
                            pending=len(pending),
                            message=f"in queue: {', '.join([str(item.data) for item in pending])}",
                        )
                    )
            except Exception as err:
                print_error(get_err_msg(err))

    async def _broadcast_working(self, uid: str) -> None:
        sender_pack = self._senders.get(uid)
        if sender_pack is None:
            return
        hash, sender = sender_pack
        try:
            await sender(
                ISocketMessage(
                    hash=hash,
                    status=SocketStatus.WORKING,
                    total=self._queues.num_items,
                    pending=0,
                    message="",
                )
            )
        except Exception as err:
            print_error(get_err_msg(err))

    async def _broadcast_exception(self, uid: str, message: str) -> None:
        sender_pack = self._senders.get(uid)
        if sender_pack is None:
            return
        hash, sender = sender_pack
        try:
            await sender(ISocketMessage.make_exception(hash, message))
        except Exception as err:
            print_error(get_err_msg(err))


__all__ = [
    "RequestQueue",
]
