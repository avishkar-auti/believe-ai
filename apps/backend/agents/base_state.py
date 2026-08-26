"""Base shape every LangGraph agent state extends. settings/db ride along in
state (not a separate DI layer) since every graph runs in-process; `error`
is the shared short-circuit signal every node checks before doing work. See
agents/news_search/state.py for the first concrete extension of this shape —
new agent graphs extend BaseAgentState the same way rather than
re-declaring these three fields from scratch.
"""

from __future__ import annotations

from typing import TypedDict

from motor.motor_asyncio import AsyncIOMotorDatabase

from core.config import Settings


class BaseAgentState(TypedDict, total=False):
    settings: Settings
    db: AsyncIOMotorDatabase
    error: str | None
