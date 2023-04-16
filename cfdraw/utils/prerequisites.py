import shutil
import subprocess

from cfdraw import constants
from cfdraw.utils import console


def get_yarn() -> str:
    yarn_path = shutil.which("yarn")
    if yarn_path is None:
        raise FileNotFoundError("cfdraw requires yarn to be installed.")
    return yarn_path


def install_frontend_packages(*, verbose: bool = False) -> None:
    console.rule("[bold]Installing frontend packages")
    kw = dict(cwd=constants.PARENT)
    if not verbose:
        kw["stdout"] = subprocess.PIPE
    subprocess.run([get_yarn()], **kw)
