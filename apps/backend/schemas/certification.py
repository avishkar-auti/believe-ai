"""API-facing shapes for Profile > Certifications. See models/certification.py."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CertificationDto(BaseModel):
    id: str
    name: str
    issuingOrg: str
    issueDate: str | None
    expirationDate: str | None
    credentialId: str | None
    credentialUrl: str | None
    order: int


class CreateCertificationInput(BaseModel):
    name: str = Field(min_length=1)
    issuingOrg: str = Field(min_length=1)
    issueDate: str | None = None
    expirationDate: str | None = None
    credentialId: str | None = None
    credentialUrl: str | None = None


class UpdateCertificationInput(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    issuingOrg: str | None = Field(default=None, min_length=1)
    issueDate: str | None = None
    expirationDate: str | None = None
    credentialId: str | None = None
    credentialUrl: str | None = None
