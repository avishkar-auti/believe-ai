"""Opt-in LangSmith tracing for every LangGraph agent (agents/news_search/,
future graphs) — env-gated, not a custom tracing system. LangGraph already
has native LangSmith support; this just wires this service's typed Settings
into the environment variables LangSmith actually reads. Unset by default:
tracing costs nothing and sends nothing anywhere until LANGSMITH_API_KEY is
configured.
"""

from __future__ import annotations

import os

from core.config import Settings


def configure_tracing(settings: Settings) -> None:
    if not settings.langsmith_api_key:
        return
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGSMITH_PROJECT"] = settings.langsmith_project
