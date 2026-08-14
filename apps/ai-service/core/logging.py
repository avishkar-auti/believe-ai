"""Structured logging setup, shared across the service."""

import logging
import sys


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
