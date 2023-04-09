from pydantic import Field
from pydantic import BaseModel

from cfdraw.schema import IHttpsResponse


class TextAreaModel(BaseModel):
    text: str = Field(..., description="The text to be displayed")


class TextAreaResponse(IHttpsResponse):
    data: TextAreaModel = Field(..., description="The data of the response")


__all__ = [
    "TextAreaModel",
    "TextAreaResponse",
]
