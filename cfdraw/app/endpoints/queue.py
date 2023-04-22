# A simple memory based request queue
# Should be easy to replace with a redis based one

import asyncio

from typing import Any
from typing import Dict
from typing import List
from typing import Tuple
from typing import Optional
from cftool.misc import print_error
from cftool.misc import random_hash

from cfdraw.utils.server import get_err_msg
from cfdraw.utils.data_structures import Item
from cfdraw.utils.data_structures import Bundle
from cfdraw.schema.plugins import ISocketData
from cfdraw.schema.plugins import SocketStatus
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.plugins.base import IHttpPlugin
from cfdraw.app.schema import ISend
from cfdraw.app.schema import IRequestQueue
from cfdraw.app.schema import IRequestQueueData


DEBUG = False
log: Any = print if DEBUG else lambda *args, **kwargs: None


class RequestQueue(IRequestQueue):
    def __init__(self) -> None:
        self._is_busy = False
        self._queue = Bundle[IRequestQueueData](no_mapping=True)
        self._senders: Dict[str, Tuple[str, ISend]] = {}
        self._responses: Dict[str, IPluginResponse] = {}

    def push(self, data: IRequestQueueData, send_text: Optional[ISend] = None) -> str:
        uid = random_hash()
        self._queue.push(Item(uid, data))
        if send_text is not None:
            hash = data.request.hash if isinstance(data.request, ISocketRequest) else ""
            self._senders[uid] = hash, send_text
        log("~" * 50)
        log("> push", uid)
        log(
            "> push.hash",
            data.request.hash
            if isinstance(data.request, ISocketRequest)
            else data.request.identifier,
        )
        return uid

    def pop_response(self, uid: str) -> Optional[IPluginResponse]:
        return self._responses.pop(uid, None)

    async def run(self) -> None:
        if self._is_busy:
            return
        self._is_busy = True
        while True:
            if self._queue.is_empty:
                self._is_busy = False
                break
            request_item = self._queue.first
            if request_item is None:
                continue
            uid = request_item.key
            plugin = request_item.data.plugin
            request = request_item.data.request
            log(">>> run", uid)
            try:
                response = await plugin(request)
            except Exception as err:
                msg = get_err_msg(err)
                response = IPluginResponse(success=False, message=msg, data={})
            if isinstance(plugin, IHttpPlugin):
                self._responses[uid] = response
            # cleanup
            request_item.data.event.set()
            self._queue.remove(uid)
            self._senders.pop(uid, None)
            await self._broadcast_pending()
            await asyncio.sleep(0)
            log(">>> cleanup", uid)

    async def wait(self, uid: str) -> None:
        request_item = self._queue.get(uid)
        if request_item is None:
            msg = "Internal error occurred: cannot find request item after submitted"
            raise ValueError(msg)
        await self._broadcast_pending()
        event_task = asyncio.create_task(request_item.data.event.wait())
        tasks = [event_task, self.run()]
        await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        if not event_task.done():
            await asyncio.wait([event_task])
        log("=" * 50)
        log("> finished", uid)
        log("^" * 50)

    # broadcast

    def _get_pending(self, uid: str) -> Optional[List[Item[IRequestQueueData]]]:
        pending = []
        for item in self._queue:
            pending.append(item)
            if item.key == uid:
                return pending[:-1]
        return None

    async def _broadcast_pending(self) -> None:
        for uid, (hash, sender) in self._senders.items():
            pending = self._get_pending(uid)
            log("-" * 50)
            log(">> uid", uid)
            log(">> hash", hash)
            log(
                ">> queue",
                [getattr(item.data.request, "hash", None) for item in self._queue],
            )
            try:
                if pending is None:
                    await sender(
                        ISocketMessage.from_response(
                            hash,
                            IPluginResponse(
                                success=False,
                                message=(
                                    f"Internal error occurred: "
                                    f"cannot find pending request after submitted"
                                ),
                                data={},
                            ),
                        )
                    )
                elif len(pending) > 0:
                    await sender(
                        ISocketMessage(
                            success=True,
                            message=f"in queue: {', '.join([str(item.data) for item in pending])}",
                            data=ISocketData(
                                hash=hash,
                                status=SocketStatus.PENDING,
                                total=len(self._queue),
                                pending=len(pending),
                                message="",
                            ),
                        )
                    )
            except Exception as err:
                print_error(get_err_msg(err))


__all__ = [
    "RequestQueue",
]
