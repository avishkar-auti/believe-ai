"""Firebase ID token verification — mirrors apps/api/src/middleware/auth.middleware.ts.

Trusts only the token; never a client-supplied user id. Uses the same
Firebase project as the Node API, so a token issued to the web app is valid
here too without any extra sign-in step.

The plain `verify_*`/`resolve_*` functions do the actual work and take a
token string directly, so both the FastAPI header-based dependencies below
and the MCP tools (which receive a token as a plain argument, not an HTTP
header) can share the same logic.
"""

from functools import lru_cache

import firebase_admin
from bson import ObjectId
from fastapi import Header, HTTPException, status
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from pymongo.errors import DuplicateKeyError

from core.config import get_settings
from core.db import get_database
from core.errors import AuthorizationError
from models.user import User
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

    Find-or-create, mirroring apps/api's auth.middleware.ts's
    findOrCreateByFirebaseUid — this is the only place a User document gets
    created on first sign-in, now that Python owns auth end to end. A
    second Firebase Admin lookup (get_user) only happens on that first
    request for a given uid; every request after that is a single Mongo
    read via the User document already existing.
    """
    existing = await users_repository.find_by_firebase_uid(get_database(), firebase_uid)
    if existing:
        return existing["_id"]

    firebase_user = firebase_auth.get_user(firebase_uid, app=_get_firebase_app())
    user = User(
        firebaseUid=firebase_uid,
        email=firebase_user.email or "",
        name=firebase_user.display_name or "",
        avatar=firebase_user.photo_url,
    )
    try:
        await user.insert()
    except DuplicateKeyError:
        # A brand-new sign-in fires many parallel requests (dashboard widgets
        # each resolving the current user independently), so more than one
        # can race this find-or-create at once. The loser just re-reads what
        # the winner already inserted instead of surfacing a 500.
        existing = await users_repository.find_by_firebase_uid(get_database(), firebase_uid)
        if existing:
            return existing["_id"]
        raise
    assert user.id is not None
    return user.id


async def require_user_id(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency: verifies the bearer token, returns the Firebase UID."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    return await verify_firebase_token(authorization.removeprefix("Bearer "))


async def require_mongo_user_id(authorization: str | None = Header(default=None)) -> ObjectId:
    """FastAPI dependency: verifies the bearer token, returns the Mongo User._id."""
    firebase_uid = await require_user_id(authorization)
    return await resolve_mongo_user_id(firebase_uid)


async def require_user_name(authorization: str | None = Header(default=None)) -> str:
    """FastAPI dependency: mirrors apps/api's auth.middleware.ts's
    `req.userName = user.name || user.email` — for routes (Live Practice
    Room scheduling, ideas, feedback) that attribute an action to a display
    name rather than just an id."""
    mongo_user_id = await require_mongo_user_id(authorization)
    user = await User.get(mongo_user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No believe.ai account found for this token")
    return user.name or user.email


async def optional_mongo_user_id(authorization: str | None = Header(default=None)) -> ObjectId | None:
    """FastAPI dependency: mirrors apps/api's optionalAuth.middleware.ts —
    resolves the caller's Mongo user id if a valid bearer token is present,
    otherwise None, for routes (feedback submission) that work either way."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await require_mongo_user_id(authorization)
    except HTTPException:
        return None


async def require_recruiter(authorization: str | None = Header(default=None)) -> ObjectId:
    """FastAPI dependency: mirrors apps/api's requireRecruiter.middleware.ts —
    gates job-posting management routes to users whose own stored role is
    recruiter or admin, checked against the database rather than trusting
    anything from the request itself."""
    mongo_user_id = await require_mongo_user_id(authorization)
    user = await User.get(mongo_user_id)
    if not user or user.role not in ("recruiter", "admin"):
        raise AuthorizationError("Recruiter access required — enable it in Settings first")
    return mongo_user_id
