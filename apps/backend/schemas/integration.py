"""API-facing shapes for email provider integrations — mirrors apps/api's
integration.service.ts's listStatus/consent-url/callback response shapes."""

from __future__ import annotations

from pydantic import BaseModel

from models.integration import IntegrationProvider


class IntegrationStatusDto(BaseModel):
    provider: IntegrationProvider
    email: str
    connectedAt: str


class ConsentUrlResult(BaseModel):
    url: str


class DisconnectResult(BaseModel):
    disconnected: bool
