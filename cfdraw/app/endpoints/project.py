# A simple file system based project manager
# Should be easy to replace with a database based one

import json

from typing import Any
from typing import List
from pathlib import Path
from filelock import FileLock
from pydantic import BaseModel
from cftool.web import raise_err
from cftool.web import get_responses
from cftool.misc import get_err_msg
from cftool.misc import print_warning

from cfdraw import constants
from cfdraw.config import get_config
from cfdraw.parsers import noli
from cfdraw.app.schema import IApp
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


def get_project_folder(userId: str) -> Path:
    folder = get_config().upload_project_folder / userId
    if not folder.exists():
        folder.mkdir(parents=True)
    return folder


def get_meta_lock(userId: str) -> FileLock:
    return FileLock(get_project_folder(userId) / "maintain_meta.lock")


def get_save_project_lock(userId: str) -> FileLock:
    return FileLock(get_project_folder(userId) / "save_project.lock")


def get_delete_project_lock(userId: str) -> FileLock:
    return FileLock(get_project_folder(userId) / "delete_project.lock")


def move_to_buggy(path: Path, userId: str, err: Exception) -> None:
    buggy_folder = get_project_folder(userId) / constants.BUGGY_PROJECT_FOLDER
    buggy_folder.mkdir(parents=True, exist_ok=True)
    lock = FileLock(buggy_folder / "move_to_buggy.lock")
    with lock:
        backup_path = buggy_folder / path.name
        print_warning(
            f"failed to load project '{path}', it will be moved to '{backup_path}'"
            f" ({get_err_msg(err)})"
        )
        path.rename(buggy_folder / path.name)


def maintain_meta(app: IApp, userId: str) -> None:
    with get_meta_lock(userId):
        upload_project_folder = get_project_folder(userId)
        existing_projects = [
            path.absolute()
            for path in upload_project_folder.iterdir()
            if path.is_file() and path.suffix == suffix
        ]
        project_meta = {}
        for path in existing_projects:
            try:
                with open(path, "r") as f:
                    d = json.load(f)
                project_meta[d["uid"]] = dict(
                    uid=d["uid"],
                    name=d["name"],
                    createTime=d["createTime"],
                    updateTime=d["updateTime"],
                )
            except Exception as err:
                move_to_buggy(path, userId, err)
        with open(upload_project_folder / constants.PROJECT_META_FILE, "w") as f:
            json.dump(project_meta, f)


def add_project_managements(app: IApp) -> None:
    @app.api.post("/save_project", responses=get_responses(SaveProjectResponse))
    def save_project(data: ProjectModel) -> SaveProjectResponse:
        with get_save_project_lock(data.userId):
            try:
                upload_project_folder = get_project_folder(data.userId)
                with open(upload_project_folder / f"{data.uid}{suffix}", "w") as f:
                    json.dump(data.dict(), f)
                maintain_meta(app, data.userId)
            except Exception as err:
                err_msg = get_err_msg(err)
                return SaveProjectResponse(success=False, message=err_msg)
        return SaveProjectResponse(success=True, message="")

    @app.api.get("/get_project/", responses=get_responses(ProjectModel))
    async def fetch_project(userId: str, uid: str) -> ProjectModel:  # type: ignore
        try:
            with get_save_project_lock(userId):
                with get_delete_project_lock(userId):
                    upload_project_folder = get_project_folder(userId)
                    path = upload_project_folder / f"{uid}{suffix}"
                    try:
                        with open(path, "r") as f:
                            d = json.load(f)
                    except Exception as err:
                        move_to_buggy(path, userId, err)

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
        upload_project_folder = get_project_folder(userId)
        if not upload_project_folder.exists():
            return []
        meta_path = upload_project_folder / constants.PROJECT_META_FILE
        if not meta_path.is_file():
            maintain_meta(app, userId)
        try:
            with get_meta_lock(userId):
                with open(meta_path, "r") as f:
                    meta = json.load(f)
        except Exception as err:
            print_warning(
                f"failed to load project meta file '{meta_path}', "
                f"will regenerate it ({get_err_msg(err)})"
            )
            maintain_meta(app, userId)
        s = sorted([(v["updateTime"], k) for k, v in meta.items()], reverse=True)
        return [ProjectMeta(**meta[k]) for _, k in s]

    @app.api.delete("/projects/")
    async def delete_project(userId: str, uid: str) -> None:
        with get_delete_project_lock(userId):
            upload_project_folder = get_project_folder(userId)
            path = upload_project_folder / f"{uid}{suffix}"
            if path.is_file():
                path.unlink()
            maintain_meta(app, userId)


class ProjectEndpoint(IEndpoint):
    def register(self) -> None:
        add_project_managements(self.app)


__all__ = [
    "ProjectEndpoint",
]
