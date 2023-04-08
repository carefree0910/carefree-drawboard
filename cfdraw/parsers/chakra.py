from typing import Optional
from pydantic import Field
from pydantic import BaseModel
class IChakra(BaseModel):
    p: Optional[str] = Field(None, description="Padding of the plugin")


__all__ = [
    "IChakra",
]
