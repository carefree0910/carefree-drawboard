from typing import Callable
from tornado import web
from cftool.misc import print_info
from tornado.ioloop import IOLoop

from cfdraw import constants
from cfdraw.config import get_config
from cfdraw.config import Config

from .http import HttpProxyHandler
from .index import IndexHandler
from .socket import SocketProxyHandler


def launch_server(before_launch: Callable[[Config], None]) -> None:
    config = get_config()
    before_launch(config)
    ws_endpoint = str(constants.Endpoint.WEBSOCKET)
    ws_name = ws_endpoint[1:]
    server = web.Application(
        [
            (r"/", IndexHandler),
            (
                r"/assets/(.*)",
                web.StaticFileHandler,
                {"path": str(constants.WEB_ROOT / "dist" / "assets")},
            ),
            (f"/(?!{ws_name}).*", HttpProxyHandler),
            (ws_endpoint, SocketProxyHandler),
        ],
    )
    server.listen(int(config.tornado_port))
    ioloop = IOLoop.current()
    print_info(f"🎉 Your app is ready at {config.api_url}")
    ioloop.start()


__all__ = [
    "launch_server",
]


if __name__ == "__main__":
    launch_server(lambda _: None)
