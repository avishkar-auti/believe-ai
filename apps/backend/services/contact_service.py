"""Contacts — mirrors apps/api's contact.service.ts exactly, including the
row-by-row CSV import validation (spec 5.5: one bad row never aborts the
whole import) and the plan-limit check on create/import."""

from __future__ import annotations

from typing import Any

from bson import ObjectId
from email_validator import EmailNotValidError, validate_email

from core.errors import NotFoundError
from models.contact import Contact
from repositories import contact_repository, unsubscribe_repository
from repositories.contact_repository import ContactSortBy, ContactSortDir
from schemas.contact import (
    ContactDto,
    CreateContactInput,
    CsvColumnMapping,
    CsvImportRowError,
    CsvImportSummary,
    UpdateContactInput,
)
from schemas.pagination import DEFAULT_PAGE_SIZE, PaginatedResult, safe_limit, safe_page, total_pages
from services import usage_service


def _to_dto(doc: Contact) -> ContactDto:
    return ContactDto(
        id=str(doc.id),
        userId=str(doc.userId),
        firstName=doc.firstName,
        lastName=doc.lastName,
        email=doc.email,
        company=doc.company,
        jobTitle=doc.jobTitle,
        phone=doc.phone,
        tags=doc.tags,
        notes=doc.notes,
        source=doc.source,
        subscribed=doc.subscribed,
        outreachChannel=doc.outreachChannel,
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _is_valid_email(value: str) -> bool:
    try:
        validate_email(value, check_deliverability=False)
    except EmailNotValidError:
        return False
    return True


async def list_contacts(
    user_id: ObjectId,
    *,
    search: str | None = None,
    tags: list[str] | None = None,
    subscribed: bool | None = None,
    sort_by: ContactSortBy = "createdAt",
    sort_dir: ContactSortDir = "desc",
    page: int = 1,
    limit: int = DEFAULT_PAGE_SIZE,
) -> PaginatedResult[ContactDto]:
    safe_page_ = safe_page(page)
    safe_limit_ = safe_limit(limit)

    items, total = await contact_repository.list_for_user(
        user_id,
        search=search,
        tags=tags,
        subscribed=subscribed,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=safe_page_,
        limit=safe_limit_,
    )
    return PaginatedResult[ContactDto](
        items=[_to_dto(doc) for doc in items],
        page=safe_page_,
        limit=safe_limit_,
        total=total,
        totalPages=total_pages(total, safe_limit_),
    )


async def get_by_id(contact_id: ObjectId, user_id: ObjectId) -> ContactDto:
    doc = await contact_repository.find_by_id(contact_id, user_id)
    if not doc:
        raise NotFoundError("Contact not found")
    return _to_dto(doc)


async def create(user_id: ObjectId, input_: CreateContactInput) -> ContactDto:
    await usage_service.assert_can_add_contacts(user_id, 1)
    doc = await contact_repository.create(
        user_id,
        first_name=input_.firstName,
        last_name=input_.lastName,
        email=input_.email.lower(),
        company=input_.company,
        job_title=input_.jobTitle,
        phone=input_.phone,
        tags=input_.tags,
        notes=input_.notes,
        source="manual",
        subscribed=True,
    )
    return _to_dto(doc)


async def update(contact_id: ObjectId, user_id: ObjectId, input_: UpdateContactInput) -> ContactDto:
    updates: dict[str, Any] = input_.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] is not None:
        updates["email"] = updates["email"].lower()
    doc = await contact_repository.update(contact_id, user_id, updates)
    if not doc:
        raise NotFoundError("Contact not found")
    return _to_dto(doc)


async def delete(contact_id: ObjectId, user_id: ObjectId) -> None:
    deleted = await contact_repository.delete(contact_id, user_id)
    if not deleted:
        raise NotFoundError("Contact not found")


async def import_csv(user_id: ObjectId, rows: list[dict[str, str]], mapping: CsvColumnMapping) -> CsvImportSummary:
    errors: list[CsvImportRowError] = []
    valid_rows: list[dict[str, Any]] = []
    seen_in_batch: set[str] = set()

    for index, raw in enumerate(rows):
        email = (raw.get(mapping.email) or "").strip().lower()
        if not email:
            errors.append(CsvImportRowError(row=index, reason="missing_email", raw=raw))
            continue
        if not _is_valid_email(email):
            errors.append(CsvImportRowError(row=index, reason="invalid_email", raw=raw))
            continue
        if email in seen_in_batch:
            errors.append(CsvImportRowError(row=index, reason="duplicate_email", raw=raw))
            continue
        seen_in_batch.add(email)
        valid_rows.append(
            {
                "index": index,
                "email": email,
                "firstName": (raw.get(mapping.firstName) or "") if mapping.firstName else "",
                "lastName": (raw.get(mapping.lastName) or "") if mapping.lastName else "",
                "company": (raw.get(mapping.company) or None) if mapping.company else None,
                "jobTitle": (raw.get(mapping.jobTitle) or None) if mapping.jobTitle else None,
                "phone": (raw.get(mapping.phone) or None) if mapping.phone else None,
            }
        )

    emails = [r["email"] for r in valid_rows]
    existing_emails = await contact_repository.find_existing_emails(user_id, emails)
    unsubscribed_emails = await unsubscribe_repository.find_unsubscribed_emails(user_id, emails)

    to_insert: list[Contact] = []
    duplicates_skipped = 0
    unsubscribed_skipped = 0

    for row in valid_rows:
        index = row["index"]
        email = row["email"]
        if email in existing_emails:
            duplicates_skipped += 1
            errors.append(CsvImportRowError(row=index, reason="duplicate_email", raw=rows[index]))
            continue
        if email in unsubscribed_emails:
            unsubscribed_skipped += 1
            errors.append(CsvImportRowError(row=index, reason="unsubscribed", raw=rows[index]))
            continue
        to_insert.append(
            Contact(
                userId=user_id,
                firstName=row["firstName"] or email.split("@")[0],
                lastName=row["lastName"],
                email=email,
                company=row["company"],
                jobTitle=row["jobTitle"],
                phone=row["phone"],
                tags=[],
                notes=None,
                source="csv_import",
                subscribed=True,
            )
        )

    if to_insert:
        # Checked against what will actually be inserted, after duplicates and
        # unsubscribes are filtered out — importing a mostly-duplicate file
        # shouldn't be rejected for the rows it skips.
        await usage_service.assert_can_add_contacts(user_id, len(to_insert))
        await contact_repository.bulk_insert(to_insert)

    invalid_skipped = sum(1 for e in errors if e.reason in ("invalid_email", "missing_email"))

    return CsvImportSummary(
        imported=len(to_insert),
        duplicatesSkipped=duplicates_skipped,
        invalidSkipped=invalid_skipped,
        unsubscribedSkipped=unsubscribed_skipped,
        errors=errors,
    )


async def export_all(user_id: ObjectId) -> list[ContactDto]:
    items, _total = await contact_repository.list_for_user(
        user_id, search=None, tags=None, subscribed=None, sort_by="createdAt", sort_dir="desc", page=1, limit=100_000
    )
    return [_to_dto(doc) for doc in items]
