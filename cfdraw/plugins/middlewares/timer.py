from typing import List

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleware
from cfdraw.plugins.middlewares.send_message import TResponse


class TimerMiddleware(IMiddleware):
    @property
    def can_handle_message(self) -> bool:
        return True

    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.FIELDS]

    async def process(self, response: TResponse) -> TResponse:
        if response is None:
            return None
        self.plugin.elapsed_times.end()
        response.data.elapsedTimes = self.plugin.elapsed_times
        return response


__all__ = [
    "TimerMiddleware",
]
