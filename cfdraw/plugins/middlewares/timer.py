import time

from typing import List
from typing import Optional

from cfdraw.schema.plugins import PluginType
from cfdraw.schema.plugins import IMiddleWare
from cfdraw.schema.plugins import IHttpPluginRequest
from cfdraw.schema.plugins import IHttpPluginResponse


class TimerMiddleWare(IMiddleWare):
    t: Optional[float]

    @property
    def subscriptions(self) -> List[PluginType]:
        return [PluginType.HTTP_FIELDS]

    def before(self, request: IHttpPluginRequest) -> None:
        self.t = time.time()

    def process(self, response: IHttpPluginResponse) -> IHttpPluginResponse:
        if self.t is None:
            return response
        response.data["_duration"] = time.time() - self.t
        return response


__all__ = [
    "TimerMiddleWare",
]
