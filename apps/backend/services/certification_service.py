"""Profile > Certifications — mirrors services/experience_service.py's shape."""

from __future__ import annotations

from typing import Any

from bson import ObjectId

from core.errors import NotFoundError
from models.certification import Certification
from repositories import certification_repository
from schemas.certification import CertificationDto, CreateCertificationInput, UpdateCertificationInput


def _to_dto(doc: Certification) -> CertificationDto:
    return CertificationDto(
        id=str(doc.id),
        name=doc.name,
        issuingOrg=doc.issuingOrg,
        issueDate=doc.issueDate,
        expirationDate=doc.expirationDate,
        credentialId=doc.credentialId,
        credentialUrl=doc.credentialUrl,
        order=doc.order,
    )


async def list_items(user_id: ObjectId) -> list[CertificationDto]:
    docs = await certification_repository.list_for_user(user_id)
    return [_to_dto(doc) for doc in docs]


async def create(user_id: ObjectId, input_: CreateCertificationInput) -> CertificationDto:
    doc = await certification_repository.create(user_id, **input_.model_dump())
    return _to_dto(doc)


async def update(certification_id: ObjectId, user_id: ObjectId, input_: UpdateCertificationInput) -> CertificationDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    doc = await certification_repository.update(certification_id, user_id, updates)
    if not doc:
        raise NotFoundError("Certification not found")
    return _to_dto(doc)


async def delete(certification_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await certification_repository.delete(certification_id, user_id)
    if not deleted:
        raise NotFoundError("Certification not found")


async def reorder(user_id: ObjectId, ordered_ids: list[str]) -> list[CertificationDto]:
    docs = await certification_repository.reorder(user_id, [ObjectId(i) for i in ordered_ids])
    return [_to_dto(doc) for doc in docs]
