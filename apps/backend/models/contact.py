"""Mirrors packages/server/src/models/Contact.model.ts — same "contacts"
collection, same field shapes and indexes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

ContactSource = Literal["manual", "csv_import", "api"]
# "linkedin" marks a contact added from a discovered job lead purely to get
# the LinkedIn note text — email is a generated placeholder, never a real
# address, so outreach_send_service must never attempt to email one.
ContactOutreachChannel = Literal["email", "linkedin"]


class Contact(Document):
    userId: PydanticObjectId
    firstName: str
    lastName: str = ""
    email: str
    company: str | None = None
    jobTitle: str | None = None
    phone: str | None = None
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    source: ContactSource = "manual"
    subscribed: bool = True
    outreachChannel: ContactOutreachChannel = "email"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "contacts"
        indexes = [
            IndexModel([("userId", 1), ("email", 1)], unique=True),
            IndexModel([("userId", 1), ("createdAt", -1)]),
            IndexModel([("userId", 1), ("tags", 1)]),
        ]
