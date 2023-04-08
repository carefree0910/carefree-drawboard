from pydantic import Field
from pydantic import BaseModel

from cfdraw.schema import IResponse


class TextAreaModel(BaseModel):
    text: str = Field(..., description="The text to be displayed")


class TextAreaResponse(IResponse):
    data: TextAreaModel = Field(..., description="The data of the response")


__all__ = [
    "TextAreaModel",
    "TextAreaResponse",
]
