# A simple sqlite based project manager
# Should be easy to replace with a more 'formal' database based one

import json
import logging
import sqlite3

from typing import Any
from typing import List
from pydantic import BaseModel
from cftool.web import raise_err
from cftool.web import get_responses
from cftool.misc import get_err_msg

from cfdraw.parsers import noli
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


def add_project_managements(endpoint: "ProjectEndpoint") -> None:
    app = endpoint.app

    @app.api.post("/save_project", responses=get_responses(SaveProjectResponse))
    def save_project(data: ProjectModel) -> SaveProjectResponse:
        with endpoint.get_conn(data.userId) as conn:
            try:
                sql = f"INSERT OR REPLACE INTO '{data.userId}' VALUES (?, ?)"
                conn.execute(sql, [data.uid, json.dumps(data.dict())])
                conn.commit()
            except Exception as err:
                logging.exception(f"failed to save project '{data.uid}'")
                err_msg = get_err_msg(err)
                return SaveProjectResponse(success=False, message=err_msg)
        return SaveProjectResponse(success=True, message="")

    @app.api.get("/get_project/", responses=get_responses(ProjectModel))
    async def fetch_project(userId: str, uid: str) -> ProjectModel:  # type: ignore
        # TODO: should do some url transformations in the
        # migration stage, not runtime stage. Will be fixed in the future

        try:
            with endpoint.get_conn(userId) as conn:
                sql = f"SELECT json FROM '{userId}' WHERE uid='{uid}'"
                results = conn.execute(sql)
                json_string = results.fetchone()[0]
                d = json.loads(json_string)
            return ProjectModel(**d)
        except Exception as err:
            raise_err(err)

    @app.api.get("/all_projects/")
    async def fetch_all_projects(userId: str) -> List[ProjectMeta]:
        with endpoint.get_conn(userId) as conn:
            try:
                sql = f"SELECT json FROM '{userId}'"
                results = conn.execute(sql)
                json_strings = [result[0] for result in results.fetchall()]
                json_dicts = list(map(json.loads, json_strings))
                sorted_pairs = sorted(
                    [
                        (json_dict["updateTime"], i)
                        for i, json_dict in enumerate(json_dicts)
                    ],
                    reverse=True,
                )
                metas = [ProjectMeta(**json_dicts[i]) for _, i in sorted_pairs]
                return metas
            except Exception:
                logging.exception("failed to fetch all projects")
                return []

    @app.api.delete("/projects/")
    async def delete_project(userId: str, uid: str) -> None:
        with endpoint.get_conn(userId) as conn:
            sql = f"DELETE FROM '{userId}' WHERE uid='{uid}'"
            conn.execute(sql)
            conn.commit()


class ProjectEndpoint(IEndpoint):
    def register(self) -> None:
        add_project_managements(self)

    def get_conn(self, userId: str) -> sqlite3.Connection:
        folder = self.app.config.upload_project_folder
        conn = sqlite3.connect(folder / "projects.sqlite")
        sql = f"create table if not exists '{userId}' (uid text PRIMARY KEY, json text)"
        conn.execute(sql)
        return conn


__all__ = [
    "ProjectEndpoint",
]
