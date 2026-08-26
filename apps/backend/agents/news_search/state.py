"""One shared pipeline for both toggle states — only how query_text gets
filled in differs ("resume" reads the caller's own stored resume server-side;
"search" uses the typed query). Runs entirely in-process (no checkpointing,
no cross-request persistence), so settings/db ride along in state rather than
through a separate DI layer — every node only ever sees this dict.
"""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from agents.base_state import BaseAgentState


class NewsSearchState(BaseAgentState, total=False):
    mode: str  # "resume" | "search"
    user_id: ObjectId | None
    page_size: int

    raw_query: str  # sent to the news source as a keyword search
    query_text: str  # the (usually richer) text that actually gets embedded
    resume_text: str  # resume mode only — reused by generate_relevance for skill-grounded reasoning

    candidate_articles: list[dict[str, Any]]
    scored_candidates: list[dict[str, Any]]
    ranked_articles: list[dict[str, Any]]
