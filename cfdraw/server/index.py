from tornado import web

from cfdraw import constants


class IndexHandler(web.RequestHandler):
    def get(self) -> None:
        build_dir = constants.WEB_ROOT / "dist"
        index_file = build_dir / "index.html"
        if not index_file.is_file():
            raise web.HTTPError(404)
        self.render(str(index_file))


__all__ = [
    "IndexHandler",
]
