"""Strips HTML tags from AI output body text — mirrors packages/server's use
of sanitize-html with allowedTags: [] (AI output is untrusted content).
"""

from __future__ import annotations

import re

_TAG_RE = re.compile(r"<[^>]+>")


def strip_html(value: str) -> str:
    return _TAG_RE.sub("", value)
