# A simple memory based request queue
# Should be easy to replace with a redis based one

import asyncio

from typing import Dict
from typing import Optional
from cftool.misc import random_hash

from cfdraw.utils.server import get_err_msg
from cfdraw.utils.data_structures import Item
from cfdraw.utils.data_structures import Bundle
from cfdraw.schema.plugins import IPluginResponse
from cfdraw.plugins.base import IHttpPlugin
from cfdraw.app.schema import IRequestQueue
from cfdraw.app.schema import IRequestQueueData
from cfdraw.app.endpoints.utils import offload


class RequestQueue(IRequestQueue):
    def __init__(self) -> None:
        self._is_busy = False
        self._queue = Bundle[IRequestQueueData](no_mapping=True)
        self._responses: Dict[str, IPluginResponse] = {}

    def push(self, data: IRequestQueueData) -> str:
        uid = random_hash()
        self._queue.push(Item(uid, data))
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
            try:
                response = await offload(plugin(request))
            except Exception as err:
                msg = get_err_msg(err)
                response = IPluginResponse(success=False, message=msg, data={})
            if isinstance(plugin, IHttpPlugin):
                self._responses[uid] = response
            # cleanup
            request_item.data.event.set()
            self._queue.remove(uid)
            await asyncio.sleep(0)

    async def wait(self, uid: str) -> None:
        request_item = self._queue.get(uid)
        if request_item is None:
            msg = "Internal error occurred: cannot find request item after submitted"
            raise ValueError(msg)
        event_task = asyncio.create_task(request_item.data.event.wait())
        tasks = [event_task, self.run()]
        await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        if not event_task.done():
            await asyncio.wait([event_task])


__all__ = [
    "RequestQueue",
]
