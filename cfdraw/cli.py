import os
import sys
import typer

from pathlib import Path
from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import exec
from cfdraw.utils import console
from cfdraw.utils import processes
from cfdraw.utils import prerequisites
from cfdraw.config import get_config
from cfdraw.utils.template import set_init_codes
from cfdraw.utils.template import TemplateType

cli = typer.Typer()


@cli.command()
def run(
    module: str = typer.Option(None, help="The module to run."),
    no_frontend: bool = typer.Option(False, help="Whether not to run the frontend."),
    no_backend: bool = typer.Option(False, help="Whether not to run the backend."),
    log_level: constants.LogLevel = typer.Option(
        constants.LogLevel.ERROR,
        help="The log level to use.",
    ),
    prod: bool = typer.Option(False, help="Whether to run in production mode."),
    tornado: bool = typer.Option(False, help="Whether use tornado to unify servers."),
) -> None:
    sys.path.insert(0, os.getcwd())
    if tornado:
        if not prod:
            console.print(
                "[bold orange1]Tornado is only available in production mode, "
                "so `--prod` flag will be forced."
            )
            prod = True
    constants.set_env(constants.Env.PROD if prod else constants.Env.DEV)
    constants.set_tornado(tornado)
    # fetch config
    config = get_config()
    # fetch module
    if module is None:
        module = constants.DEFAULT_MODULE
    if module.endswith(".py"):
        module = module[:-3]
    path_prefix = f".{os.path.sep}"
    if module.startswith(path_prefix):
        module = module[len(path_prefix) :]
    console.rule(f"[bold green]Running {module}")
    # execute
    frontend_port = config.frontend_port
    backend_port = config.backend_port
    tornado_port = config.tornado_port
    if not no_frontend and processes.is_process_on_port(frontend_port):
        frontend_port = processes.change_or_terminate_port(frontend_port, "frontend")
    if not no_backend and processes.is_process_on_port(backend_port):
        backend_port = processes.change_or_terminate_port(backend_port, "backend")
    if tornado and not no_backend and processes.is_process_on_port(tornado_port):
        tornado_port = processes.change_or_terminate_port(tornado_port, "tornado")
    config.frontend_port = frontend_port
    config.backend_port = backend_port
    config.tornado_port = tornado_port
    if not prod:
        frontend_fn, backend_fn = exec.run_frontend, exec.run_backend
    else:
        frontend_fn = exec.run_frontend_prod
        backend_fn = exec.run_tornado if tornado else exec.run_backend
    try:
        if not no_frontend:
            frontend_fn()
        if not no_backend:
            backend_fn(module, log_level=log_level)
    finally:
        console.rule("[bold]Shutting down")
        print_info("Killing frontend")
        processes.kill_process_on_port(frontend_port)
        print_info("Killing backend")
        processes.kill_process_on_port(backend_port)
        print_info("Done")


@cli.command()
def init(
    template: TemplateType = typer.Option(
        TemplateType.IMAGE,
        help="The template type.",
    ),
) -> None:
    folder = os.getcwd()
    set_init_codes(Path(folder), template)


@cli.command()
def install() -> None:
    prerequisites.install_frontend_packages(verbose=True)
