"""Mirrors packages/server/src/email/EmailProvider.ts — the send job talks
to this interface only, never a concrete provider class, so a new provider
never requires touching campaign/queue logic."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass
class EmailAttachment:
    filename: str
    content: bytes
    content_type: str | None = None


@dataclass
class SendEmailInput:
    from_email: str
    to: str
    subject: str
    html: str
    text: str
    attachments: list[EmailAttachment] = field(default_factory=list)


@dataclass
class SendEmailResult:
    provider_message_id: str


class EmailProvider(Protocol):
    id: str

    async def send_email(self, input_: SendEmailInput) -> SendEmailResult: ...
