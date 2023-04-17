from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from rich.prompt import Prompt
from rich.status import Status
from rich.console import Console


_console = Console()


def deprecate(msg: str) -> None:
    _console.print(f"[yellow]DeprecationWarning: {msg}[/yellow]")


def log(msg: str) -> None:
    _console.log(msg)


def print(msg: str) -> None:
    _console.print(msg)


def rule(title: str) -> None:
    _console.rule(title)


def ask(
    question: str,
    choices: Optional[List[str]] = None,
    *,
    default: Optional[str] = None,
) -> str:
    kw: Dict[str, Any] = dict(choices=choices)
    if default is not None:
        kw["default"] = default
    return Prompt.ask(question, **kw)  # type: ignore


def status(msg: str) -> Status:
    return _console.status(msg)
