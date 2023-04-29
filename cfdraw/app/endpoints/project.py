# A simple file system based project manager
# Should be easy to replace with a database based one

import json

from typing import Any
from typing import List
from pydantic import BaseModel
from cftool.misc import print_warning

from cfdraw import constants
from cfdraw.parsers import noli
from cfdraw.app.schema import IApp
from cfdraw.utils.misc import get_err_msg
from cfdraw.utils.server import raise_err
from cfdraw.utils.server import get_responses
from cfdraw.app.endpoints.base import IEndpoint


suffix = ".cfdraw"


class ProjectMeta(BaseModel):
    uid: str
    name: str
    createTime: float
    updateTime: float


class ProjectModel(ProjectMeta):
    userId: str
    graphInfo: List[Any]
    globalTransform: noli.Matrix2D


class SaveProjectResponse(BaseModel):
    success: bool
    message: str


def maintain_meta(app: IApp, userId: str) -> None:
    upload_project_folder = app.config.upload_project_folder / userId
    if not upload_project_folder.exists():
        upload_project_folder.mkdir(parents=True)
    existing_projects = [
        path.absolute()
        for path in upload_project_folder.iterdir()
        if path.is_file() and path.suffix == suffix
    ]
    meta_path = upload_project_folder / constants.PROJECT_META_FILE
    checked = False
    if meta_path.is_file():
        try:
            with open(meta_path, "r") as f:
                project_meta = json.load(f)
            if len(project_meta) == len(existing_projects):
                checked = True
            else:
                print_warning("project meta file is not up-to-date")
        except Exception as err:
            print_warning(f"failed to check project meta file: {get_err_msg(err)}")
    if checked:
        return
    project_meta = {}
    for path in existing_projects:
        with open(path, "r") as f:
            d = json.load(f)
        project_meta[d["uid"]] = dict(
            uid=d["uid"],
            name=d["name"],
            createTime=d["createTime"],
            updateTime=d["updateTime"],
        )
    with open(meta_path, "w") as f:
        json.dump(project_meta, f)


def maintain_all_meta(app: IApp) -> None:
    for user_folder in app.config.upload_project_folder.iterdir():
        if user_folder.is_dir():
            maintain_meta(app, user_folder.name)


def add_project_managements(app: IApp) -> None:
    @app.api.post("/save_project", responses=get_responses(SaveProjectResponse))
    def save_project(data: ProjectModel) -> SaveProjectResponse:
        upload_project_folder = app.config.upload_project_folder / data.userId
        if not upload_project_folder.exists():
            upload_project_folder.mkdir(parents=True)
        try:
            file = f"{data.uid}{suffix}"
            with open(upload_project_folder / file, "w") as f:
                json.dump(data.dict(), f)
            # maintain meta
            meta_path = upload_project_folder / constants.PROJECT_META_FILE
            if not meta_path.is_file():
                maintain_meta(app, data.userId)
            else:
                with open(meta_path, "r") as f:
                    meta = json.load(f)
                meta[data.uid] = dict(
                    uid=data.uid,
                    name=data.name,
                    createTime=data.createTime,
                    updateTime=data.updateTime,
                )
                with open(meta_path, "w") as f:
                    json.dump(meta, f)
        except Exception as err:
            err_msg = get_err_msg(err)
            return SaveProjectResponse(success=False, message=err_msg)
        return SaveProjectResponse(success=True, message="")

    @app.api.get("/get_project/", responses=get_responses(ProjectModel))
    async def fetch_project(userId: str, uid: str) -> ProjectModel:  # type: ignore
        try:
            upload_project_folder = app.config.upload_project_folder / userId
            file = f"{uid}{suffix}"
            with open(upload_project_folder / file, "r") as f:
                d = json.load(f)

            # TODO: this kind of transformation should be included in the
            # migration stage, not runtime stage. Will be fixed in the future

            # # replace url if needed
            # graph = noli.parse_graph(d["graphInfo"])
            # for node in graph.all_single_nodes:
            #     if node.type == noli.SingleNodeType.IMAGE:
            #         if node.renderParams is None:
            #             raise ValueError("`ImageNode` should have `renderParams`")
            #         src = node.renderParams.src
            #         if src and isinstance(src, str) and src.startswith("http://"):
            #             pivot = constants.UPLOAD_IMAGE_FOLDER_NAME
            #             _, path = src.split(pivot)
            #             api_url = app.config.api_url
            #             node.renderParams.src = api_url + "/" + pivot + path
            # d["graphInfo"] = graph.dict()["root_nodes"]

            return ProjectModel(**d)
        except Exception as err:
            raise_err(err)

    @app.api.get("/all_projects/")
    async def fetch_all_projects(userId: str) -> List[ProjectMeta]:
        upload_project_folder = app.config.upload_project_folder / userId
        if not upload_project_folder.exists():
            return []
        meta_path = upload_project_folder / constants.PROJECT_META_FILE
        if not meta_path.is_file():
            maintain_meta(app, userId)
        with open(meta_path, "r") as f:
            meta = json.load(f)
        s = sorted([(v["updateTime"], k) for k, v in meta.items()], reverse=True)
        return [ProjectMeta(**meta[k]) for _, k in s]

    @app.api.delete("/projects/")
    async def delete_project(userId: str, uid: str) -> None:
        upload_project_folder = app.config.upload_project_folder / userId
        if not upload_project_folder.exists():
            return
        file = f"{uid}{suffix}"
        path = upload_project_folder / file
        if path.is_file():
            path.unlink()
        # maintain meta
        meta_path = upload_project_folder / constants.PROJECT_META_FILE
        if not meta_path.is_file():
            maintain_meta(app, userId)
        else:
            with open(meta_path, "r") as f:
                meta = json.load(f)
            if uid in meta:
                meta.pop(uid)
                with open(meta_path, "w") as f:
                    json.dump(meta, f)


class ProjectEndpoint(IEndpoint):
    def register(self) -> None:
        add_project_managements(self.app)

    async def on_startup(self) -> None:
        maintain_all_meta(self.app)


__all__ = [
    "ProjectEndpoint",
]
