#!/usr/bin/env python3
"""Double-Fork-Daemon-Starter für den Next.js Dev-Server (Port 3000)."""
import os
import sys
import time

PROJECT = "/home/z/my-project"
LOG = os.path.join(PROJECT, "dev.log")

# Fork 1
if os.fork() > 0:
    time.sleep(0.2)
    sys.exit(0)

os.setsid()
os.umask(0o022)

# Fork 2 — vollständig von der Shell entkoppelt
if os.fork() > 0:
    sys.exit(0)

os.chdir(PROJECT)

# Alte Shell-Rest-Umgebungsvariable entfernen — .env-Datei soll gewinnen
# (Next.js: echte Umgebungsvariablen haben Vorrang vor .env-Dateien!)
os.environ.pop("DATABASE_URL", None)

# Alle FDs umleiten
log_fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
devnull = os.open(os.devnull, os.O_RDONLY)
os.dup2(devnull, 0)
os.dup2(log_fd, 1)
os.dup2(log_fd, 2)

os.execvp("node", ["node", "node_modules/.bin/next", "dev", "-p", "3000"])
