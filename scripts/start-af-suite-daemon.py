#!/usr/bin/env python3
"""Startet die Python-Suite (af-suite-v3) als Daemon auf Port 8000.
Double-Fork-Muster, damit der Server Bash-Session-Endes überlebt."""
import os
import sys
import subprocess
from pathlib import Path

BASE = Path("/home/z/my-project/af-suite-v3")
VENV_PY = BASE / "venv" / "bin" / "python"
LOG = Path("/tmp/af-suite-server.log")


def daemonize() -> None:
    """Klassischer Double-Fork-Daemon ( POSIX), löst sich vom Terminal."""
    if os.fork() > 0:
        sys.exit(0)
    os.setsid()
    if os.fork() > 0:
        sys.exit(0)
    sys.stdout.flush()
    sys.stderr.flush()
    with open(LOG, "ab") as f:
        os.dup2(f.fileno(), 1)
        os.dup2(f.fileno(), 2)
    fd = os.open(os.devnull, os.O_RDONLY)
    os.dup2(fd, 0)


if __name__ == "__main__":
    daemonize()
    subprocess.run(
        [str(VENV_PY), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(BASE),
        check=False,
    )
