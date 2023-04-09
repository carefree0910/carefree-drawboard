from pydantic import Field
from pydantic import BaseModel

from cfdraw.schema import ITHttpsResponse


class TextAreaModel(BaseModel):
    text: str = Field(..., description="The text to be displayed")


class TextAreaResponse(ITHttpsResponse):
    data: TextAreaModel = Field(..., description="The data of the response")


__all__ = [
    "TextAreaModel",
    "TextAreaResponse",
]
