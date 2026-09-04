from __future__ import annotations

from agents.career_fit_agent import extract_resume_skills
from agents.news_relevance_agent import generate_news_relevance
from agents.news_search.state import NewsSearchState
from core.logging import get_logger
from rag.grounding import is_grounded
from schemas.ai import NewsRelevanceArticleInput, NewsRelevanceRequest, SkillExtractionRequest

logger = get_logger(__name__)


async def _detect_skills(state: NewsSearchState) -> list[str] | None:
    """Resume mode only — agent-to-agent call into Career Fit's own
    skill-extraction subroutine (agents/career_fit_agent.py) rather than
    News maintaining a second, duplicate resume-skills prompt. Best-effort:
    relevance reasoning still works from queryText alone if this fails.

    resolve_query_node already runs this same extraction to build the actual
    search query, so the normal path just reuses that result here rather
    than paying for an identical second LLM call — this only re-extracts as
    a fallback if state["skills"] was never set (e.g. resolve_query's own
    attempt failed)."""
    if state.get("mode") == "resume" and "skills" in state:
        return state.get("skills")
    resume_text = state.get("resume_text")
    if state.get("mode") != "resume" or not resume_text:
        return None
    try:
        result = await extract_resume_skills(state["settings"], SkillExtractionRequest(resumeText=resume_text))
        return result.skills or None
    except Exception as err:  # noqa: BLE001 — skill-grounded reasoning is a nice-to-have on top of queryText
        logger.warning("Skill extraction for news relevance failed, falling back to queryText only: %s", err)
        return None


async def generate_relevance_node(state: NewsSearchState) -> NewsSearchState:
    """The generation half of this agentic-RAG pipeline: embeddings already
    retrieved and ranked these articles, this explains *why* in the reader's
    own terms — then rag.grounding checks each reason against the article it
    was supposedly generated from, dropping any that don't hold up rather
    than showing a possibly-hallucinated claim. Best-effort throughout: a
    failure here still returns a fully usable feed, just without the
    personalized reasoning."""
    articles = state.get("ranked_articles") or []
    if not articles:
        return state

    # Agent-to-agent: reuse Career Fit's own skill-identification subroutine
    # instead of News writing a second resume-skills prompt from scratch.
    skills = await _detect_skills(state)
    req = NewsRelevanceRequest(
        queryText=state.get("query_text", ""),
        articles=[
            NewsRelevanceArticleInput(url=a["url"], title=a["title"], description=a.get("description"))
            for a in articles
        ],
        skills=skills,
    )
    try:
        result = await generate_news_relevance(state["settings"], req)
        by_url = {r.url: r.why for r in result.reasons}
        for article in articles:
            why = by_url.get(article["url"])
            source = f"{article['title']} {article.get('description') or ''}"
            if why and not is_grounded(why, source):
                logger.warning("Dropping ungrounded relevance reason for %s", article["url"])
                why = None
            article["why_relevant"] = why
    except Exception as err:  # noqa: BLE001 — personalized reasoning is a nice-to-have, never blocks the feed
        logger.warning("News relevance generation failed, articles will show without a reason: %s", err)
        for article in articles:
            article["why_relevant"] = None

    return {**state, "ranked_articles": articles}
