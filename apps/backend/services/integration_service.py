"""Gmail/Outlook OAuth connect flow — mirrors apps/api's integration.service.ts.
Token exchange and userinfo lookups go through raw httpx (async-native),
matching Node's own approach of not pulling in a heavy SDK for calls this
simple."""

from __future__ import annotations

from urllib.parse import urlencode

import httpx
from bson import ObjectId

from core.config import Settings
from core.crypto import encrypt_secret
from core.errors import NotFoundError, ValidationError
from repositories import integration_repository
from schemas.integration import IntegrationStatusDto

GMAIL_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GMAIL_SCOPES = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email"

OUTLOOK_AUTHORIZE_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
OUTLOOK_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
OUTLOOK_GRAPH_ME_URL = "https://graph.microsoft.com/v1.0/me"
OUTLOOK_SCOPES = "offline_access Mail.Send User.Read"


def _assert_gmail_configured(settings: Settings) -> None:
    if not (settings.gmail_client_id and settings.gmail_client_secret and settings.gmail_redirect_uri):
        raise ValidationError("Gmail OAuth is not configured on this server")


def _assert_outlook_configured(settings: Settings) -> None:
    if not (settings.outlook_client_id and settings.outlook_client_secret and settings.outlook_redirect_uri):
        raise ValidationError("Outlook OAuth is not configured on this server")


def get_gmail_consent_url(settings: Settings, state: str) -> str:
    """`state` carries the authenticated userId through Google's redirect round-trip."""
    _assert_gmail_configured(settings)
    params = {
        "client_id": settings.gmail_client_id,
        "redirect_uri": settings.gmail_redirect_uri,
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent",
        "scope": GMAIL_SCOPES,
        "state": state,
    }
    return f"{GMAIL_AUTH_URL}?{urlencode(params)}"


async def handle_gmail_callback(settings: Settings, user_id: ObjectId, code: str) -> str:
    """Returns the connected Gmail address."""
    _assert_gmail_configured(settings)

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            GMAIL_TOKEN_URL,
            data={
                "client_id": settings.gmail_client_id,
                "client_secret": settings.gmail_client_secret,
                "redirect_uri": settings.gmail_redirect_uri,
                "code": code,
                "grant_type": "authorization_code",
            },
        )
        token_data = token_res.json()
        refresh_token = token_data.get("refresh_token")
        access_token = token_data.get("access_token")
        if token_res.status_code >= 400 or not refresh_token:
            raise ValidationError("Google did not return a refresh token. Disconnect and reconnect Gmail to grant offline access.")

        userinfo_res = await client.get(GMAIL_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
        userinfo = userinfo_res.json()
        email = userinfo.get("email")
        if userinfo_res.status_code >= 400 or not email:
            raise ValidationError("Could not determine the connected Gmail address")

    assert settings.encryption_key is not None
    await integration_repository.upsert(user_id, "gmail", email, encrypt_secret(refresh_token, settings.encryption_key))
    return str(email)


async def disconnect_gmail(user_id: ObjectId) -> None:
    deleted = await integration_repository.delete(user_id, "gmail")
    if not deleted:
        raise NotFoundError("Gmail is not connected")


def get_outlook_consent_url(settings: Settings, state: str) -> str:
    """`state` carries the authenticated userId through Microsoft's redirect round-trip."""
    _assert_outlook_configured(settings)
    params = {
        "client_id": settings.outlook_client_id,
        "response_type": "code",
        "redirect_uri": settings.outlook_redirect_uri,
        "response_mode": "query",
        "scope": OUTLOOK_SCOPES,
        "state": state,
    }
    return f"{OUTLOOK_AUTHORIZE_URL}?{urlencode(params)}"


async def handle_outlook_callback(settings: Settings, user_id: ObjectId, code: str) -> str:
    """Returns the connected Outlook address."""
    _assert_outlook_configured(settings)

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            OUTLOOK_TOKEN_URL,
            data={
                "client_id": settings.outlook_client_id,
                "client_secret": settings.outlook_client_secret,
                "redirect_uri": settings.outlook_redirect_uri,
                "code": code,
                "grant_type": "authorization_code",
                "scope": OUTLOOK_SCOPES,
            },
        )
        token_data = token_res.json()
        refresh_token = token_data.get("refresh_token")
        access_token = token_data.get("access_token")
        if token_res.status_code >= 400 or not refresh_token:
            raise ValidationError(f"Microsoft did not return a refresh token: {token_data.get('error_description', token_res.text)}")

        user_res = await client.get(OUTLOOK_GRAPH_ME_URL, headers={"Authorization": f"Bearer {access_token}"})
        if user_res.status_code >= 400:
            raise ValidationError("Could not determine the connected Outlook address")
        user_data = user_res.json()
        email = user_data.get("mail") or user_data.get("userPrincipalName")
        if not email:
            raise ValidationError("Could not determine the connected Outlook address")

    assert settings.encryption_key is not None
    await integration_repository.upsert(user_id, "outlook", email, encrypt_secret(refresh_token, settings.encryption_key))
    return str(email)


async def disconnect_outlook(user_id: ObjectId) -> None:
    deleted = await integration_repository.delete(user_id, "outlook")
    if not deleted:
        raise NotFoundError("Outlook is not connected")


async def list_status(user_id: ObjectId) -> list[IntegrationStatusDto]:
    integrations = await integration_repository.list_for_user(user_id)
    return [IntegrationStatusDto(provider=i.provider, email=i.email, connectedAt=i.connectedAt.isoformat()) for i in integrations]
