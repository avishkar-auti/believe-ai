"""Best-effort people search via SerpAPI's Google Search engine — the
contact-discovery source for Job Outreach. SerpAPI is not a LinkedIn API: it
only surfaces whatever LinkedIn profile pages Google has already publicly
indexed, matching a query like `site:linkedin.com/in/ "Google" ("Technical
Recruiter" OR ...) "Pune"`. Never raises: a slow or failing external API
degrades to zero contacts rather than breaking job analysis.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

import httpx

from core.config import Settings
from core.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT_SECONDS = 10.0
_SEARCH_URL = "https://serpapi.com/search.json"

# Adapted per role rather than combining every possible title into one query
# (keeps queries short and precise, per SerpAPI usage guidance).
_TECHNICAL_TITLES = ["Technical Recruiter", "Engineering Recruiter", "Talent Acquisition", "Engineering Manager"]
_BUSINESS_TITLES = ["Recruiter", "Talent Acquisition", "Hiring Manager"]
_TECHNICAL_ROLE_RE = re.compile(
    r"engineer|developer|\bswe\b|technical|architect|devops|data scien|machine learning|\bml\b|backend|frontend|full.?stack",
    re.IGNORECASE,
)

_LINKEDIN_PROFILE_RE = re.compile(r"^https?://([a-z]{2,3}\.)?linkedin\.com/in/[^/?#]+/?$", re.IGNORECASE)
_TITLE_SUFFIX_RE = re.compile(r"\s*[|\-–]\s*linkedin\s*$", re.IGNORECASE)
_NAME_SPLIT_RE = re.compile(r"\s+[|\-–]\s+")


@dataclass
class DiscoveredPerson:
    name: str
    headline: str | None
    profileUrl: str


@dataclass
class SerpPeopleSearchResult:
    people: list[DiscoveredPerson]
    attempted: bool  # False when no API key is configured — never counts as a "failure"
    success: bool


def is_technical_role(role_title: str, skills: list[str]) -> bool:
    return bool(skills) or bool(_TECHNICAL_ROLE_RE.search(role_title))


# Placeholder values job_parsing.py falls back to when a posting doesn't
# state a real place — searching for the literal text "Not specified" would
# actively hurt result quality, not just fail to help. Exported so
# lead_discovery_service's ranking applies the same exclusion consistently.
NON_LOCATIONS = {"remote", "not specified", "unknown", "n/a", "various", "multiple locations", "hybrid"}


def build_people_search_query(company: str, role_title: str, location: str | None, skills: list[str]) -> str:
    titles = _TECHNICAL_TITLES if is_technical_role(role_title, skills) else _BUSINESS_TITLES
    title_clause = " OR ".join(f'"{t}"' for t in titles)
    parts = [f'site:linkedin.com/in/ "{company}"', f"({title_clause})"]
    # Just the city — the full "Pune, Maharashtra, India" as one literal phrase
    # almost never matches a profile's indexed text verbatim.
    city = (location or "").split(",")[0].strip()
    if city and city.lower() not in NON_LOCATIONS:
        parts.append(f'"{city}"')
    return " ".join(parts)


def _clean_name_and_headline(raw_title: str) -> tuple[str, str | None]:
    """Google/SerpAPI titles for a LinkedIn profile typically look like
    "Priya Sharma - Technical Recruiter at Google | LinkedIn" — recover the
    person's name and keep the rest as the headline, original text
    preserved (not re-derived) for anything downstream that wants it."""
    stripped = _TITLE_SUFFIX_RE.sub("", raw_title).strip()
    parts = _NAME_SPLIT_RE.split(stripped, maxsplit=1)
    if len(parts) == 2 and parts[0].strip():
        return parts[0].strip(), parts[1].strip() or None
    return stripped, None


async def search_people(settings: Settings, query: str) -> SerpPeopleSearchResult:
    if not settings.serpapi_api_key or not query:
        return SerpPeopleSearchResult(people=[], attempted=False, success=False)

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            res = await client.get(
                _SEARCH_URL,
                params={"engine": "google", "q": query, "num": "10", "api_key": settings.serpapi_api_key},
            )
        if res.status_code >= 400:
            logger.warning("SerpAPI request failed (status=%s)", res.status_code)
            return SerpPeopleSearchResult(people=[], attempted=True, success=False)
        results = res.json().get("organic_results") or []
    except Exception as err:  # noqa: BLE001 — best-effort external call, never blocks discovery
        logger.warning("SerpAPI request errored: %s", err)
        return SerpPeopleSearchResult(people=[], attempted=True, success=False)

    seen_urls: set[str] = set()
    people: list[DiscoveredPerson] = []
    for r in results:
        link = (r.get("link") or "").strip()
        # linkedin.com/in/ only — never company pages, posts, jobs, groups, directories.
        if not _LINKEDIN_PROFILE_RE.match(link.split("?")[0]):
            continue
        normalized = link.split("?")[0].rstrip("/").lower()
        if normalized in seen_urls:
            continue
        name, headline = _clean_name_and_headline(r.get("title") or "")
        if not name:
            continue
        seen_urls.add(normalized)
        people.append(DiscoveredPerson(name=name, headline=headline, profileUrl=link))

    return SerpPeopleSearchResult(people=people, attempted=True, success=True)
