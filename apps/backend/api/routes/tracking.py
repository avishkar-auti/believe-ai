"""Mirrors apps/api's tracking.routes.ts — public routes hit directly by
email clients and browsers, no auth."""

from __future__ import annotations

import base64

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse, Response

from api.dependencies import SettingsDep
from core.link_signing import is_allowed_redirect_protocol, verify_tracked_url
from services import tracking_service

router = APIRouter(prefix="/t", tags=["tracking"])

# 1x1 transparent GIF used as the open-tracking pixel.
TRANSPARENT_GIF = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7")

_UNSUBSCRIBED_HTML = (
    '<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:3rem">'
    "<h1>You're unsubscribed</h1><p>You won't receive further emails from this sender.</p></body></html>"
)


@router.get("/open/{token}")
async def open_pixel_route(token: str) -> Response:
    await tracking_service.record_open(token)
    return Response(content=TRANSPARENT_GIF, media_type="image/gif", headers={"Cache-Control": "no-store"})


@router.get("/click/{token}")
async def click_route(token: str, u: str, s: str, settings: SettingsDep) -> RedirectResponse:
    """`u` is fully attacker-controlled by the time it reaches us, so it is
    only honoured when accompanied by a valid HMAC (`s`) produced when the
    email was built. Without that check this endpoint is an open redirect."""
    if not u or not s:
        raise HTTPException(status_code=400, detail="Missing or invalid redirect URL")
    # Protocol allowlist first: a bare URL check would happily accept
    # javascript: and data: URLs, which must never reach a redirect.
    if not is_allowed_redirect_protocol(u):
        raise HTTPException(status_code=400, detail="Unsupported redirect protocol")
    if not settings.encryption_key or not verify_tracked_url(u, s, settings.encryption_key):
        raise HTTPException(status_code=400, detail="Invalid tracking signature")

    await tracking_service.record_click(token)
    return RedirectResponse(url=u)


@router.get("/unsubscribe/{token}")
async def unsubscribe_route(token: str) -> Response:
    await tracking_service.unsubscribe_by_token(token)
    return Response(content=_UNSUBSCRIBED_HTML, media_type="text/html")
