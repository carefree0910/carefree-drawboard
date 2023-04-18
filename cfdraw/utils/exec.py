import os
import uvicorn
import subprocess

from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import console
from cfdraw.utils import prerequisites
from cfdraw.config import get_config
from cfdraw.config import Config
from cfdraw.server import launch_server


def setup_frontend() -> None:
    config = get_config()
    prerequisites.install_frontend_packages()
    console.rule("[bold green]Launching App")
    os.environ["CFDRAW_FE_PORT"] = config.frontend_port
    os.environ["CFDRAW_BE_PORT"] = config.api_port
    if config.backend_hosting_url is not None:
        os.environ[constants.API_URL_KEY] = config.api_url


def run_frontend() -> None:
    setup_frontend()
    subprocess.Popen(
        [prerequisites.get_yarn(), "dev", "--force"],
        cwd=constants.WEB_ROOT,
        env=os.environ,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    frontend_url = f"http://localhost:{get_config().frontend_port}"
    print_info(f"👌 Your app will be ready at {frontend_url} soon...")


def run_frontend_prod() -> None:
    setup_frontend()
    config = get_config()
    if config.use_tornado:
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


def run_backend(module: str, *, log_level: constants.LogLevel) -> None:
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


def run_tornado(module: str, *, log_level: constants.LogLevel) -> None:
    def before_launch(config: Config) -> None:
        cmd = [
            "uvicorn",
            f"{module}:{config.entry}.{constants.API_VAR}",
            f"--host={constants.DEV_BACKEND_HOST}",
            f"--port={config.backend_port}",
            f"--log-level={log_level}",
        ]
        subprocess.Popen(cmd)

    console.rule("[bold green]Launching Tornado Backend")
    launch_server(before_launch)
