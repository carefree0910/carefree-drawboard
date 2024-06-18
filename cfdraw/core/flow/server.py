import re
import asyncio

from typing import Any
from typing import Dict
from typing import List
from typing import Type
from typing import Optional
from fastapi import FastAPI
from pydantic import create_model
from pydantic import Field
from pydantic import BaseModel

from .core import WORKFLOW_ENDPOINT_NAME
from .core import warmup
from .core import Node
from .core import Flow
from .core import WorkflowModel
from .core import InjectionModel
from .nodes.common import to_endpoint
from ..parameters import OPT
from ..toolkit.web import raise_err
from ..toolkit.web import get_responses
from ..toolkit.misc import random_hash


def parse_endpoint(t_node: Type[Node]) -> str:
    return to_endpoint(t_node.__identifier__)


def parse_input_model(t_node: Type[Node]) -> Optional[Type[BaseModel]]:
    schema = t_node.get_schema()
    if schema is None:
        return None
    if schema.input_model is not None:
        return schema.input_model
    if schema.input_names is not None:
        return create_model(  # type: ignore
            f"{t_node.__name__}Input",
            **{name: (Any, ...) for name in schema.input_names},
        )
    return None


def parse_output_model(t_node: Type[Node]) -> Optional[Type[BaseModel]]:
    schema = t_node.get_schema()
    if schema is None:
        return None
    if schema.api_output_model is not None:
        return schema.api_output_model
    if schema.output_model is not None:
        return schema.output_model
    if schema.output_names is not None:
        return create_model(  # type: ignore
            f"{t_node.__name__}Output",
            **{name: (Any, ...) for name in schema.output_names},
        )
    return None


def parse_description(t_node: Type[Node]) -> Optional[str]:
    schema = t_node.get_schema()
    if schema is None:
        return None
    return schema.description


def use_all_t_nodes() -> List[Type[Node]]:
    return list(t_node for t_node in Node.d.values() if issubclass(t_node, Node))  # type: ignore


def register_api(app: FastAPI, t_node: Type[Node], focus: str) -> None:
    endpoint = parse_endpoint(t_node)
    if not re.search(focus, endpoint):
        return
    input_model = parse_input_model(t_node)
    output_model = parse_output_model(t_node)
    description = parse_description(t_node)
    if input_model is None or output_model is None:
        return None
    names = t_node.__identifier__.split(".")
    names[0] = f"[{names[0]}]"
    name = "_".join(names)
    asyncio.run(warmup(t_node, True))

    @app.post(
        endpoint,
        name=name,
        responses=get_responses(output_model),
        description=description,
    )
    async def _(data: input_model) -> output_model:  # type: ignore
        try:
            key = random_hash()
            flow = Flow().push(t_node(key, data.model_dump()))  # type: ignore
            results = await flow.execute(key, return_api_response=True)
            return output_model(**results[key])
        except Exception as err:
            raise_err(err)


def register_nodes_api(app: FastAPI) -> None:
    focus = OPT.flow_opt["focus"]
    for t_node in use_all_t_nodes():
        register_api(app, t_node, focus)


def register_workflow_api(app: FastAPI) -> None:
    @app.post(f"/{WORKFLOW_ENDPOINT_NAME}")
    async def workflow(data: WorkflowModel) -> Dict[str, Any]:
        try:
            return await data.run(return_api_response=True)
        except Exception as err:
            raise_err(err)
            return {}


class ServerStatus(BaseModel):
    num_nodes: int = Field(
        ...,
        description="The number of registered nodes in the environment.\n"
        "> - Notice that this may be different from the number of nodes "
        "which are exposed as API, because some nodes may not have "
        "`get_schema` method implemented.\n"
        "> - However, all nodes can be used in the `workflow` API, no matter "
        "whether they have `get_schema` method implemented or not.",
    )


def register_server_api(app: FastAPI) -> None:
    @app.get("/server_status", responses=get_responses(ServerStatus))
    async def server_status() -> ServerStatus:
        return ServerStatus(num_nodes=len(use_all_t_nodes()))


class API:
    def __init__(self) -> None:
        self.app = FastAPI()

    def initialize(self) -> None:
        register_server_api(self.app)
        register_nodes_api(self.app)
        register_workflow_api(self.app)


api = API()


__all__ = [
    "parse_endpoint",
    "parse_input_model",
    "parse_output_model",
    "use_all_t_nodes",
    "register_api",
    "register_nodes_api",
    "register_workflow_api",
    "API",
]
