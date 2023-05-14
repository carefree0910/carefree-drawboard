import os

from typing import Any
from typing import Dict
from typing import Optional
from fastapi.requests import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from cfdraw import constants
from cfdraw.app.schema import IApp
from cfdraw.app.endpoints.base import IEndpoint


def get_env() -> Dict[str, Optional[str]]:
    return dict(
        CFDRAW_BE_PORT=os.getenv("CFDRAW_BE_PORT") or "",
        CFDRAW_API_URL=os.getenv("CFDRAW_API_URL") or "",
        CFDRAW_ALLOWED_ORIGINS=os.getenv("CFDRAW_ALLOWED_ORIGINS") or "",
    )


def add_assets(app: IApp) -> None:
    @app.api.get("/", response_class=HTMLResponse)
    async def root(request: Request) -> Any:
        templates = Jinja2Templates(directory=str(build_dir))
        context = dict(request=request)
        context.update(get_env())
        return templates.TemplateResponse("index.html", context)

    build_dir = constants.WEB_ROOT / "dist"
    app.api.mount("/assets", StaticFiles(directory=str(build_dir / "assets")), "assets")


class AssetsEndpoint(IEndpoint):
    def register(self) -> None:
        add_assets(self.app)


__all__ = [
    "AssetsEndpoint",
]
