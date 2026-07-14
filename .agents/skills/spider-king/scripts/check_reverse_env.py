#!/usr/bin/env python3
"""
Quick environment check for protocol-first reverse work.
"""

from __future__ import annotations

import importlib.util
import shutil
import sys


TOOLS = [
    ("python", sys.executable),
    ("node", shutil.which("node")),
    ("npm", shutil.which("npm")),
    ("curl", shutil.which("curl")),
    ("git", shutil.which("git")),
]

PYTHON_MODULES = [
    "iv8",
    "curl_cffi",
]


def module_status(name: str) -> str:
    return "available" if importlib.util.find_spec(name) else "missing"


def main() -> None:
    print("reverse environment")
    print(f"- python_version: {sys.version.split()[0]}")
    for name, path in TOOLS:
        status = path or "missing"
        print(f"- {name}: {status}")
    for name in PYTHON_MODULES:
        print(f"- python_module_{name}: {module_status(name)}")
    print("notes")
    print("- pure Python protocol replay should work with Python alone")
    print("- node is useful for preserving tiny JS helpers")
    print("- iv8 or another embedded runtime is useful when JS needs host semantics without a real browser")
    print("- curl is useful for quick raw request diffs")


if __name__ == "__main__":
    main()
