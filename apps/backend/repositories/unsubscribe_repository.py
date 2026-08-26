"""Beanie-backed unsubscribe record access — mirrors apps/api's
unsubscribe.repository.ts."""

from __future__ import annotations

from beanie.odm.operators.find.comparison import In
from bson import ObjectId

from models.unsubscribe_record import UnsubscribeRecord


async def find_unsubscribed_emails(user_id: ObjectId, emails: list[str]) -> set[str]:
    if not emails:
        return set()
    lowered = [e.lower() for e in emails]
    docs = await UnsubscribeRecord.find(UnsubscribeRecord.userId == user_id, In(UnsubscribeRecord.email, lowered)).to_list()
    return {doc.email for doc in docs}


async def add(user_id: ObjectId, email: str, reason: str | None) -> UnsubscribeRecord:
    """Upsert: an existing record's reason is never overwritten by a later
    unsubscribe attempt — mirrors Node's $setOnInsert semantics."""
    lowered = email.lower()
    existing = await UnsubscribeRecord.find_one(UnsubscribeRecord.userId == user_id, UnsubscribeRecord.email == lowered)
    if existing:
        return existing
    doc = UnsubscribeRecord(userId=user_id, email=lowered, reason=reason)
    await doc.insert()
    return doc
