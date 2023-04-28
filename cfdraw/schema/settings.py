from typing import Any
from typing import Dict
from typing import Optional
from pydantic import Field
from pydantic import BaseModel

from cfdraw.parsers import noli


class BoardOptions(BaseModel):
    minScale: float = Field(0.02, ge=0.02, le=0.5, description="min global scale")
    maxScale: float = Field(256, ge=2, le=256, description="max global scale")


class GlobalSettings(BaseModel):
    """This should align with `IGlobalSettings` locates at `cfdraw/.web/src/stores/_python.ts`"""

    defaultLang: Optional[noli.Lang] = Field(None, description="default language")
    defaultInfoTimeout: Optional[int] = Field(None, description="default info timeout")


class BoardSettings(BaseModel):
    boardOptions: Optional[BoardOptions] = Field(None, description="board options")
    globalSettings: Optional[GlobalSettings] = Field(None, description="global setting")

    def to_filtered(self) -> Dict[str, Any]:
        d = self.dict()
        ms = d["globalSettings"]
        if ms is not None:
            d["globalSettings"] = {k: v for k, v in ms.items() if v is not None}
        return d


__all__ = [
    "BoardOptions",
    "GlobalSettings",
    "BoardSettings",
]
