import os
import uvicorn
import subprocess

from cftool.misc import print_info

from cfdraw import constants
from cfdraw.utils import console
from cfdraw.utils import prerequisites


def run_frontend(port: int) -> None:
    prerequisites.install_frontend_packages()
    console.rule("[bold green]Launching App")
    os.environ["PORT"] = str(port)
    print_info(f"Your app will be ready at http://127.0.0.1:{port}")
    subprocess.Popen(
        [prerequisites.get_yarn(), "dev", "--force"],
        cwd=constants.PARENT,
        env=os.environ,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )


def run_backend(
    app_name: str,
    port: int,
    log_level: constants.LogLevel = constants.LogLevel.DEBUG,
) -> None:
    console.rule("[bold green]Launching Backend")
    uvicorn.run(
        f"{app_name}:{constants.APP_VAR}.{constants.API_VAR}",
        host=constants.DEV_BACKEND_HOST,
        port=port,
        log_level=log_level,
        reload=True,
    )
