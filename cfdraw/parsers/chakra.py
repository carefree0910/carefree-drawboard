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
    p: Optional[str] = Field(None, description="Padding of the plugin")
    bg: Optional[str] = Field(None, description="Background color")
    textAlign: Optional[TextAlign] = Field(None, description="Text align")


__all__ = [
    "IChakra",
    "TextAlign",
]
