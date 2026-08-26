"""Mirrors apps/api's contact.routes.ts route shapes exactly. Static paths
(/export, /import/parse, /import) are registered before the /{contact_id}
param routes — same reason Node orders them that way: a param route would
otherwise swallow "export"/"import" as an id."""

from __future__ import annotations

import csv
import io
from typing import Literal

from beanie import PydanticObjectId
from fastapi import APIRouter, Response, UploadFile

from api.dependencies import MongoUserIdDep, UserIdDep
from repositories.contact_repository import ContactSortBy, ContactSortDir
from schemas.contact import (
    ContactDto,
    CreateContactInput,
    CsvImportRequestInput,
    CsvImportSummary,
    ParsedCsv,
    UpdateContactInput,
)
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult
from services import audit_service, contact_service, notification_service

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("/", response_model=PaginatedResult[ContactDto])
async def list_contacts_route(
    mongo_user_id: MongoUserIdDep,
    _user_id: UserIdDep,
    search: str | None = None,
    tags: str | None = None,
    subscribed: bool | None = None,
    sortBy: ContactSortBy = "createdAt",
    sortDir: ContactSortDir = "desc",
    page: int = 1,
    limit: int = DEFAULT_PAGE_SIZE,
) -> PaginatedResult[ContactDto]:
    tag_list = [t for t in tags.split(",") if t] if tags else None
    return await contact_service.list_contacts(
        mongo_user_id,
        search=search,
        tags=tag_list,
        subscribed=subscribed,
        sort_by=sortBy,
        sort_dir=sortDir,
        page=page,
        limit=limit,
    )


@router.post("/", response_model=ContactDto, status_code=201)
async def create_contact_route(body: CreateContactInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> ContactDto:
    return await contact_service.create(mongo_user_id, body)


@router.get("/export")
async def export_contacts_route(mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> Response:
    contacts = await contact_service.export_all(mongo_user_id)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["firstName", "lastName", "email", "company", "jobTitle", "phone", "tags", "subscribed"])
    for c in contacts:
        writer.writerow(
            [
                c.firstName,
                c.lastName,
                c.email,
                c.company or "",
                c.jobTitle or "",
                c.phone or "",
                ";".join(c.tags),
                c.subscribed,
            ]
        )
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contacts.csv"},
    )


@router.post("/import/parse", response_model=ParsedCsv)
async def parse_contacts_csv_route(file: UploadFile, _user_id: UserIdDep) -> ParsedCsv:
    raw = await file.read()
    text = raw.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text), restval="")
    columns = reader.fieldnames or []
    rows = [row for row in reader if any((v or "").strip() for v in row.values())]
    return ParsedCsv(columns=list(columns), rows=rows)


@router.post("/import", response_model=CsvImportSummary)
async def import_contacts_csv_route(body: CsvImportRequestInput, mongo_user_id: MongoUserIdDep, user_id: UserIdDep) -> CsvImportSummary:
    summary = await contact_service.import_csv(mongo_user_id, body.rows, body.mapping)

    await audit_service.record(
        mongo_user_id,
        "contacts.imported",
        "contact",
        metadata={
            "imported": summary.imported,
            "duplicatesSkipped": summary.duplicatesSkipped,
            "invalidSkipped": summary.invalidSkipped,
        },
    )
    await notification_service.create(
        mongo_user_id,
        "contacts.imported",
        "Import completed",
        f"{summary.imported} contacts imported, {summary.duplicatesSkipped} duplicates skipped, {summary.invalidSkipped} invalid.",
        link="/app/contacts",
    )

    return summary


@router.get("/{contact_id}", response_model=ContactDto)
async def get_contact_route(contact_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep) -> ContactDto:
    return await contact_service.get_by_id(contact_id, mongo_user_id)


@router.patch("/{contact_id}", response_model=ContactDto)
async def update_contact_route(
    contact_id: PydanticObjectId, body: UpdateContactInput, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> ContactDto:
    return await contact_service.update(contact_id, mongo_user_id, body)


@router.delete("/{contact_id}")
async def delete_contact_route(
    contact_id: PydanticObjectId, mongo_user_id: MongoUserIdDep, _user_id: UserIdDep
) -> dict[str, Literal[True]]:
    await contact_service.delete(contact_id, mongo_user_id)
    return {"deleted": True}
