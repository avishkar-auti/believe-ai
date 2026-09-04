"""Beanie-backed contact access — mirrors apps/api's contact.repository.ts
query-for-query (same collection, same filters/sort/pagination)."""

from __future__ import annotations

import re
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any, Literal

from beanie.odm.operators.find.comparison import In
from bson import ObjectId

from models.contact import Contact, ContactOutreachChannel, ContactSource

ContactSortBy = Literal["createdAt", "firstName", "email", "company"]
ContactSortDir = Literal["asc", "desc"]


def _escape_regex(value: str) -> str:
    return re.escape(value)


async def list_for_user(
    user_id: ObjectId,
    *,
    search: str | None,
    tags: list[str] | None,
    subscribed: bool | None,
    sort_by: ContactSortBy,
    sort_dir: ContactSortDir,
    page: int,
    limit: int,
) -> tuple[list[Contact], int]:
    filter_: dict[str, Any] = {"userId": user_id}

    if search:
        pattern = re.compile(_escape_regex(search), re.IGNORECASE)
        filter_["$or"] = [
            {"firstName": pattern},
            {"lastName": pattern},
            {"email": pattern},
            {"company": pattern},
        ]
    if tags:
        filter_["tags"] = {"$in": tags}
    if subscribed is not None:
        filter_["subscribed"] = subscribed

    sort_field = f"-{sort_by}" if sort_dir == "desc" else sort_by
    skip = (page - 1) * limit

    query = Contact.find(filter_).sort(sort_field)
    items = await query.skip(skip).limit(limit).to_list()
    total = await Contact.find(filter_).count()
    return items, total


async def find_by_id(contact_id: ObjectId, user_id: ObjectId) -> Contact | None:
    return await Contact.find_one(Contact.id == contact_id, Contact.userId == user_id)


async def find_by_email(user_id: ObjectId, email: str) -> Contact | None:
    return await Contact.find_one(Contact.userId == user_id, Contact.email == email.lower())


async def find_existing_emails(user_id: ObjectId, emails: list[str]) -> set[str]:
    if not emails:
        return set()
    docs = await Contact.find(Contact.userId == user_id, In(Contact.email, emails)).to_list()
    return {doc.email for doc in docs}


async def create(
    user_id: ObjectId,
    *,
    first_name: str,
    last_name: str,
    email: str,
    company: str | None,
    job_title: str | None,
    phone: str | None,
    tags: list[str],
    notes: str | None,
    source: ContactSource,
    subscribed: bool,
    outreach_channel: ContactOutreachChannel = "email",
) -> Contact:
    doc = Contact(
        userId=user_id,
        firstName=first_name,
        lastName=last_name,
        email=email,
        company=company,
        jobTitle=job_title,
        phone=phone,
        tags=tags,
        notes=notes,
        source=source,
        subscribed=subscribed,
        outreachChannel=outreach_channel,
    )
    await doc.insert()
    return doc


async def bulk_insert(records: list[Contact]) -> None:
    if not records:
        return
    await Contact.insert_many(records)


async def update(contact_id: ObjectId, user_id: ObjectId, updates: dict[str, Any]) -> Contact | None:
    doc = await find_by_id(contact_id, user_id)
    if not doc:
        return None
    for key, value in updates.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(UTC)
    await doc.save()
    return doc


async def delete(contact_id: ObjectId, user_id: ObjectId) -> bool:
    doc = await find_by_id(contact_id, user_id)
    if not doc:
        return False
    await doc.delete()
    return True


async def find_many_by_ids(contact_ids: Sequence[ObjectId], user_id: ObjectId) -> list[Contact]:
    if not contact_ids:
        return []
    return await Contact.find(In(Contact.id, contact_ids), Contact.userId == user_id).to_list()


async def count_by_user_id(user_id: ObjectId) -> int:
    return await Contact.find(Contact.userId == user_id).count()
