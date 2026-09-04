"""Profile > Certifications — mirrors api/routes/profile_experience.py's shape."""

from __future__ import annotations

from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter

from api.dependencies import MongoUserIdDep
from schemas.certification import CertificationDto, CreateCertificationInput, UpdateCertificationInput
from schemas.profile_common import ReorderInput
from services import certification_service

router = APIRouter(prefix="/profile/certifications", tags=["profile"])


@router.get("/", response_model=list[CertificationDto])
async def list_certifications_route(mongo_user_id: MongoUserIdDep) -> list[CertificationDto]:
    return await certification_service.list_items(mongo_user_id)


@router.post("/", response_model=CertificationDto, status_code=201)
async def create_certification_route(body: CreateCertificationInput, mongo_user_id: MongoUserIdDep) -> CertificationDto:
    return await certification_service.create(mongo_user_id, body)


@router.patch("/reorder", response_model=list[CertificationDto])
async def reorder_certifications_route(body: ReorderInput, mongo_user_id: MongoUserIdDep) -> list[CertificationDto]:
    return await certification_service.reorder(mongo_user_id, body.orderedIds)


@router.patch("/{certification_id}", response_model=CertificationDto)
async def update_certification_route(
    certification_id: PydanticObjectId, body: UpdateCertificationInput, mongo_user_id: MongoUserIdDep
) -> CertificationDto:
    return await certification_service.update(certification_id, mongo_user_id, body)


@router.delete("/{certification_id}")
async def delete_certification_route(certification_id: PydanticObjectId, mongo_user_id: MongoUserIdDep) -> dict[str, Literal[True]]:
    await certification_service.delete(certification_id, mongo_user_id)
    return {"deleted": True}
