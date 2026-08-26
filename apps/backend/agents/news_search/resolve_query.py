from __future__ import annotations

from agents.news_search.state import NewsSearchState
from rag.query_analysis import plan_from_query, plan_from_source_text
from repositories import resumes_repository


async def resolve_query_node(state: NewsSearchState) -> NewsSearchState:
    if state.get("mode") == "resume":
        user_id = state.get("user_id")
        if user_id is None:
            return {**state, "error": "user_id is required for resume mode"}

        resume = await resumes_repository.find_by_user_id(state["db"], user_id)
        if not resume:
            return {**state, "error": "No resume uploaded yet — upload one first, or switch to Search"}

        resume_text = resume.get("content") or ""
        plan = plan_from_source_text(resume_text)
        if not plan.needs_retrieval:
            return {**state, "error": "No resume uploaded yet — upload one first, or switch to Search"}
        return {**state, "query_text": plan.query_text, "raw_query": plan.search_keyword, "resume_text": resume_text}

    plan = plan_from_query(state.get("raw_query") or "")
    if not plan.needs_retrieval:
        return {**state, "error": "query is required for search mode"}
    return {**state, "query_text": plan.query_text}
