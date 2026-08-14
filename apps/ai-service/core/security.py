"""Firebase ID token verification — mirrors apps/api/src/middleware/auth.middleware.ts.

Trusts only the token; never a client-supplied user id. Uses the same
Firebase project as the Node API, so a token issued to the web app is valid
here too without any extra sign-in step.

The plain `verify_*`/`resolve_*` functions do the actual work and take a
token string directly, so both the FastAPI header-based dependencies below
and the MCP tools (which receive a token as a plain argument, not an HTTP
header) can share the same logic.
"""

import hmac
from functools import lru_cache

import firebase_admin
from bson import ObjectId
from fastapi import Header, HTTPException, status
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from core.config import get_settings
from core.db import get_database
from repositories import users_repository


@lru_cache
def _get_firebase_app() -> firebase_admin.App:
    settings = get_settings()
    cred = credentials.Certificate(
        {
            "type": "service_account",
            "project_id": settings.firebase_project_id,
            "client_email": settings.firebase_client_email,
            "private_key": settings.firebase_private_key.replace("\\n", "\n"),
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    )
    return firebase_admin.initialize_app(cred, name="ai-service")


async def verify_firebase_token(token: str) -> str:
    """Verifies a raw ID token (no "Bearer " prefix), returns the Firebase UID."""
    try:
        decoded = firebase_auth.verify_id_token(token, app=_get_firebase_app())
    except Exception as err:  # noqa: BLE001 — any verification failure is unauthenticated
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from err
    return decoded["uid"]


async def resolve_mongo_user_id(firebase_uid: str) -> ObjectId:
    """Resolves a Firebase UID to the Mongo User._id that every
    Contact/Campaign/Template document's userId field actually points at
    (the Node schemas store the Mongo id, not the Firebase uid).

    Read-only: unlike the Node API, this service never creates a user on
    first sign-in — if there's no Mongo user yet, the caller needs to hit
    the web app first.
    """
    user = await users_repository.find_by_firebase_uid(get_database(), firebase_uid)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No believe.ai account found for this token")
    return user["_id"]


async def require_user_id(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency: verifies the bearer token, returns the Firebase UID."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    return await verify_firebase_token(authorization.removeprefix("Bearer "))


async def require_mongo_user_id(authorization: str | None = Header(default=None)) -> ObjectId:
    """FastAPI dependency: verifies the bearer token, returns the Mongo User._id."""
    firebase_uid = await require_user_id(authorization)
    return await resolve_mongo_user_id(firebase_uid)


async def require_authorized(
    authorization: str | None = Header(default=None),
    x_internal_api_key: str | None = Header(default=None),
) -> str:
    """FastAPI dependency for the request-body-driven /ai/* routes: accepts
    either a real user's Firebase token, or the shared internal service key
    used by apps/worker (which sends emails from a background job with no
    live user session to carry a token). These routes never touch the
    database on their own, so no user identity is required beyond "this
    caller is allowed to spend AI provider quota."
    """
    if authorization and authorization.startswith("Bearer "):
        return await verify_firebase_token(authorization.removeprefix("Bearer "))

    settings = get_settings()
    if settings.internal_service_key and x_internal_api_key:
        if hmac.compare_digest(x_internal_api_key, settings.internal_service_key):
            return "internal-service"

    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing or invalid credentials")
