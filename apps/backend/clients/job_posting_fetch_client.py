"""Mirrors apps/api's jobPostingFetch.client.ts.

SSRF guard: the job URL is fully user-controlled and fetched from this
server, so without this check a user could point it at
http://localhost:8000/... or a cloud metadata endpoint
(169.254.169.254) and have the server fetch internal resources on their
behalf. Uses stdlib `ipaddress`'s `is_global` rather than hand-rolling each
private/loopback/link-local/reserved range — same threat model as Node's
manual checks, fewer places to get a range wrong.
"""

from __future__ import annotations

import asyncio
import re
import socket
from ipaddress import ip_address
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from core.errors import ValidationError
from core.logging import get_logger

logger = get_logger(__name__)


class UnsafeJobUrlError(ValidationError):
    pass


_REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; BelieveAI/1.0)"}
_TIMEOUT_SECONDS = 15.0
_ALLOWED_SCHEMES = {"http", "https"}
_MAX_REDIRECTS = 5
# Below this, a fetch is treated as "didn't actually get the posting" rather than "the
# posting happens to be short" — well above a bare <title> shell page, well below a real posting.
_MIN_SUBSTANTIAL_CHARS = 200

_WORKDAY_HOST_RE = re.compile(r"^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$", re.IGNORECASE)


async def _assert_fetchable_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in _ALLOWED_SCHEMES:
        raise UnsafeJobUrlError("Job posting links must start with http:// or https://. Please paste the full URL.")
    if not parsed.hostname:
        raise UnsafeJobUrlError("That link is missing a website address. Please paste the full job posting URL.")

    try:
        infos = await asyncio.to_thread(socket.getaddrinfo, parsed.hostname, None)
    except OSError as err:
        raise UnsafeJobUrlError(
            "We couldn't find that website. Check the link for typos, or paste the job description text instead."
        ) from err

    for info in infos:
        address = info[4][0]
        if not ip_address(address).is_global:
            logger.warning("jobPostingFetch: blocked non-public host %s (%s)", parsed.hostname, address)
            raise UnsafeJobUrlError("That link points to a private address, so we can't open it.")


async def _fetch_with_redirect_guard(url: str, headers: dict[str, str]) -> httpx.Response:
    """httpx follows redirects itself if asked, but that would bypass the SSRF check —
    redirects are followed manually here, re-validating before each hop."""
    current = url
    async with httpx.AsyncClient(follow_redirects=False, timeout=_TIMEOUT_SECONDS) as client:
        for _ in range(_MAX_REDIRECTS):
            await _assert_fetchable_url(current)
            res = await client.get(current, headers=headers)
            if res.status_code < 300 or res.status_code >= 400:
                return res
            location = res.headers.get("location")
            if not location:
                return res
            current = urljoin(current, location)
    raise UnsafeJobUrlError("That link redirected too many times. Try the posting's direct URL.")


def _is_substantial(text: str) -> bool:
    return len(text) >= _MIN_SUBSTANTIAL_CHARS


def _html_fragment_to_text(html: str | None) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return re.sub(r"\s+", " ", soup.get_text()).strip()


def _page_html_to_text(html: str) -> str:
    """Flattens a whole career page, keeping the <title> as its own first line — the single
    most reliable role/company signal on the page ("<Role> at <Company>", "<Role> | <Company>")."""
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    title = re.sub(r"\s+", " ", title_tag.get_text()).strip() if title_tag else ""
    for tag in soup(["script", "style", "noscript", "nav", "header", "footer", "form", "aside", "svg"]):
        tag.decompose()
    main = soup.find("main") or soup.find(attrs={"role": "main"}) or soup.find("body")
    body_text = re.sub(r"\s+", " ", main.get_text()).strip() if main else ""
    return "\n".join(filter(None, [title, body_text]))


async def _fetch_workday(scheme: str, host: str, path: str, tenant: str) -> str:
    api_url = f"{scheme}://{host}/wday/cxs/{tenant}{path}"
    try:
        res = await _fetch_with_redirect_guard(api_url, {**_REQUEST_HEADERS, "Accept": "application/json"})
        if res.status_code >= 400:
            return ""
        data = res.json()
        info = data.get("jobPostingInfo") or {}
        title = info.get("title") or ""
        location = info.get("location") or info.get("locationsText") or ""
        description = _html_fragment_to_text(info.get("jobDescription"))
        return "\n".join(filter(None, [title, location, description])).strip()
    except UnsafeJobUrlError:
        raise
    except Exception:  # noqa: BLE001 — best-effort probe, generic HTML fetch is the fallback
        return ""


async def _fetch_generic_html(job_url: str) -> str:
    try:
        res = await _fetch_with_redirect_guard(job_url, _REQUEST_HEADERS)
        if res.status_code >= 400:
            logger.info("jobPostingFetch: HTTP fetch failed for %s (status=%s)", job_url, res.status_code)
            return ""
        return _page_html_to_text(res.text)
    except UnsafeJobUrlError:
        raise
    except Exception as err:  # noqa: BLE001 — best-effort fetch, caller handles an empty result
        logger.info("jobPostingFetch: HTTP fetch errored for %s: %s", job_url, err)
        return ""


async def fetch_job_posting_text(job_url: str) -> str:
    """Fetches the raw text of a job posting. Two paths, tried in order:
    1. Workday-hosted postings — calls the same public JSON API the page's own frontend uses.
    2. Plain HTTP GET + HTML text extraction — works for most non-SPA career pages."""
    await _assert_fetchable_url(job_url)
    parsed = urlparse(job_url)

    best_so_far = ""

    workday_match = _WORKDAY_HOST_RE.match(parsed.hostname or "")
    if workday_match:
        text = await _fetch_workday(parsed.scheme, parsed.netloc, parsed.path, workday_match.group(1))
        if _is_substantial(text):
            return text
        if len(text) > len(best_so_far):
            best_so_far = text

    text = await _fetch_generic_html(job_url)
    if _is_substantial(text):
        return text
    if len(text) > len(best_so_far):
        best_so_far = text

    return best_so_far
