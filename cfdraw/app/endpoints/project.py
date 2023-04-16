import json

from typing import Any
from typing import List
from pydantic import BaseModel

from cfdraw import constants
from cfdraw.parsers import noli
from cfdraw.app.schema import IApp
from cfdraw.utils.server import raise_err
from cfdraw.utils.server import get_err_msg
from cfdraw.utils.server import get_responses
from cfdraw.app.endpoints.base import IEndpoint


class ProjectItem(BaseModel):
    uid: str
    name: str


class ProjectModel(ProjectItem):
    uid: str
    name: str
    createTime: float
    updateTime: float
    graphInfo: List[Any]
    globalTransform: noli.Matrix2D


class SaveProjectResponse(BaseModel):
    success: bool
    message: str


def add_project_managements(app: IApp) -> None:
    @app.api.post("/save_project", responses=get_responses(SaveProjectResponse))
    def save_project(data: ProjectModel) -> SaveProjectResponse:
        try:
            file = f"{data.uid}.cfdraw"
            with open(app.config.upload_project_folder / file, "w") as f:
                json.dump(data.dict(), f)
        except Exception as err:
            err_msg = get_err_msg(err)
            return SaveProjectResponse(success=False, message=err_msg)
        return SaveProjectResponse(success=True, message="")

    @app.api.get(
        f"/get_project/{{uid:path}}",
        responses=get_responses(ProjectModel),
    )
    async def fetch_project(uid: str) -> ProjectModel:
        try:
            file = f"{uid}.cfdraw"
            with open(app.config.upload_project_folder / file, "r") as f:
                d = json.load(f)
            # replace url if needed
            graph = noli.parse_graph(d["graphInfo"])
            for node in graph.all_single_nodes:
                if node.type == noli.SingleNodeType.IMAGE:
                    src = node.renderParams.src
                    if (
                        src
                        and isinstance(src, str)
                        and src.startswith(app.config.api_host)
                    ):
                        pivot = constants.UPLOAD_IMAGE_FOLDER_NAME
                        _, path = src.split(pivot)
                        api_url = app.config.api_url
                        node.renderParams.src = api_url + "/" + pivot + path
            d["graphInfo"] = graph.dict()["root_nodes"]
            return ProjectModel(**d)
        except Exception as err:
            raise_err(err)

    @app.api.get(f"/all_projects")
    async def fetch_all_projects() -> List[ProjectItem]:
        if not app.config.upload_project_folder.exists():
            return []
        try:
            results: List[ProjectItem] = []
            for file in app.config.upload_project_folder.iterdir():
                if file.suffix != ".cfdraw":
                    continue
                path = app.config.upload_project_folder / file
                with open(path, "r") as f:
                    d = json.load(f)
                results.append(ProjectItem(uid=d["uid"], name=d["name"]))
            return results
        except Exception as err:
            raise_err(err)


class ProjectEndpoint(IEndpoint):
    def register(self) -> None:
        add_project_managements(self.app)


__all__ = [
    "ProjectEndpoint",
]
