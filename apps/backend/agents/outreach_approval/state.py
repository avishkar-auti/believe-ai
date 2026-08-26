"""Unlike agents/base_state.py's graphs (which run start-to-finish within one
request), this graph is interrupted and resumed across separate HTTP requests
via a persistent checkpointer — so its state must be plain, JSON-serializable
data only. No settings/db/live objects here: nodes that need Mongo access call
the repository layer directly (Beanie is globally initialized), the same way
any other service code does.
"""

from __future__ import annotations

from typing import TypedDict

from schemas.outreach_draft import DecidableDraftStatus


class OutreachApprovalState(TypedDict, total=False):
    draft_id: str
    user_id: str
    decision: DecidableDraftStatus
    edited_text: dict[str, str | None] | None
    final_status: str | None
