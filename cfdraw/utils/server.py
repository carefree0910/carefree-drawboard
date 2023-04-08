from typing import Any
from typing import Dict
from typing import Type
from typing import Optional
from pydantic import BaseModel

from cfdraw import constants


class RuntimeError(BaseModel):
    detail: str

    class Config:
        schema_extra = {
            "example": {"detail": "RuntimeError occurred."},
        }


def get_responses(
    success_model: Type[BaseModel],
    *,
    json_example: Optional[Dict[str, Any]] = None,
) -> Dict[int, Dict[str, Type]]:
    success_response = {"model": success_model}
    if json_example is not None:
        content = success_response["content"] = {}
        json_field = content["application/json"] = {}
        json_field["example"] = json_example
    return {
        200: success_response,
        constants.ERR_CODE: {"model": RuntimeError},
    }
