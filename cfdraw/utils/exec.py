import os
import uvicorn
import subprocess

from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import console
from cfdraw.utils import prerequisites
from cfdraw.config import get_config


def run_frontend() -> None:
    fe_port = get_config().frontend_port
    be_port = get_config().backend_port
    prerequisites.install_frontend_packages()
    console.rule("[bold green]Launching App")
    os.environ["CFDRAW_FE_PORT"] = fe_port
    os.environ["CFDRAW_BE_PORT"] = be_port
    print_info(f"Your app will be ready at http://localhost:{fe_port}")
    subprocess.Popen(
        [prerequisites.get_yarn(), "dev", "--force"],
        cwd=constants.WEB_ROOT,
        env=os.environ,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )


def run_backend(
    module: str,
    log_level: constants.LogLevel = constants.LogLevel.DEBUG,
) -> None:
    config = get_config()
    console.rule("[bold green]Launching Backend")
    uvicorn.run(
        f"{module}:{config.entry}.{constants.API_VAR}",
        host=constants.DEV_BACKEND_HOST,
        port=int(config.backend_port),
        log_level=log_level,
        reload=True,
    )
