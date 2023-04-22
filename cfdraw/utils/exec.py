import os
import uvicorn
import subprocess

from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import console
from cfdraw.utils import prerequisites
from cfdraw.config import get_config


def setup_frontend() -> None:
    config = get_config()
    prerequisites.install_frontend_packages()
    console.rule("[bold green]Launching App")
    os.environ["CFDRAW_FE_PORT"] = config.frontend_port
    os.environ["CFDRAW_BE_PORT"] = config.api_port
    if config.backend_hosting_url is not None:
        os.environ[constants.API_URL_KEY] = config.api_url


def run_frontend(host: bool) -> None:
    setup_frontend()
    cmd = [prerequisites.get_yarn(), "dev", "--force"]
    if host:
        cmd.append("--host")
    subprocess.Popen(
        cmd,
        cwd=constants.WEB_ROOT,
        env=os.environ,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    print_info(f"👌 Your app will be ready at {get_config().frontend_url} soon...")


def run_frontend_prod() -> None:
    setup_frontend()
    config = get_config()
    if config.use_unified:
        print_info(f"👀 Your app codes are being compiled, please wait for a while...")
        subprocess.run(
            [prerequisites.get_yarn(), "build"],
            cwd=constants.WEB_ROOT,
            env=os.environ,
        )
    else:
        subprocess.Popen(
            [prerequisites.get_yarn(), "build:preview", "--host"],
            cwd=constants.WEB_ROOT,
            env=os.environ,
        )
        print_info(
            f"👀 Your app codes are being compiled, "
            "please wait until a bunch of urls appear..."
        )


def run_backend(
    module: str,
    *,
    log_level: constants.LogLevel,
    verbose: bool = True,
) -> None:
    if verbose:
        console.rule("[bold green]Launching Backend")
    config = get_config()
    # I'm not familiar with production stuffs of `uvicorn`, so currently
    # only the `reload` flag is different.
    uvicorn.run(
        f"{module}:{config.entry}.{constants.API_VAR}",
        host=constants.DEV_BACKEND_HOST,
        port=int(config.backend_port),
        log_level=log_level,
        reload=not config.prod,
    )


def run_backend_prod(module: str, *, log_level: constants.LogLevel) -> None:
    console.rule("[bold green]Launching Production Backend")
    config = get_config()
    if config.use_unified:
        print_info(f"👌 Your app will be ready at {config.api_url} soon...")
    run_backend(module, log_level=log_level, verbose=False)
