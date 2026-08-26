"""Port of packages/server/src/tracking/linkTracking.ts's signing/verification
and email-link-rewriting functions — byte-for-byte the same HMAC-SHA256
construction (domain-separated key derived from the same ENCRYPTION_KEY
core/crypto.py uses), so a link signed by Node verifies here and vice versa.
"""

from __future__ import annotations

import hashlib
import hmac
import re
from urllib.parse import quote, urlparse

SIGNING_DOMAIN = b"believe.ai/link-signing/v1"

# 16 bytes of HMAC is far beyond what a redirect guard needs to resist forgery.
SIGNATURE_HEX_LENGTH = 32

# Only ever redirect to real web links — never javascript:, data:, file:, etc.
ALLOWED_PROTOCOLS = {"http", "https"}


def _derive_signing_key(encryption_key_hex: str) -> bytes:
    return hmac.new(bytes.fromhex(encryption_key_hex), SIGNING_DOMAIN, hashlib.sha256).digest()


def sign_tracked_url(url: str, encryption_key_hex: str) -> str:
    """Signature over the exact destination URL that will be handed to a redirect."""
    key = _derive_signing_key(encryption_key_hex)
    return hmac.new(key, url.encode("utf-8"), hashlib.sha256).hexdigest()[:SIGNATURE_HEX_LENGTH]


def verify_tracked_url(url: str, signature: str | None, encryption_key_hex: str) -> bool:
    """Constant-time comparison — a leaky compare would let an attacker forge a signature byte by byte."""
    if not signature:
        return False
    expected = sign_tracked_url(url, encryption_key_hex)
    return hmac.compare_digest(expected, signature)


def is_allowed_redirect_protocol(url: str) -> bool:
    try:
        return urlparse(url).scheme in ALLOWED_PROTOCOLS
    except ValueError:
        return False


_HREF_PATTERN = re.compile(r"""(<a\b[^>]*?\bhref\s*=\s*)(["'])(.*?)\2""", re.IGNORECASE)


def _decode_href(href: str) -> str:
    """Minimal HTML entity decode for what actually shows up inside an href attribute."""
    href = re.sub(r"&amp;", "&", href, flags=re.IGNORECASE)
    href = href.replace("&#38;", "&")
    href = re.sub(r"&quot;", '"', href, flags=re.IGNORECASE)
    return href.replace("&#39;", "'")


def _encode_href(url: str) -> str:
    """Re-escape for safe embedding back into a double-quoted href attribute."""
    return url.replace("&", "&amp;").replace('"', "&quot;")


def rewrite_links_for_tracking(
    html: str,
    tracking_token: str,
    api_base_url: str,
    encryption_key_hex: str,
    skip_urls: list[str] | None = None,
) -> str:
    """Rewrites http(s) anchor targets to route through the click-tracking
    endpoint. Anything else — mailto:, tel:, in-message anchors, and any URL
    in skip_urls — is left exactly as authored."""
    skip = set(skip_urls or [])
    base = api_base_url.rstrip("/")

    def _replace(match: re.Match[str]) -> str:
        prefix, quote_char, raw_href = match.group(1), match.group(2), match.group(3)
        destination = _decode_href(raw_href.strip())

        if destination in skip or not is_allowed_redirect_protocol(destination):
            return match.group(0)
        # Don't double-wrap a link that already points at the tracking endpoint.
        if destination.startswith(f"{base}/t/"):
            return match.group(0)

        signature = sign_tracked_url(destination, encryption_key_hex)
        tracked = f"{base}/t/click/{quote(tracking_token, safe='')}?u={quote(destination, safe='')}&s={signature}"
        return f"{prefix}{quote_char}{_encode_href(tracked)}{quote_char}"

    return _HREF_PATTERN.sub(_replace, html)
