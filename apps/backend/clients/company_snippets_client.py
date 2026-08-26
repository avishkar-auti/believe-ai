"""Mirrors apps/api's companySnippets.client.ts — real public company-info
lookup, no API key needed. Wikipedia's public REST summary API (official,
free, no scraping) plus the company's own guessed homepage meta
description. Deliberately does NOT scrape a search engine's results page.
"""

from __future__ import annotations

import asyncio
import re
from urllib.parse import quote

import httpx

from core.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT_SECONDS = 10.0
_REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; BelieveAI/1.0)"}
_META_DESCRIPTION_RE = re.compile(r"""<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,300})["']""", re.IGNORECASE)


def _guess_domain(company: str) -> str | None:
    cleaned = re.sub(r"[^a-z0-9]", "", company.lower())
    return f"{cleaned}.com" if cleaned else None


async def _fetch_wikipedia_summary(company: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            res = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(company, safe='')}", headers=_REQUEST_HEADERS)
        if res.status_code == 404 or res.status_code >= 400:
            return None
        data = res.json()
        # Disambiguation pages have no real "extract" worth trusting.
        if data.get("type") == "disambiguation":
            return None
        extract = (data.get("extract") or "").strip()
        return extract or None
    except Exception as err:  # noqa: BLE001 — best-effort lookup, caller treats a miss as "no snippet"
        logger.warning("companySnippets: Wikipedia summary lookup failed for %s: %s", company, err)
        return None


async def _fetch_site_meta_description(company: str) -> str | None:
    domain = _guess_domain(company)
    if not domain:
        return None
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS, follow_redirects=True) as client:
            res = await client.get(f"https://{domain}", headers=_REQUEST_HEADERS)
        if res.status_code >= 400:
            return None
        match = _META_DESCRIPTION_RE.search(res.text)
        return match.group(1).strip() if match else None
    except Exception:  # noqa: BLE001 — best-effort probe of a guessed domain
        return None


async def fetch_company_snippets(company: str) -> list[str]:
    """Best-effort — never raises. Missing snippets just means company intel
    synthesis downstream marks everything low-confidence rather than
    fabricating values."""
    wiki, site_description = await asyncio.gather(_fetch_wikipedia_summary(company), _fetch_site_meta_description(company))
    return [s for s in (wiki, site_description) if s]
