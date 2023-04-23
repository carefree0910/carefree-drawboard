import time

from typing import List
from typing import Optional

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import ISocketRequest
from cfdraw.schema.plugins import ISocketMessage
from cfdraw.schema.plugins import ISocketMiddleWare


class TimerMiddleWare(ISocketMiddleWare):
    t: Optional[float]

    @property
    def can_handle_message(self) -> bool:
        return True

    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.FIELDS]

    async def before(self, request: ISocketRequest) -> None:
        await super().before(request)
        self.t = time.time()

    async def process(self, response: ISocketMessage) -> ISocketMessage:
        if self.t is None:
            return response
        if response.data.final is not None:
            response.data.final["_duration"] = time.time() - self.t
        return response


__all__ = [
    "TimerMiddleWare",
]
