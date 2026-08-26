"""Mirrors apps/api's integration.routes.ts. The /gmail/callback and
/outlook/callback routes are public — Google/Microsoft redirect the browser
here directly, so identity comes from `state` (the Mongo user id threaded
through the consent URL), not a Firebase token."""

from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from api.dependencies import MongoUserIdDep, SettingsDep, UserIdDep
from schemas.integration import ConsentUrlResult, DisconnectResult, IntegrationStatusDto
from services import audit_service, integration_service, notification_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/", response_model=list[IntegrationStatusDto])
async def list_integrations_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> list[IntegrationStatusDto]:
    return await integration_service.list_status(mongo_user_id)


@router.post("/gmail/connect", response_model=ConsentUrlResult)
async def connect_gmail_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, settings: SettingsDep) -> ConsentUrlResult:
    return ConsentUrlResult(url=integration_service.get_gmail_consent_url(settings, str(mongo_user_id)))


@router.delete("/gmail", response_model=DisconnectResult)
async def disconnect_gmail_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> DisconnectResult:
    await integration_service.disconnect_gmail(mongo_user_id)
    await audit_service.record(mongo_user_id, "integration.disconnected", "integration", metadata={"provider": "gmail"})
    await notification_service.create(
        mongo_user_id,
        "integration.disconnected",
        "Gmail disconnected",
        "Campaigns won't send until you connect an email provider again.",
        link="/app/integrations",
    )
    return DisconnectResult(disconnected=True)


@router.get("/gmail/callback")
async def gmail_callback_route(code: str, state: str, settings: SettingsDep) -> RedirectResponse:
    user_id = ObjectId(state)
    email = await integration_service.handle_gmail_callback(settings, user_id, code)
    # `state` is the authenticated userId, threaded through Google's redirect.
    await audit_service.record(user_id, "integration.connected", "integration", metadata={"provider": "gmail", "email": email})
    return RedirectResponse(url=f"{settings.app_base_url}/settings/integrations?gmail=connected")


@router.post("/outlook/connect", response_model=ConsentUrlResult)
async def connect_outlook_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, settings: SettingsDep) -> ConsentUrlResult:
    return ConsentUrlResult(url=integration_service.get_outlook_consent_url(settings, str(mongo_user_id)))


@router.delete("/outlook", response_model=DisconnectResult)
async def disconnect_outlook_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> DisconnectResult:
    await integration_service.disconnect_outlook(mongo_user_id)
    await audit_service.record(mongo_user_id, "integration.disconnected", "integration", metadata={"provider": "outlook"})
    await notification_service.create(
        mongo_user_id,
        "integration.disconnected",
        "Outlook disconnected",
        "Campaigns won't send until you connect an email provider again.",
        link="/app/integrations",
    )
    return DisconnectResult(disconnected=True)


@router.get("/outlook/callback")
async def outlook_callback_route(code: str, state: str, settings: SettingsDep) -> RedirectResponse:
    user_id = ObjectId(state)
    email = await integration_service.handle_outlook_callback(settings, user_id, code)
    # `state` is the authenticated userId, threaded through Microsoft's redirect.
    await audit_service.record(user_id, "integration.connected", "integration", metadata={"provider": "outlook", "email": email})
    return RedirectResponse(url=f"{settings.app_base_url}/settings/integrations?outlook=connected")
