from typing import List
from typing import Union
from typing import Optional

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleware
from cfdraw.schema.plugins import Subscription
from cfdraw.schema.plugins import ISocketMessage


TResponse = Optional[ISocketMessage]


class SendSocketMessageMiddleware(IMiddleware):
    @property
    def subscriptions(self) -> Union[List[PluginType], Subscription]:
        return Subscription.ALL

    @property
    def can_handle_message(self) -> bool:
        return True

    async def process(self, response: TResponse) -> TResponse:
        if response is None:
            return None
        if self.plugin.extra_responses:
            if response.data.final is None:
                response.data.final = {}
            response.data.final["extra"] = self.plugin.extra_responses
        response.data.injections = self.plugin.injections
        await self.plugin.send_message(response)
        return response


__all__ = [
    "SendSocketMessageMiddleware",
]
