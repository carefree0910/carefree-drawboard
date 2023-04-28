from typing import Any
from typing import Dict
from typing import Optional
from pydantic import Field
from pydantic import BaseModel

from cfdraw.parsers import noli


class BoardOptions(BaseModel):
    minScale: float = Field(0.02, ge=0.02, le=0.5, description="min global scale")
    maxScale: float = Field(256, ge=2, le=256, description="max global scale")


class MiscSettings(BaseModel):
    """This should align with `IMiscSettings` locates at `cfdraw/.web/src/stores/_python.ts`"""

    defaultLang: Optional[noli.Lang] = Field(None, description="default language")
    defaultInfoTimeout: Optional[int] = Field(None, description="default info timeout")


class BoardSettings(BaseModel):
    boardOptions: Optional[BoardOptions] = Field(None, description="board options")
    miscSettings: Optional[MiscSettings] = Field(None, description="misc settings")

    def to_filtered(self) -> Dict[str, Any]:
        d = self.dict()
        ms = d["miscSettings"]
        if ms is not None:
            d["miscSettings"] = {k: v for k, v in ms.items() if v is not None}
        return d


__all__ = [
    "BoardOptions",
    "MiscSettings",
    "BoardSettings",
]
