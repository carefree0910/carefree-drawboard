import asyncio
import logging

from typing import Dict
from typing import Tuple
from typing import Optional
from cftool.misc import get_err_msg
from cftool.misc import print_error
from cftool.misc import random_hash
from cftool.misc import print_warning
from cftool.data_structures import Item
from cftool.data_structures import QueuesInQueue

from cfdraw.app.schema import IRequestQueue
from cfdraw.app.schema import IRequestQueueData
from cfdraw.utils.misc import offload
from cfdraw.schema.plugins import ISend
from cfdraw.schema.plugins import SocketStatus
from cfdraw.schema.plugins import ISocketMessage


DEBUG = False


class RequestQueue(IRequestQueue):
    def __init__(self) -> None:
        self._queues = QueuesInQueue[IRequestQueueData]()
        self._senders: Dict[str, Tuple[str, ISend]] = {}
        self._busy_uid: Optional[str] = None

    def push(self, data: IRequestQueueData, send_message: ISend) -> str:
        uid = random_hash()
        self._queues.push(data.request.userId, Item(uid, data))
        self._senders[uid] = data.request.hash, send_message
        if DEBUG:
            print("~" * 50)
            print("> push.uid", uid)
            print("> push.userId", data.request.userId)
            print("> push.userJson", data.request.userJson)
            print("> push.hash", data.request.hash)
        return uid

    async def run(self) -> None:
        if self._busy_uid is not None:
            return
        while True:
            user_id, request_item = self._queues.next()
            if user_id is None or request_item is None:
                self._busy_uid = None
                break
            uid = request_item.key
            plugin = request_item.data.plugin
            request = request_item.data.request
            self._busy_uid = uid
            if DEBUG:
                print(">>> run", uid)
            try:
                plugin.elapsed_times.start()
                if await self._broadcast_working(uid):
                    future = plugin(request)
                    if not plugin.settings.no_offload:
                        future = offload(future)
                    await future
            except Exception as err:
                logging.exception(f"failed to execute plugin '{plugin}'")
                await self._broadcast_exception(uid, get_err_msg(err))
            # cleanup
            request_item.data.event.set()
            self._queues.remove(user_id, uid)
            self._senders.pop(uid, None)
            await self._broadcast_pending()
            await asyncio.sleep(0)
            if DEBUG:
                print(">>> cleanup", uid)

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
        if DEBUG:
            print("=" * 50)
            print("> finished", uid)
            print("^" * 50)

    # broadcast

    async def _broadcast_pending(self) -> None:
        for uid, (hash, sender) in self._senders.items():
            if uid == self._busy_uid:
                continue
            pending = self._queues.get_pending(uid)
            if DEBUG:
                print("-" * 50)
                print(">> uid", uid)
                print(">> hash", hash)
                print(
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
            prefix = f"[broadcast_pending] [{hash}]"
            success = True
            message = "null"
            try:
                if pending is None:
                    message = (
                        f"{prefix} Internal error occurred: "
                        "cannot find pending request after submitted"
                    )
                    success = await sender(ISocketMessage.make_exception(hash, message))
                elif len(pending) > 0:
                    message = prefix
                    success = await sender(
                        ISocketMessage(
                            hash=hash,
                            status=SocketStatus.PENDING,
                            total=self._queues.num_items,
                            pending=len(pending),
                            message=message,
                        )
                    )
            except Exception:
                logging.exception(f"{prefix} failed to send message '{message}'")
            if not success:
                print_error(f"Failed to send following message: {message}")

    async def _broadcast_working(self, uid: str) -> bool:
        sender_pack = self._senders.get(uid)
        if sender_pack is None:
            return False
        hash, sender = sender_pack
        prefix = f"[broadcast_working] [{hash}]"
        success = True
        try:
            message = f"{prefix} working..."
            success = await sender(
                ISocketMessage(
                    hash=hash,
                    status=SocketStatus.WORKING,
                    total=0,
                    pending=0,
                    message=message,
                )
            )
        except Exception:
            logging.exception(f"{prefix} failed to send message '{message}'")
        if not success:
            print_error(f"Failed to send following message: {message}")
        return success

    async def _broadcast_exception(self, uid: str, message: str) -> bool:
        logging.exception(message)
        sender_pack = self._senders.get(uid)
        if sender_pack is None:
            return False
        hash, sender = sender_pack
        prefix = f"[broadcast_exception] [{hash}]"
        success = True
        try:
            message = f"{prefix} {message}"
            success = await sender(ISocketMessage.make_exception(hash, message))
        except Exception:
            logging.exception(f"{prefix} failed to send message '{message}'")
        if not success:
            print_error(f"Failed to send following message: {message}")
        return success


__all__ = [
    "RequestQueue",
]
