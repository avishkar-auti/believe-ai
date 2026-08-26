"""Mirrors packages/server/src/email/providers/GmailProvider.ts. The Gmail
API client is synchronous (httplib2-based), so the actual send call runs in
a thread — everything else in this service is async-native, and blocking
the event loop for a network round-trip would stall every other request."""

from __future__ import annotations

import asyncio
import base64
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from email_providers.base import SendEmailInput, SendEmailResult

_TOKEN_URI = "https://oauth2.googleapis.com/token"


def _build_mime_message(input_: SendEmailInput) -> bytes:
    body = MIMEMultipart("alternative")
    body.attach(MIMEText(input_.text, "plain"))
    body.attach(MIMEText(input_.html, "html"))

    message: MIMEMultipart | MIMEBase = body
    if input_.attachments:
        message = MIMEMultipart("mixed")
        message.attach(body)
        for attachment in input_.attachments:
            part = MIMEBase(*(attachment.content_type or "application/octet-stream").split("/", 1))
            part.set_payload(attachment.content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", "attachment", filename=attachment.filename)
            message.attach(part)

    message["From"] = input_.from_email
    message["To"] = input_.to
    message["Subject"] = input_.subject
    return message.as_bytes()


class GmailProvider:
    id = "gmail"

    def __init__(self, client_id: str, client_secret: str, refresh_token: str) -> None:
        self._credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri=_TOKEN_URI,
            client_id=client_id,
            client_secret=client_secret,
        )

    def _send_sync(self, raw: str) -> str:
        service = build("gmail", "v1", credentials=self._credentials)
        result = service.users().messages().send(userId="me", body={"raw": raw}).execute()
        message_id = result.get("id")
        if not message_id:
            raise RuntimeError("Gmail did not return a message id")
        return str(message_id)

    async def send_email(self, input_: SendEmailInput) -> SendEmailResult:
        raw_bytes = _build_mime_message(input_)
        raw = base64.urlsafe_b64encode(raw_bytes).decode("ascii").rstrip("=")
        message_id = await asyncio.to_thread(self._send_sync, raw)
        return SendEmailResult(provider_message_id=message_id)
