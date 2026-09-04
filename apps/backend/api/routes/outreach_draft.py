"""Mirrors apps/api's outreachDraft.routes.ts route shapes exactly."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import DbDep, MongoUserIdDep, SettingsDep, UserIdDep
from schemas.outreach_draft import DecideDraftInput, GenerateDraftsInput, OutreachDraftDto
from schemas.outreach_send import MarkRepliedResult, OutreachFollowUpDto, OutreachSendLogDto, SendResult
from services import audit_service, outreach_draft_service, outreach_send_service

router = APIRouter(prefix="/outreach-drafts", tags=["outreach-drafts"])


@router.post("/", response_model=list[OutreachDraftDto], status_code=201)
async def generate_drafts_route(
    body: GenerateDraftsInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, settings: SettingsDep, db: DbDep
) -> list[OutreachDraftDto]:
    result = await outreach_draft_service.generate(
        settings,
        db,
        mongo_user_id,
        PydanticObjectId(body.jobIntelId),
        [PydanticObjectId(c) for c in body.contactIds],
        PydanticObjectId(body.resumeId) if body.resumeId else None,
        body.intent,
    )
    await audit_service.record(mongo_user_id, "outreach_draft.generated", "outreach_draft", entity_id=body.jobIntelId)
    return result


@router.get("/by-job/{job_intel_id}", response_model=list[OutreachDraftDto])
async def list_drafts_by_job_route(
    job_intel_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> list[OutreachDraftDto]:
    return await outreach_draft_service.list_by_job_intel(job_intel_id, mongo_user_id)


@router.patch("/{draft_id}", response_model=OutreachDraftDto)
async def decide_draft_route(
    draft_id: PydanticObjectId, body: DecideDraftInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> OutreachDraftDto:
    result = await outreach_draft_service.decide(draft_id, mongo_user_id, body.status, body.editedText)
    await audit_service.record(mongo_user_id, "outreach_draft.decided", "outreach_draft", entity_id=result.id)
    return result


@router.post("/{draft_id}/send", response_model=SendResult)
async def send_draft_route(
    draft_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, settings: SettingsDep
) -> SendResult:
    result = await outreach_send_service.send(settings, mongo_user_id, draft_id)
    await audit_service.record(mongo_user_id, "outreach_draft.sent", "outreach_draft", entity_id=str(draft_id))
    return result


@router.get("/{draft_id}/send-logs", response_model=list[OutreachSendLogDto])
async def list_send_logs_route(draft_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> list[OutreachSendLogDto]:
    return await outreach_send_service.list_send_logs(draft_id, mongo_user_id)


@router.get("/{draft_id}/follow-ups", response_model=list[OutreachFollowUpDto])
async def list_follow_ups_route(
    draft_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> list[OutreachFollowUpDto]:
    return await outreach_send_service.list_follow_ups(draft_id, mongo_user_id)


@router.post("/{draft_id}/mark-replied", response_model=MarkRepliedResult)
async def mark_replied_route(draft_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> MarkRepliedResult:
    await outreach_send_service.mark_replied(draft_id, mongo_user_id)
    await audit_service.record(mongo_user_id, "outreach_draft.replied", "outreach_draft", entity_id=str(draft_id))
    return MarkRepliedResult(marked=True)
