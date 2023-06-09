from typing import Dict
from typing import Callable

from cfdraw.schema.plugins import *
from cfdraw.constants import WORKFLOW_KEY
from cfdraw.plugins.base import *
from cfdraw.plugins.factory import PluginFactory


TValidator = Callable[[ISocketRequest], bool]


@PluginFactory.register_internal("node_validator")
class NodeValidatorSocketPlugin(IInternalSocketPlugin):
    _validators: Dict[str, TValidator] = {}

    async def process(self, data: ISocketRequest) -> ISocketMessage:
        key = data.extraData.get("key")
        if key is None:
            msg = "key should be provided in `extraData`"
            return ISocketMessage.make_exception(data.hash, msg)
        validator = self._validators.get(key)
        if validator is None:
            msg = f"cannot find validator '{key}'"
            return ISocketMessage.make_exception(data.hash, msg)
        return ISocketMessage.make_success(data.hash, dict(acceptable=validator(data)))


def register_node_validator(key: str) -> Callable[[TValidator], TValidator]:
    def _register(validator: TValidator) -> TValidator:
        if key in NodeValidatorSocketPlugin._validators:
            raise ValueError(f"validator '{key}' already exists")
        NodeValidatorSocketPlugin._validators[key] = validator
        return validator

    return _register


@register_node_validator(WORKFLOW_KEY)
def validate_workflow(data: ISocketRequest) -> bool:
    if data.nodeData.extra_responses is None:
        return False
    return WORKFLOW_KEY in data.nodeData.extra_responses


__all__ = [
    "NodeValidatorSocketPlugin",
    "register_node_validator",
    "validate_workflow",
]
