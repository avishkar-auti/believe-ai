"""API-facing shapes for contacts — mirrors packages/shared's Contact type
and contact.schema.ts's Zod schemas. See models/contact.py for the persisted
Beanie Document this is derived from."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from models.contact import ContactSource

CsvImportRowErrorReason = Literal["invalid_email", "duplicate_email", "missing_email", "unsubscribed"]


class ContactDto(BaseModel):
    id: str
    userId: str
    firstName: str
    lastName: str
    email: str
    company: str | None
    jobTitle: str | None
    phone: str | None
    tags: list[str]
    notes: str | None
    source: ContactSource
    subscribed: bool
    createdAt: str
    updatedAt: str


class CreateContactInput(BaseModel):
    firstName: str = Field(min_length=1)
    lastName: str = ""
    email: EmailStr
    company: str | None = None
    jobTitle: str | None = None
    phone: str | None = None
    tags: list[str] = Field(default_factory=list)
    notes: str | None = None


class UpdateContactInput(BaseModel):
    firstName: str | None = Field(default=None, min_length=1)
    lastName: str | None = None
    email: EmailStr | None = None
    company: str | None = None
    jobTitle: str | None = None
    phone: str | None = None
    tags: list[str] | None = None
    notes: str | None = None


class CsvColumnMapping(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    email: str = Field(min_length=1)
    company: str | None = None
    jobTitle: str | None = None
    phone: str | None = None


class CsvImportRequestInput(BaseModel):
    rows: list[dict[str, str]]
    mapping: CsvColumnMapping


class CsvImportRowError(BaseModel):
    row: int
    reason: CsvImportRowErrorReason
    raw: dict[str, str]


class CsvImportSummary(BaseModel):
    imported: int
    duplicatesSkipped: int
    invalidSkipped: int
    unsubscribedSkipped: int
    errors: list[CsvImportRowError]


class ParsedCsv(BaseModel):
    columns: list[str]
    rows: list[dict[str, str]]
