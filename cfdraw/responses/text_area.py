from pydantic import Field
from pydantic import BaseModel

from cfdraw.schema import IHttpResponse


class TextAreaModel(BaseModel):
    text: str = Field(..., description="The text to be displayed")


class TextAreaResponse(IHttpResponse):
    data: TextAreaModel = Field(..., description="The data of the response")


__all__ = [
    "TextAreaModel",
    "TextAreaResponse",
]
