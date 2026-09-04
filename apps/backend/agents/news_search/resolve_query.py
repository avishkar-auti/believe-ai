from __future__ import annotations

from agents.career_fit_agent import extract_resume_skills
from agents.news_search.state import NewsSearchState
from core.logging import get_logger
from rag.query_analysis import plan_from_query, plan_from_source_text
from repositories import resumes_repository
from schemas.ai import SkillExtractionRequest

logger = get_logger(__name__)

_MAX_QUERY_SKILLS = 6


def _keyword_query_from_skills(skills: list[str]) -> str:
    """A resume's first few words are its contact-info header (name, phone,
    email, location — often mangled further by icon-font glyphs the PDF
    extractor turns into stray unicode symbols), which is worthless as a
    search-API keyword query. Real extracted skills make a real query: a
    boolean OR of the resume's top skills, quoted where a skill is itself a
    multi-word phrase so it isn't split apart by the news source's own
    tokenizer."""
    terms = [f'"{s}"' if " " in s else s for s in skills[:_MAX_QUERY_SKILLS]]
    return " OR ".join(terms)


async def resolve_query_node(state: NewsSearchState) -> NewsSearchState:
    if state.get("mode") == "resume":
        user_id = state.get("user_id")
        if user_id is None:
            return {**state, "error": "user_id is required for resume mode"}

        resume = await resumes_repository.find_primary_for_user(state["db"], user_id)
        if not resume:
            return {**state, "error": "No resume uploaded yet — upload one first, or switch to Search"}

        resume_text = resume.get("content") or ""
        plan = plan_from_source_text(resume_text)
        if not plan.needs_retrieval:
            return {**state, "error": "No resume uploaded yet — upload one first, or switch to Search"}

        # Real skills make a real search query — computed once here and
        # carried in state so generate_relevance doesn't pay for a second,
        # identical extraction call later in the same pipeline run.
        skills: list[str] | None = None
        raw_query = plan.search_keyword
        try:
            result = await extract_resume_skills(state["settings"], SkillExtractionRequest(resumeText=resume_text))
            skills = result.skills or None
            if skills:
                raw_query = _keyword_query_from_skills(skills)
        except Exception as err:  # noqa: BLE001 — a raw-text fallback query still beats failing the whole feed
            logger.warning("Skill extraction for news query failed, falling back to raw resume text: %s", err)

        return {**state, "query_text": plan.query_text, "raw_query": raw_query, "resume_text": resume_text, "skills": skills}

    plan = plan_from_query(state.get("raw_query") or "")
    if not plan.needs_retrieval:
        return {**state, "error": "query is required for search mode"}
    return {**state, "query_text": plan.query_text}
