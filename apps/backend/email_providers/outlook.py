"""Mirrors packages/server/src/email/providers/OutlookProvider.ts — sends
via Microsoft Graph's sendMail endpoint using raw httpx, same as Node's raw
fetch: the OAuth2 refresh-token grant and the send call are both simple
enough that a client SDK isn't worth it."""

from __future__ import annotations

import base64
import time

import httpx

from email_providers.base import SendEmailInput, SendEmailResult

_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
_SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/me/sendMail"
_SCOPE = "offline_access Mail.Send User.Read"


class OutlookProvider:
    id = "outlook"

    def __init__(self, client_id: str, client_secret: str, redirect_uri: str, refresh_token: str) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._redirect_uri = redirect_uri
        self._refresh_token = refresh_token

    async def _get_access_token(self) -> str:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                _TOKEN_URL,
                data={
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                    "redirect_uri": self._redirect_uri,
                    "refresh_token": self._refresh_token,
                    "grant_type": "refresh_token",
                    "scope": _SCOPE,
                },
            )
        data = res.json()
        access_token = data.get("access_token")
        if res.status_code >= 400 or not access_token:
            raise RuntimeError(f"Outlook token refresh failed: {data.get('error_description', res.text)}")
        return str(access_token)

    async def send_email(self, input_: SendEmailInput) -> SendEmailResult:
        access_token = await self._get_access_token()

        payload = {
            "message": {
                "subject": input_.subject,
                "body": {"contentType": "HTML", "content": input_.html},
                "toRecipients": [{"emailAddress": {"address": input_.to}}],
                "attachments": [
                    {
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": a.filename,
                        "contentType": a.content_type or "application/octet-stream",
                        "contentBytes": base64.b64encode(a.content).decode("ascii"),
                    }
                    for a in input_.attachments
                ],
            },
            "saveToSentItems": True,
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(
                _SEND_MAIL_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                json=payload,
            )
        if res.status_code >= 400:
            raise RuntimeError(f"Outlook send failed: {res.status_code} {res.text}")

        # Graph's sendMail returns 202 Accepted with no body and no message id —
        # there's nothing else to report back as a provider message id.
        return SendEmailResult(provider_message_id=f"outlook-{int(time.time() * 1000)}")
