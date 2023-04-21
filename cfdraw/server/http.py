from tornado.web import RequestHandler
from tornado.httpclient import AsyncHTTPClient

from cfdraw.config import get_config


class HttpProxyHandler(RequestHandler):
    def initialize(self) -> None:
        self.config = get_config()

    async def proxy(self) -> None:
        client = AsyncHTTPClient()
        url = f"http://localhost:{self.config.backend_port}{self.request.uri}"
        response = await client.fetch(
            url,
            method=self.request.method,
            headers=self.request.headers,
            body=self.request.body if self.request.method != "GET" else None,
            raise_error=False,
            request_timeout=300,
        )
        self.set_status(response.code)
        for k, v in response.headers.get_all():
            if k.lower() not in (
                "connection",
                "content-length",
                "transfer-encoding",
                "keep-alive",
            ):
                self.set_header(k, v)
        self.write(response.body)

    async def get(self) -> None:
        await self.proxy()

    async def post(self) -> None:
        await self.proxy()


__all__ = [
    "HttpProxyHandler",
]
