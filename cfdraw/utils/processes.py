import os
import sys
import psutil
import signal
import contextlib

from typing import Optional

from cfdraw.utils import console


def kill(pid: int) -> None:
    os.kill(pid, signal.SIGTERM)


def get_process_on_port(port: str) -> Optional[psutil.Process]:
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            for conns in proc.connections(kind="inet"):
                if conns.laddr.port == int(port):
                    return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return None


def is_process_on_port(port: str) -> bool:
    return get_process_on_port(port) is not None


def kill_process_on_port(port: str) -> None:
    p = get_process_on_port(port)
    if p is not None:
        with contextlib.suppress(psutil.AccessDenied):
            p.kill()


def change_or_terminate_port(port: str, _type: str) -> str:
    console.print(
        f"Something is already running on port [bold underline]{port}[/bold underline]. "
        f"This is the port the {_type} runs on."
    )
    frontend_action = console.ask("Kill or change it?", choices=["k", "c", "n"])

    if frontend_action == "k":
        kill_process_on_port(port)
        return port

    if frontend_action == "c":
        new_port = console.ask("Specify the new port")

        # Check if also the new port is used
        if is_process_on_port(new_port):
            return change_or_terminate_port(new_port, _type)

        console.print(
            f"The {_type} will run on port "
            f"[bold underline]{new_port}[/bold underline]."
        )
        return new_port

    console.print("Exiting...")
    sys.exit()
