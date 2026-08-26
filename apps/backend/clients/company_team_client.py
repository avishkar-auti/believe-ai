"""Finds real, named people at a company without any paid lead-gen API —
fetches the company's own public team/about/leadership page (the same kind
of source company_snippets_client already trusts for company facts) and
returns its text for an LLM to extract grounded name/title pairs from later.
No LinkedIn scraping, no search-engine scraping, no API key required.
"""

from __future__ import annotations

import re

import httpx
from bs4 import BeautifulSoup

from core.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT_SECONDS = 10.0
_REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; BelieveAI/1.0)"}
# Tried in order against the guessed homepage domain — common public paths for a
# "who works here" page across marketing sites; the first substantial hit wins.
_TEAM_PAGE_PATHS = ["/team", "/about/team", "/about-us", "/about", "/company", "/leadership", "/people", "/who-we-are"]
# Below this, a page is treated as "didn't really have a team listing" (nav/footer
# boilerplate only) rather than real content worth handing to the extraction model.
_MIN_SUBSTANTIAL_CHARS = 200
_MAX_CHARS_RETURNED = 6000


def _guess_domain(company: str) -> str | None:
    cleaned = re.sub(r"[^a-z0-9]", "", company.lower())
    return f"{cleaned}.com" if cleaned else None


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    main = soup.find("main") or soup.find(attrs={"role": "main"}) or soup.find("body")
    return re.sub(r"\s+", " ", main.get_text()).strip() if main else ""


async def fetch_team_page_text(company: str) -> str:
    """Best-effort — never raises. No usable page just means lead discovery
    finds nobody for this company rather than erroring, same degrade
    pattern as every other external lookup in this service."""
    domain = _guess_domain(company)
    if not domain:
        return ""

    async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS, follow_redirects=True) as client:
        for path in _TEAM_PAGE_PATHS:
            try:
                res = await client.get(f"https://{domain}{path}", headers=_REQUEST_HEADERS)
                if res.status_code >= 400:
                    continue
                text = _html_to_text(res.text)
                if len(text) >= _MIN_SUBSTANTIAL_CHARS:
                    return text[:_MAX_CHARS_RETURNED]
            except Exception as err:  # noqa: BLE001 — best-effort probe, try the next path
                logger.info("companyTeam: fetch failed for %s%s: %s", domain, path, err)
                continue
    return ""
