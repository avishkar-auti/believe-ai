"""Picks whichever EmailProvider the sending user actually connected —
mirrors apps/worker's emailProviderResolver.ts (minus its EMAIL_PROVIDER=smtp
local-testing override, which isn't part of the production OAuth path)."""

from __future__ import annotations

from beanie.odm.operators.find.comparison import In
from bson import ObjectId

from core.config import Settings
from core.crypto import decrypt_secret
from core.errors import ValidationError
from email_providers.base import EmailProvider
from email_providers.gmail import GmailProvider
from email_providers.outlook import OutlookProvider
from models.integration import Integration


def _build_gmail_provider(settings: Settings, refresh_token: str) -> GmailProvider:
    if not (settings.gmail_client_id and settings.gmail_client_secret):
        raise ValidationError("Gmail OAuth is not configured on this server")
    return GmailProvider(settings.gmail_client_id, settings.gmail_client_secret, refresh_token)


def _build_outlook_provider(settings: Settings, refresh_token: str) -> OutlookProvider:
    if not (settings.outlook_client_id and settings.outlook_client_secret and settings.outlook_redirect_uri):
        raise ValidationError("Outlook OAuth is not configured on this server")
    return OutlookProvider(settings.outlook_client_id, settings.outlook_client_secret, settings.outlook_redirect_uri, refresh_token)


async def resolve_provider(settings: Settings, user_id: ObjectId) -> EmailProvider:
    integration = await Integration.find_one(Integration.userId == user_id, In(Integration.provider, ["gmail", "outlook"]))
    if not integration:
        raise ValidationError("No email provider connected. Connect Gmail or Outlook in Settings before sending.")

    assert settings.encryption_key is not None
    refresh_token = decrypt_secret(integration.encryptedRefreshToken, settings.encryption_key)
    if integration.provider == "outlook":
        return _build_outlook_provider(settings, refresh_token)
    return _build_gmail_provider(settings, refresh_token)
