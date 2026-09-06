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
from collections.abc import Callable

import nh3
from bs4 import BeautifulSoup, NavigableString, Tag

from services.personalization import VARIABLE_PATTERN, canonical_key

_ALLOWED_TAGS = {"p", "br", "b", "strong", "i", "em", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "span"}
# "rel" is deliberately absent — nh3 auto-adds rel="noopener noreferrer" to
# every <a> itself (its link_rel param, on by default); also listing "rel"
# hits an nh3/ammonia panic (see template_service.py's identical note).
_ALLOWED_ATTRIBUTES = {"a": {"href", "target"}}

# Placeholder for a resolved anchor while the other inline passes run. NUL
# survives neither html.escape() output nor any real template text, so it
# cannot collide with content.
_ANCHOR_SENTINEL = "\x00"

_BULLET_RE = re.compile(r"^[-*]\s+(.*)")
_NUMBERED_RE = re.compile(r"^\d+[.)]\s+(.*)")
_BOLD_RE = re.compile(r"\*\*(.+?)\*\*|__(.+?)__")
_ITALIC_RE = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)")
# Trailing punctuation belongs to the sentence, not the URL. Without the
# final character class, "see (https://x.com/a)" linkified the ")" into the
# href and produced a dead link.
_URL_RE = re.compile(r"(https?://[^\s<>\"]*[^\s<>\".,;:!?)\]}])")

# A markdown link, the form to_markdown_text() emits so an anchor can survive
# the HTML -> text -> AI -> HTML round trip. Models preserve this shape far
# more reliably than raw <a> markup.
_MD_LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^\s)]+)\)")

# HTML collapses any run of whitespace in normal flow content to one space;
# to_plain_text has to do the same before it can tell an authored line break
# from source indentation.
_SOURCE_WHITESPACE_RE = re.compile(r"\s+")


def sanitize_html(raw_html: str) -> str:
    """Strips anything outside the safe, email-appropriate tag/attribute
    allowlist. Used for both hand-edited HTML-mode input and AI output —
    neither is trusted content."""
    return nh3.clean(raw_html, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRIBUTES)


def _inline_markdown_lite(line: str) -> str:
    """A handful of conventions people already type in a plain body —
    **bold**, *italic*, [label](url), bare URLs — rendered as real inline
    HTML. Never full Markdown, just this fixed subset. The line is
    HTML-escaped first so any literal <, >, or & in the source text can't be
    misread as markup.

    [label](url) is resolved first and parked behind a placeholder, because
    the bold/italic/bare-URL passes that follow would otherwise chew the
    anchor they just produced — an underscore in a URL turning into <em>, or
    the href being linkified a second time."""
    escaped = html.escape(line)

    anchors: list[str] = []

    def park(match: re.Match[str]) -> str:
        anchors.append(f'<a href="{match.group(2)}" target="_blank">{match.group(1)}</a>')
        return f"{_ANCHOR_SENTINEL}{len(anchors) - 1}{_ANCHOR_SENTINEL}"

    escaped = _MD_LINK_RE.sub(park, escaped)
    escaped = _BOLD_RE.sub(lambda m: f"<strong>{m.group(1) or m.group(2)}</strong>", escaped)
    escaped = _ITALIC_RE.sub(lambda m: f"<em>{m.group(1) or m.group(2)}</em>", escaped)
    escaped = _URL_RE.sub(lambda m: f'<a href="{m.group(1)}" target="_blank">{m.group(1)}</a>', escaped)

    for index, anchor in enumerate(anchors):
        escaped = escaped.replace(f"{_ANCHOR_SENTINEL}{index}{_ANCHOR_SENTINEL}", anchor)
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


def _plain_anchor(label: str, href: str) -> str:
    """A plain-text reader can't click an <a> — surface the URL itself, not
    just its label, or the link disappears entirely."""
    return href if not label or label == href else f"{label} ({href})"


def _markdown_anchor(label: str, href: str) -> str:
    """Keeps the label attached to its URL in a form _inline_markdown_lite can
    turn back into a real anchor."""
    return href if not label or label == href else f"[{label}]({href})"


def to_markdown_text(rendered_html: str) -> str:
    """Same walk as to_plain_text, but links come out as [label](url) instead
    of "label (url)".

    This is the form handed to the AI personalizer. The plain form is lossy:
    once <a href="X">LinkedIn</a> has become "LinkedIn (X)", nothing can
    rebuild the anchor, so an AI-personalized send turned every link in the
    body into bare URL text. Round-tripping through markdown keeps the label
    and the href together, and normalize_legacy_text_to_html restores the
    anchor afterwards."""
    return _to_text(rendered_html, _markdown_anchor)


def to_plain_text(rendered_html: str) -> str:
    """Real HTML -> plain-text conversion for the text/plain MIME
    fallback — walks the parsed tree rather than stripping tags with a
    regex, so paragraph spacing and list markers survive instead of the
    whole message collapsing onto one line."""
    return _to_text(rendered_html, _plain_anchor)


def _to_text(rendered_html: str, render_anchor: Callable[[str, str], str]) -> str:
    """The shared tree walk behind to_plain_text and to_markdown_text — they
    differ only in how an anchor is written out."""
    soup = BeautifulSoup(rendered_html, "html.parser")
    # Each entry is one rendered block — a paragraph, heading, or a whole
    # list (its items joined by a single newline, never a blank line, so a
    # bullet list reads as one tight group rather than double-spaced).
    blocks: list[str] = []

    def block_text(node: Tag) -> str:
        # Collapse source whitespace first, exactly as HTML rendering does.
        # A body authored in the HTML editor has indented source, and without
        # this the newline after each <br> in the source would survive
        # alongside the one <br> itself contributes — turning a sign-off into
        # a double-spaced list. Doing it before the <br> pass means the only
        # newlines left are the ones the author actually asked for.
        for text_node in node.find_all(string=True):
            collapsed = _SOURCE_WHITESPACE_RE.sub(" ", str(text_node))
            if collapsed != str(text_node):
                text_node.replace_with(NavigableString(collapsed))
        # <br> must become a real line break, not the space get_text() would
        # otherwise collapse it to alongside every other inline boundary.
        for br in node.find_all("br"):
            br.replace_with("\n")
        for anchor in node.find_all("a"):
            href = anchor.get("href", "")
            label = anchor.get_text(" ", strip=True)
            anchor.replace_with(render_anchor(label, href))
        # Strip each line, not just the block: a body authored in the HTML
        # editor is indented source, and that indentation is insignificant in
        # HTML but would show up as real leading spaces in the text/plain part.
        return "\n".join(line.strip() for line in node.get_text("").split("\n")).strip()

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
    raw_keys names the small, server-controlled set of values (the
    {{linkedin}}/{{github}}/{{portfolio}} sign-off tokens, built as trusted
    <a> fragments by services/personalization.py) that should be inserted
    as-is instead."""

    def replace(match: re.Match[str]) -> str:
        # canonical_key folds snake_case aliases onto the registry name, so a
        # template written as {{sender_name}} resolves identically to
        # {{senderName}} without rewriting anything already stored.
        key = canonical_key(match.group(1))
        value = values.get(key, "")
        return value if key in raw_keys else html.escape(value)

    return VARIABLE_PATTERN.sub(replace, rendered_html)
