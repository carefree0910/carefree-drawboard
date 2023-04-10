import os
import typer

from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import exec
from cfdraw.utils import console
from cfdraw.utils import processes
from cfdraw.utils import prerequisites
from cfdraw.config import get_config

cli = typer.Typer()


@cli.command()
def run(
    module: str = typer.Option(None, help="The module to run."),
    run_frontend: bool = typer.Option(True, help="Whether to run the frontend."),
    run_backend: bool = typer.Option(True, help="Whether to run the backend."),
    log_level: constants.LogLevel = typer.Option(
        constants.LogLevel.ERROR,
        help="The log level to use.",
    ),
) -> None:
    # fetch module
    if module is None:
        module = get_config().default_module
    if module.endswith(".py"):
        module = module[:-3]
    path_prefix = f".{os.path.sep}"
    if module.startswith(path_prefix):
        module = module[len(path_prefix) :]
    console.rule(f"[bold green]Running {module}")
    # fetch app
    app_module = prerequisites.get_app_module(module)
    print_info(f"Fetched app ({app_module.app})")
    # fetch configs
    frontend_port = get_config().frontend_port
    backend_port = get_config().backend_port
    # execute
    if processes.is_process_on_port(backend_port):
        backend_port = processes.change_or_terminate_port(backend_port, "backend")
    frontend_fn, backend_fn = exec.run_frontend, exec.run_backend
    try:
        if run_frontend:
            frontend_fn(int(frontend_port))
        if run_backend:
            backend_fn(app_module.__name__, port=int(backend_port), log_level=log_level)
    finally:
        console.rule("[bold]Shutting down")
        print_info("Killing frontend")
        processes.kill_process_on_port(frontend_port)
        print_info("Killing backend")
        processes.kill_process_on_port(backend_port)
        print_info("Done")


@cli.command()
def hello(name: str = typer.Option(..., help="Your name.")) -> None:
    print(f"Hello, {name}!")
