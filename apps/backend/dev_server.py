"""Local-only dev entrypoint for launch.json's "backend" config — lets the
dev server be started from the repo root (where turbo/launch.json run from)
while still behaving as if run from apps/backend, since main.py's .env
loading and relative paths (e.g. the outreach-approval checkpoint db) are
resolved against the working directory, not this file's location.
"""

import os

import uvicorn

os.chdir(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
