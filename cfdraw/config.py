from typing import List
from importlib import import_module
from dataclasses import field
from dataclasses import dataclass

from cfdraw import constants
from cfdraw.schema import IConfig


@dataclass
class Config(IConfig):
    # global
    app_name: str = "cfdraw"
    # socket
    cors_credentials: bool = True
    cors_allowed_origins: List[str] = field(
        default_factory=lambda: [constants.CORS_ALLOWED_ORIGINS]
    )
    polling_max_http_buffer_size: int = constants.POLLING_MAX_HTTP_BUFFER_SIZE
    ping_interval: int = constants.PING_INTERVAL
    ping_timeout: int = constants.PING_TIMEOUT
    # api
    api_url: str = constants.API_URL
    backend_port: str = constants.BACKEND_PORT
    # misc
    debug: bool = True

    @property
    def default_module(self) -> str:
        return f"{self.app_name}.{self.app_name}"


def get_config() -> Config:
    try:
        return import_module(constants.CONFIG_MODULE).config
    except ImportError:
        return Config()
