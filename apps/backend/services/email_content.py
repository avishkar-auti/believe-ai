"""Shared email-content rendering pipeline — the one place that turns a
template's stored body into the representations an actual email needs:
sanitized HTML for the text/html MIME part, and a readable plain-text
fallback for text/plain. Template preview, campaign preview, and the real
outbound send in worker/jobs/send_campaign_email.py all go through exactly
these functions, so none of them can silently diverge — which is the actual
bug this file replaces: the old campaign preview rendered body as raw
`white-space: pre-wrap` text while the real send ran a separate, much
cruder plain-text-to-HTML converter with no list/bold/link support at all,
so what a user saw in preview was never what a recipient actually got.

Two body formats exist on a stored Template (see models/template.py's
bodyFormat): "text" is the legacy/default format — plain text, optionally
using common conventions people already type by hand (blank-line
paragraphs, "- "/"1. " lists, **bold**, bare URLs) — normalized into real
HTML on render. "html" is real HTML authored through the rich Write/HTML
composer, sanitized (never trusted as-is, whether hand-edited or
AI-generated).
"""

from __future__ import annotations

import html
import re

import nh3
from bs4 import BeautifulSoup, NavigableString, Tag

_ALLOWED_TAGS = {"p", "br", "b", "strong", "i", "em", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "span"}
# "rel" is deliberately absent — nh3 auto-adds rel="noopener noreferrer" to
# every <a> itself (its link_rel param, on by default); also listing "rel"
# hits an nh3/ammonia panic (see template_service.py's identical note).
_ALLOWED_ATTRIBUTES = {"a": {"href", "target"}}

_INTERPOLATE_PATTERN = re.compile(r"{{\s*(\w+)\s*}}")

_BULLET_RE = re.compile(r"^[-*]\s+(.*)")
_NUMBERED_RE = re.compile(r"^\d+[.)]\s+(.*)")
_BOLD_RE = re.compile(r"\*\*(.+?)\*\*|__(.+?)__")
_ITALIC_RE = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)")
_URL_RE = re.compile(r"(https?://[^\s<>\"]+)")


def sanitize_html(raw_html: str) -> str:
    """Strips anything outside the safe, email-appropriate tag/attribute
    allowlist. Used for both hand-edited HTML-mode input and AI output —
    neither is trusted content."""
    return nh3.clean(raw_html, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRIBUTES)


def _inline_markdown_lite(line: str) -> str:
    """A handful of conventions people already type in a plain body —
    **bold**, *italic*, bare URLs — rendered as real inline HTML. Never full
    Markdown, just this fixed subset. The line is HTML-escaped first so any
    literal <, >, or & in the source text can't be misread as markup."""
    escaped = html.escape(line)
    escaped = _BOLD_RE.sub(lambda m: f"<strong>{m.group(1) or m.group(2)}</strong>", escaped)
    escaped = _ITALIC_RE.sub(lambda m: f"<em>{m.group(1) or m.group(2)}</em>", escaped)
    escaped = _URL_RE.sub(lambda m: f'<a href="{m.group(1)}" target="_blank">{m.group(1)}</a>', escaped)
    return escaped


def normalize_legacy_text_to_html(text: str) -> str:
    """Upgrades a legacy plain-text body into real semantic HTML: blank-line
    paragraphs become <p>, consecutive "- "/"1. " lines become a real
    <ul>/<ol>, and _inline_markdown_lite handles bold/italic/links within
    each line. This is what makes an old plain-text template — or a
    freshly AI-drafted one, which tends to use these exact conventions —
    render as genuine paragraphs and lists instead of one flattened block,
    with no need to touch the rich editor at all."""
    blocks = re.split(r"\n\s*\n", text.strip())
    parts: list[str] = []
    for block in blocks:
        lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
        if not lines:
            continue
        bullet_matches = [_BULLET_RE.match(ln) for ln in lines]
        numbered_matches = [_NUMBERED_RE.match(ln) for ln in lines]
        if all(bullet_matches):
            items = "".join(f"<li>{_inline_markdown_lite(m.group(1))}</li>" for m in bullet_matches)  # type: ignore[union-attr]
            parts.append(f"<ul>{items}</ul>")
        elif all(numbered_matches):
            items = "".join(f"<li>{_inline_markdown_lite(m.group(1))}</li>" for m in numbered_matches)  # type: ignore[union-attr]
            parts.append(f"<ol>{items}</ol>")
        else:
            parts.append(f"<p>{'<br>'.join(_inline_markdown_lite(ln) for ln in lines)}</p>")
    return "".join(parts)


def to_html(body: str, body_format: str) -> str:
    """The one place a stored template body becomes safe, renderable HTML —
    Write mode, HTML mode, Preview, and the actual outbound email all call
    this rather than each doing their own conversion."""
    if body_format == "html":
        return sanitize_html(body)
    return normalize_legacy_text_to_html(body)


def to_plain_text(rendered_html: str) -> str:
    """Real HTML -> plain-text conversion for the text/plain MIME
    fallback — walks the parsed tree rather than stripping tags with a
    regex, so paragraph spacing and list markers survive instead of the
    whole message collapsing onto one line."""
    soup = BeautifulSoup(rendered_html, "html.parser")
    # Each entry is one rendered block — a paragraph, heading, or a whole
    # list (its items joined by a single newline, never a blank line, so a
    # bullet list reads as one tight group rather than double-spaced).
    blocks: list[str] = []

    def block_text(node: Tag) -> str:
        # <br> must become a real line break, not the space get_text() would
        # otherwise collapse it to alongside every other inline boundary.
        for br in node.find_all("br"):
            br.replace_with("\n")
        # A plain-text reader can't click an <a> — surface the URL itself,
        # not just its label, or the link disappears entirely.
        for anchor in node.find_all("a"):
            href = anchor.get("href", "")
            label = anchor.get_text(" ", strip=True)
            anchor.replace_with(href if not label or label == href else f"{label} ({href})")
        return node.get_text("").strip()

    def list_block(list_node: Tag, ordered: bool) -> str:
        lines = [
            f"{index}. {block_text(item)}" if ordered else f"- {block_text(item)}"
            for index, item in enumerate(list_node.find_all("li", recursive=False), start=1)
        ]
        return "\n".join(lines)

    root = soup.body or soup
    for node in root.children:
        if isinstance(node, NavigableString):
            text = node.strip()
            if text:
                blocks.append(text)
            continue
        if not isinstance(node, Tag):
            continue
        if node.name == "ul":
            blocks.append(list_block(node, ordered=False))
        elif node.name == "ol":
            blocks.append(list_block(node, ordered=True))
        else:
            text = block_text(node)
            if text:
                blocks.append(text)

    return "\n\n".join(b for b in blocks if b).strip()


def interpolate_html(rendered_html: str, values: dict[str, str], *, raw_keys: frozenset[str] = frozenset()) -> str:
    """Same {{variable}} substitution used for plain templates, but every
    substituted value is HTML-escaped by default — a contact's company name
    containing & or < must never be able to alter the surrounding markup.
    raw_keys names the small, server-controlled set of values (e.g. the
    {{linkedin}}/{{github}} sign-off tokens, already built as trusted <a>
    fragments) that should be inserted as-is instead."""

    def replace(match: re.Match[str]) -> str:
        key = match.group(1)
        value = values.get(key, "")
        return value if key in raw_keys else html.escape(value)

    return _INTERPOLATE_PATTERN.sub(replace, rendered_html)
