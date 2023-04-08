import typer

from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import exec
from cfdraw.utils import console
from cfdraw.utils import prerequisites
from cfdraw.config import get_config

cli = typer.Typer()


@cli.command()
def run(
    module: str = typer.Option(None, help="The module to run."),
    log_level: constants.LogLevel = typer.Option(
        constants.LogLevel.ERROR,
        help="The log level to use.",
    ),
) -> None:
    # fetch module
    if module is None:
        module = get_config().default_module
    console.rule(f"[bold green]Running {module}")
    # fetch app
    app_module = prerequisites.get_app_module(module)
    print_info(f"Fetched app ({app_module.app})")
    # fetch configs
    backend_port = get_config().backend_port
    backend_fn = exec.run_backend
    print_info(f"Launching backend ({backend_fn.__name__})")
    backend_fn(app_module.__name__, port=int(backend_port), log_level=log_level)


@cli.command()
def hello(name: str = typer.Option(..., help="Your name.")) -> None:
    print(f"Hello, {name}!")
