from abc import abstractmethod
from abc import ABC

from cfdraw.app.schema import IApp


class IEndpoint(ABC):
    def __init__(self, app: IApp) -> None:
        self.app = app

    # abstract

    @abstractmethod
    def register(self) -> None:
        """register endpoints to `app.api` here"""

    # optional callbacks

    async def on_startup(self) -> None:
        pass

    async def on_shutdown(self) -> None:
        pass


__all__ = [
    "IEndpoint",
]
