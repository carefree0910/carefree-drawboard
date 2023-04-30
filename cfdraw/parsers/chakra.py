from enum import Enum
from typing import Optional
from pydantic import Field
from pydantic import BaseModel


class TextAlign(str, Enum):
    CENTER = "center"
    END = "end"
    JUSTIFY = "justify"
    LEFT = "left"
    MATCH_PARENT = "match-parent"
    RIGHT = "right"
    START = "start"


class IChakra(BaseModel):
    w: Optional[str] = Field(None, description="Width")
    h: Optional[str] = Field(None, description="Height")
    p: Optional[str] = Field(None, description="Padding")
    bg: Optional[str] = Field(None, description="Background color")
    textAlign: Optional[TextAlign] = Field(None, description="Text align")


__all__ = [
    "IChakra",
    "TextAlign",
]
