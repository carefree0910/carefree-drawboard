from abc import abstractmethod
from abc import ABC
from abc import ABCMeta
from typing import Any
from typing import Dict
from typing import List
from typing import Generic
from typing import TypeVar
from typing import Optional
from pydantic import Field
from pydantic import BaseModel

from cfdraw.parsers import noli


TPluginModel = TypeVar("TPluginModel")
THttpResponse = TypeVar("THttpResponse", bound="IHttpResponse", covariant=True)


class IConfig:
    # socket
    cors_credentials: bool
    cors_allowed_origins: List[str]
    polling_max_http_buffer_size: int
    ping_interval: int
    ping_timeout: int
    # api
    api_url: str


class IPlugin(ABC):
    identifier: str

    @property
    @abstractmethod
    def settings(self) -> noli.IPluginSettings:
        pass

    @abstractmethod
    def __call__(self, data: Any) -> Any:
        pass


# https


class IHttpPluginRequest(BaseModel):
    identifier: str = Field(..., description="The identifier of the plugin")
    node: Optional[Dict[str, Any]] = Field(
        None,
        description="JSON data of the selected node",
    )

    def parse(self) -> "IParsedHttpPluginRequest":
        if self.node is None:
            return self
        d = self.dict()
        d["node"] = noli.parse_node(self.node)
        return IParsedHttpPluginRequest(**d)


class IParsedHttpPluginRequest(IHttpPluginRequest):
    node: Optional[noli.INode] = Field(None, description="The parsed selected node")


class IHttpResponse(BaseModel):
    success: bool = Field(..., description="Whether returned successfully")
    message: str = Field(..., description="The message of the response")
    data: BaseModel = Field(..., description="The data of the response")


class IHttpPlugin(Generic[THttpResponse], IPlugin, metaclass=ABCMeta):
    @abstractmethod
    def process(self, data: IParsedHttpPluginRequest) -> THttpResponse:
        pass

    def __call__(self, data: IHttpPluginRequest) -> THttpResponse:
        return self.process(data.parse())


# socket


class ISocketPlugin(IPlugin):
    pass


__all__ = [
    "IHttpPlugin",
    "IParsedHttpPluginRequest",
    "ISocketPlugin",
]
