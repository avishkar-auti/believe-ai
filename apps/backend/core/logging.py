"""Structured logging setup, shared across the service."""

import logging
import sys


def configure_logging(level: int = logging.INFO) -> None:
    # On Windows, stdout defaults to the console codepage (cp1252), and any
    # non-Latin-1 character in a log line raises UnicodeEncodeError inside the
    # handler. arq logs every job pickup with a "->" arrow (U+2192), so the
    # worker's log filled with encoding tracebacks instead of job records —
    # which is exactly the log you need when a campaign is not sending.
    # errors="replace" keeps a bad character from ever costing a log line.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]

    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
