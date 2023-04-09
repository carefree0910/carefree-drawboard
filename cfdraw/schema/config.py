from typing import List


class IConfig:
    # global
    app_name: str
    # frontend
    frontend_port: str
    # socket
    cors_credentials: bool
    cors_allowed_origins: List[str]
    polling_max_http_buffer_size: int
    ping_interval: int
    ping_timeout: int
    # api
    api_host: str
    backend_port: str
    # misc
    debug: bool

    @property
    def api_url(self) -> str:
        pass

    @property
    def default_module(self) -> str:
        pass


__all__ = [
    "IConfig",
]
