from typing import Any
from typing import List
from typing import Optional
from typing import TYPE_CHECKING
from functools import lru_cache

if TYPE_CHECKING:
    from rich.status import Status
    from rich.console import Console


@lru_cache
def get_console() -> "Console":
    from rich.console import Console

    return Console()


def log(msg: str, *args: Any, _stack_offset: int = 2, **kwargs: Any) -> None:
    get_console().log(msg, *args, _stack_offset=_stack_offset, **kwargs)


def debug(msg: str, *args: Any, prefix: str = "", **kwargs: Any) -> None:
    kwargs.setdefault("_stack_offset", 3)
    log(f"[grey42]{prefix}{msg}[/grey42]", *args, **kwargs)


def warn(msg: str, *args: Any, prefix: str = "Warning: ", **kwargs: Any) -> None:
    kwargs.setdefault("_stack_offset", 3)
    log(f"[yellow]{prefix}{msg}[/yellow]", *args, **kwargs)


def deprecated(msg: str, *args: Any, **kwargs: Any) -> None:
    kwargs.setdefault("_stack_offset", 4)
    warn(msg, *args, prefix="DeprecationWarning: ", **kwargs)


def error(msg: str, *args: Any, prefix: str = "Error: ", **kwargs: Any) -> None:
    kwargs.setdefault("_stack_offset", 3)
    log(f"[red]{prefix}{msg}[/red]", *args, **kwargs)


def print(msg: str, *args: Any, **kwargs: Any) -> None:
    get_console().print(msg, *args, **kwargs)


def rule(title: str, **kwargs: Any) -> None:
    get_console().rule(title, **kwargs)


def ask(
    question: str,
    choices: Optional[List[str]] = None,
    *,
    default: Optional[str] = None,
    **kwargs: Any,
) -> str:
    from rich.prompt import Prompt

    kwargs = kwargs.copy()
    kwargs["choices"] = choices
    if default is not None:
        kwargs["default"] = default
    return Prompt.ask(question, **kwargs)


def status(msg: str, **kwargs: Any) -> "Status":
    return get_console().status(msg, **kwargs)
