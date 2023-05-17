from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from pydantic import Field
from pydantic import BaseModel
from cftool.misc import random_hash

from cfdraw.parsers import noli
from cfdraw.schema.plugins import hash_identifier
from cfdraw.schema.plugins import ILogoSettings
from cfdraw.schema.plugins import ReactPluginType


class BoardOptions(BaseModel):
    minScale: float = Field(0.02, ge=0.02, le=0.5, description="min global scale")
    maxScale: float = Field(256, ge=2, le=256, description="max global scale")


class GlobalSettings(BaseModel):
    """This should align with `IGlobalSettings` locates at `cfdraw/.web/src/stores/_python.ts`"""

    defaultLang: Optional[noli.Lang] = Field(None, description="default language")
    defaultInfoTimeout: Optional[int] = Field(None, description="default info timeout")
    excludeReactPlugins: Optional[List[ReactPluginType]] = Field(
        None,
        description="react plugins to exclude",
    )
    iconLoadingPatience: Optional[int] = Field(
        None,
        ge=0,
        description="show icon loading animation if the icon is not loaded after {patience}ms",
    )


class BoardSettings(BaseModel):
    boardOptions: Optional[BoardOptions] = Field(None, description="board options")
    globalSettings: Optional[GlobalSettings] = Field(None, description="global setting")

    def to_filtered(self) -> Dict[str, Any]:
        d = self.dict()
        gs = d["globalSettings"]
        if gs is not None:
            d["globalSettings"] = {k: v for k, v in gs.items() if v is not None}
        return d


class ExtraPlugins(BaseModel):
    logo: Optional[ILogoSettings] = Field(None, description="logo settings")

    def dict(self, **kwargs: Any) -> Dict[str, Any]:
        kwargs["exclude"] = (kwargs.get("exclude") or set()) | {"logo"}
        d = super().dict(**kwargs)
        if self.logo is None:
            d["logo"] = None
        else:
            hash = random_hash()
            p_type = ReactPluginType.LOGO
            identifier = hash_identifier(hash, p_type.value)
            d["logo"] = self.logo.to_react(p_type, hash, identifier)
        return d


__all__ = [
    "BoardOptions",
    "GlobalSettings",
    "BoardSettings",
    "ExtraPlugins",
]
