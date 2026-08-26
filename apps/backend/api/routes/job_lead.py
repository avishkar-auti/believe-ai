"""Mirrors apps/api's jobLead.routes.ts route shapes exactly."""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep, SettingsDep, UserIdDep
from schemas.job_lead import AddToContactsInput, DiscoverLeadsInput, JobLeadDto
from services import audit_service, lead_discovery_service

router = APIRouter(prefix="/job-leads", tags=["job-leads"])


@router.post("/", response_model=list[JobLeadDto], status_code=201)
async def discover_leads_route(
    body: DiscoverLeadsInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep, settings: SettingsDep
) -> list[JobLeadDto]:
    result = await lead_discovery_service.discover(settings, mongo_user_id, PydanticObjectId(body.jobIntelId))
    await audit_service.record(mongo_user_id, "job_lead.discovered", "job_lead", entity_id=body.jobIntelId)
    return result


@router.get("/by-job/{job_intel_id}", response_model=list[JobLeadDto])
async def list_leads_by_job_route(job_intel_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> list[JobLeadDto]:
    return await lead_discovery_service.list_by_job_intel(job_intel_id, mongo_user_id)


@router.post("/{lead_id}/add-to-contacts", response_model=JobLeadDto)
async def add_to_contacts_route(
    lead_id: PydanticObjectId, body: AddToContactsInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> JobLeadDto:
    result = await lead_discovery_service.add_to_contacts(lead_id, mongo_user_id, body.email.lower())
    await audit_service.record(mongo_user_id, "job_lead.added_to_contact", "job_lead", entity_id=result.id)
    return result
