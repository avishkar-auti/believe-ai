"""Classifies an outbound campaign link into the categories the student
Top Clicked Links dashboard groups by — deliberately professional categories
(resume, portfolio, GitHub…), never sales-CRM framing like "book a call".
"""

from __future__ import annotations

from urllib.parse import urlparse

from models.campaign_link import LinkCategory

_DOMAIN_CATEGORIES: dict[str, LinkCategory] = {
    "linkedin.com": "LINKEDIN",
    "github.com": "GITHUB",
    "gitlab.com": "GITHUB",
    "leetcode.com": "CODING_PROFILE",
    "hackerrank.com": "CODING_PROFILE",
    "codeforces.com": "CODING_PROFILE",
    "codechef.com": "CODING_PROFILE",
    "kaggle.com": "CODING_PROFILE",
    "behance.net": "PORTFOLIO",
    "dribbble.com": "PORTFOLIO",
    "credly.com": "CERTIFICATE",
    "coursera.org": "CERTIFICATE",
    "udemy.com": "CERTIFICATE",
}

_KEYWORD_CATEGORIES: list[tuple[str, LinkCategory]] = [
    ("resume", "RESUME"),
    ("cv", "RESUME"),
    ("portfolio", "PORTFOLIO"),
    ("certificate", "CERTIFICATE"),
    ("certification", "CERTIFICATE"),
    ("project", "PROJECT"),
]


def _root_domain(host: str) -> str:
    parts = host.lower().removeprefix("www.").split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else host.lower()


def classify_link(url: str, anchor_text: str = "") -> LinkCategory:
    try:
        host = urlparse(url).netloc
    except ValueError:
        host = ""

    domain_match = _DOMAIN_CATEGORIES.get(_root_domain(host))
    if domain_match:
        return domain_match

    haystack = f"{url} {anchor_text}".lower()
    for keyword, category in _KEYWORD_CATEGORIES:
        if keyword in haystack:
            return category

    # A bare personal domain (no path, or a root-level site) reads as a
    # personal website; anything else with no stronger signal is OTHER.
    path = urlparse(url).path
    if host and (not path or path == "/"):
        return "PERSONAL_WEBSITE"
    return "OTHER"
