from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from cfdraw import constants
from cfdraw.app.schema import IApp
from cfdraw.app.endpoints.base import IEndpoint


def add_assets(app: IApp) -> None:
    @app.api.get("/", response_class=HTMLResponse)
    async def root() -> str:
        index_file = build_dir / "index.html"
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()

    build_dir = constants.WEB_ROOT / "dist"
    app.api.mount("/assets", StaticFiles(directory=str(build_dir / "assets")), "assets")


class AssetsEndpoint(IEndpoint):
    def register(self) -> None:
        add_assets(self.app)


__all__ = [
    "AssetsEndpoint",
]
