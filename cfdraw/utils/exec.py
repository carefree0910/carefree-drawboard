import uvicorn

from cfdraw import constants
from cfdraw.utils import console


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
