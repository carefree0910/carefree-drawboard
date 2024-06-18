from typing import Any
from typing import Dict
from pathlib import Path

from .toolkit.misc import update_dict
from .toolkit.misc import OPTBase


class OPTClass(OPTBase):
    flow_opt: Dict[str, Any]
    learn_opt: Dict[str, Any]

    @property
    def env_key(self) -> str:
        return "CFCORE_ENV"

    @property
    def defaults(self) -> Dict[str, Any]:
        user_dir = Path.home()
        return dict(
            flow_opt=dict(focus="", verbose=True),
            learn_opt=dict(
                cache_dir=user_dir / ".cache" / "carefree-core" / "learn",
                data_cache_dir=user_dir / ".cache" / "carefree-core" / "learn" / "data",
                external_dir=user_dir
                / ".cache"
                / "carefree-core"
                / "learn"
                / "external",
                meta_settings={},
            ),
        )

    def update_from_env(self) -> None:
        super().update_from_env()
        defaults = self.defaults
        flow_opt = self._opt["flow_opt"]
        learn_opt = self._opt["learn_opt"]
        if isinstance(flow_opt, dict):
            self._opt["flow_opt"] = update_dict(flow_opt, defaults["flow_opt"])
        if isinstance(learn_opt, dict):
            updated = update_dict(learn_opt, defaults["learn_opt"])
            if "cache_dir" in updated:
                updated["cache_dir"] = Path(updated["cache_dir"])
            if "external_dir" in updated:
                updated["external_dir"] = Path(updated["external_dir"])
            self._opt["learn_opt"] = updated


OPT = OPTClass()


__all__ = [
    "OPT",
]
