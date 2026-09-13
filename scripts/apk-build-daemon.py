#!/usr/bin/env python3
"""Double-Fork-Daemon für den Bubblewrap-APK-Build (überlebt Tool-Call-Sessions)."""
import os
import sys
import time

WORK = "/home/z/my-project/apk-build"
LOG = "/tmp/apk-build.log"

ENV = dict(os.environ)
ENV["BUBBLEWRAP_KEYSTORE_PASSWORD"] = "SalonMelekce2022"
ENV["BUBBLEWRAP_KEY_PASSWORD"] = "SalonMelekce2022"
ENV["PATH"] = "/home/z/.npm-global/bin:" + ENV.get("PATH", "")

# Fork 1
if os.fork() > 0:
    time.sleep(0.2)
    sys.exit(0)

os.setsid()
os.umask(0o022)

# Fork 2 — vollständig entkoppelt
if os.fork() > 0:
    sys.exit(0)

os.chdir(WORK)

log_fd = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
devnull = os.open(os.devnull, os.O_RDONLY)
os.dup2(devnull, 0)
os.dup2(log_fd, 1)
os.dup2(log_fd, 2)

os.execvpe("bubblewrap", ["bubblewrap", "build"], ENV)
