"""Pure rule-based extraction (regex/keyword scan) over raw job posting
text — no LLM call. A field that can't be confidently found returns an
honest default ("Not specified" / empty list), never a fabricated
stand-in value. Mirrors apps/api's services/jobParsing.ts exactly.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal
from urllib.parse import urlparse

from config.job_parsing_vocab import (
    ATS_KEYWORD_VOCAB,
    DEFAULT_EXPERIENCE_LEVEL,
    DEFAULT_LOCATION,
    EXPERIENCE_LEVEL_PATTERNS,
    HIRING_TEAM_NAME_PATTERNS,
    KNOWN_SKILL_KEYWORDS,
    LOCATION_PATTERNS,
)


@dataclass
class ParsedJobPosting:
    roleTitle: str
    company: str
    skills: list[str]
    experienceLevel: str
    location: str
    hiringTeamNames: list[str]
    atsKeywords: list[str]
    parsingConfidence: Literal["high", "low"]


# Company group is non-greedy, stops at a sentence boundary — without that lookahead it
# swallows past "CloudTech." into the next sentence.
_ROLE_AT_COMPANY_RE = re.compile(r"^\s*([^.\n]{3,80}?)\s+at\s+([A-Z][\w&' -]{1,60}?)(?=[.,\n]|$)")

# 2-8 consecutive ALL-CAPS words — many career sites render the title in caps.
_ALL_CAPS_PHRASE_RE = re.compile(r"\b([A-Z][A-Z]+(?:\s+[A-Z][A-Z]+){1,7})\b")

_WORKDAY_HOST_RE = re.compile(r"^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$", re.IGNORECASE)
_GREENHOUSE_HOST_RE = re.compile(r"^(?:job-)?boards\.greenhouse\.io$", re.IGNORECASE)
_LEVER_HOST_RE = re.compile(r"^jobs\.lever\.co$", re.IGNORECASE)

_JOB_BOARD_HOSTS = {
    "linkedin.com", "www.linkedin.com",
    "indeed.com", "www.indeed.com",
    "glassdoor.com", "www.glassdoor.com",
    "ziprecruiter.com", "www.ziprecruiter.com",
    "monster.com", "www.monster.com",
}  # fmt: skip
_GENERIC_SUBDOMAIN_PREFIXES = {
    "www", "careers", "career", "jobs", "job", "apply", "recruiting", "recruitment",
    "search", "search-jobs", "talent", "hiring", "workwith", "join", "emea", "us", "uk",
}  # fmt: skip

_TITLE_SEPARATOR_RE = re.compile(r"\s+[|•·–—]\s+|\s+-\s+|\s+@\s+")
_COMPANY_TITLE_NOISE_RE = re.compile(r"\b(careers?|jobs?|job\s+search|hiring|vacancies|openings|apply|home)\b", re.IGNORECASE)


def _slug_to_name(slug: str) -> str:
    return " ".join(w[0].upper() + w[1:] for w in re.split(r"[-_]+", slug) if w)


def _is_tld_like(candidate: str, labels_left: int) -> bool:
    return labels_left == 1 and (len(candidate) <= 3 or candidate in ("com", "net", "org", "info"))


def _company_from_url(job_url: str) -> str | None:
    """Several major ATS platforms encode the employer directly in the URL — Workday's tenant
    subdomain, Greenhouse/Lever's first path segment. Job boards are explicitly excluded."""
    try:
        parsed = urlparse(job_url)
        if not parsed.hostname:
            return None
    except ValueError:
        return None

    host = parsed.hostname.lower()
    if host in _JOB_BOARD_HOSTS:
        return None

    workday_match = _WORKDAY_HOST_RE.match(host)
    if workday_match:
        return _slug_to_name(workday_match.group(1))

    path_segments = [s for s in parsed.path.split("/") if s]
    if (_GREENHOUSE_HOST_RE.match(host) or _LEVER_HOST_RE.match(host)) and path_segments:
        return _slug_to_name(path_segments[0])

    # Strips generic prefixes repeatedly — real hosts stack them ("search.jobs.barclays").
    labels = [label for label in host.split(".") if label]
    while len(labels) > 1 and labels[0] in _GENERIC_SUBDOMAIN_PREFIXES:
        labels = labels[1:]
    if labels:
        candidate = labels[0]
        if candidate not in _GENERIC_SUBDOMAIN_PREFIXES and not _is_tld_like(candidate, len(labels)):
            return _slug_to_name(candidate)
    return None


def _extract_role_and_company(raw_text: str) -> tuple[str | None, str | None]:
    match = _ROLE_AT_COMPANY_RE.match(raw_text)
    if not match:
        return None, None
    role_title = match.group(1).strip()
    company = re.sub(r"[.,]+$", "", match.group(2).strip())
    return role_title or None, company or None


def _clean_company_fragment(fragment: str) -> str | None:
    cleaned = _COMPANY_TITLE_NOISE_RE.sub("", fragment)
    cleaned = re.sub(r"^[\s|\-–—·•,.]+|[\s|\-–—·•,.]+$", "", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    return cleaned or None


def _role_from_title_line(raw_text: str, url_company: str | None) -> str | None:
    """Splits the role off a page <title> like "Data Engineer | Barclays" — only when the
    right-hand fragment is corroborated by the company the URL already independently yielded."""
    if not url_company:
        return None
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
    if not lines:
        return None

    title = lines[0]
    if len(title) > 160:
        return None

    parts = [p.strip() for p in _TITLE_SEPARATOR_RE.split(title) if p.strip()]
    if len(parts) < 2:
        return None

    tail = _clean_company_fragment(parts[-1])
    if not tail or tail.lower() != url_company.lower():
        return None

    role = parts[0].strip()
    if re.fullmatch(_COMPANY_TITLE_NOISE_RE.pattern, role, re.IGNORECASE):
        return None
    return role if 3 <= len(role) <= 100 else None


def _fallback_role_title(raw_text: str) -> str | None:
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
    if len(lines) < 2:
        return None
    first = lines[0]
    return first if 3 <= len(first) <= 100 else None


def _fallback_role_title_from_caps(raw_text: str) -> str | None:
    match = _ALL_CAPS_PHRASE_RE.search(raw_text)
    if not match:
        return None
    phrase = match.group(1).strip()
    if len(phrase) < 6 or len(phrase) > 80:
        return None
    return re.sub(r"\w\S*", lambda w: w.group(0)[0].upper() + w.group(0)[1:].lower(), phrase)


def _match_vocabulary(raw_text: str, vocabulary: list[str]) -> list[str]:
    lowered = raw_text.lower()
    return [term for term in vocabulary if term.lower() in lowered]


def _match_first_pattern(raw_text: str, patterns: list[tuple[re.Pattern[str], str]], fallback: str) -> str:
    for pattern, label in patterns:
        if pattern.search(raw_text):
            return label
    return fallback


def _extract_hiring_team_names(raw_text: str) -> list[str]:
    names: list[str] = []
    for pattern in HIRING_TEAM_NAME_PATTERNS:
        for match in pattern.finditer(raw_text):
            name = match.group(1).strip()
            if name and name not in names:
                names.append(name)
    return names


def parse_job_posting(raw_text: str, job_url: str = "") -> ParsedJobPosting:
    text = raw_text or ""
    url_company = _company_from_url(job_url) if job_url else None

    role_title, company = _extract_role_and_company(text)
    if not role_title:
        role_title = _role_from_title_line(text, url_company)
    if not role_title:
        role_title = _fallback_role_title(text)
    if not role_title:
        role_title = _fallback_role_title_from_caps(text)
    if not company:
        company = url_company

    skills = _match_vocabulary(text, KNOWN_SKILL_KEYWORDS)
    ats_keywords = _match_vocabulary(text, ATS_KEYWORD_VOCAB)
    experience_level = _match_first_pattern(text, EXPERIENCE_LEVEL_PATTERNS, DEFAULT_EXPERIENCE_LEVEL)
    location = _match_first_pattern(text, LOCATION_PATTERNS, DEFAULT_LOCATION)
    hiring_team_names = _extract_hiring_team_names(text)

    return ParsedJobPosting(
        roleTitle=role_title or "Not specified",
        company=company or "Not specified",
        skills=skills,
        experienceLevel=experience_level,
        location=location,
        hiringTeamNames=hiring_team_names,
        atsKeywords=ats_keywords,
        parsingConfidence="high" if role_title and company else "low",
    )
