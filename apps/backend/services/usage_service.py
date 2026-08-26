"""Plan usage — mirrors apps/api's usageService.getUsage exactly (same
three counts, same "start of UTC day" window for daily email sends).

Only contacts/campaigns/email-log *counts* are needed here, not full CRUD
ownership of those collections — Phase 3/4 port their write paths; this
reads the same collections directly via Motor in the meantime, no Beanie
Document needed for a plain count_documents query. The plan lookup itself
goes through the Beanie User document from Phase 1.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.errors import NotFoundError, PlanLimitExceededError
from models.user import PlanTier, User
from repositories import campaign_repository, contact_repository, email_log_repository
from schemas.usage import PLAN_LIMITS, UNLIMITED, PlanUsage


def _start_of_utc_day() -> datetime:
    now = datetime.now(UTC)
    return datetime(now.year, now.month, now.day, tzinfo=UTC)


def _describe_limit(limit: int) -> str:
    return "unlimited" if limit == UNLIMITED else str(limit)


def _is_within_limit(current: int, additional: int, limit: int) -> bool:
    if limit == UNLIMITED:
        return True
    return current + additional <= limit


async def _get_plan(user_id: ObjectId) -> PlanTier:
    user = await User.get(user_id)
    if not user:
        raise NotFoundError("User not found")
    return user.plan


async def get_usage(db: AsyncIOMotorDatabase, user_id: ObjectId) -> PlanUsage:
    user = await User.get(user_id)
    if not user:
        raise NotFoundError("User not found")

    contacts, campaigns, emails_sent_today = await asyncio.gather(
        db["contacts"].count_documents({"userId": user_id}),
        db["campaigns"].count_documents({"userId": user_id}),
        db["emaillogs"].count_documents({"userId": user_id, "sentAt": {"$gte": _start_of_utc_day()}}),
    )

    return PlanUsage(
        plan=user.plan,
        limits=PLAN_LIMITS[user.plan],
        contacts=contacts,
        campaigns=campaigns,
        emailsSentToday=emails_sent_today,
    )


async def assert_can_add_contacts(user_id: ObjectId, additional: int) -> None:
    """Throws if adding `additional` contacts would exceed the plan — best-effort,
    not a transactional reservation, same trade-off as Node's version."""
    plan = await _get_plan(user_id)
    limit = PLAN_LIMITS[plan].maxContacts
    current = await contact_repository.count_by_user_id(user_id)

    if not _is_within_limit(current, additional, limit):
        raise PlanLimitExceededError(
            f"Your {plan} plan allows {_describe_limit(limit)} contacts and you have {current}. "
            f"Adding {additional} more would exceed it — upgrade your plan or remove some contacts."
        )


async def assert_can_create_campaign(user_id: ObjectId) -> None:
    plan = await _get_plan(user_id)
    limit = PLAN_LIMITS[plan].maxCampaigns
    current = await campaign_repository.count_by_user_id(user_id)

    if not _is_within_limit(current, 1, limit):
        raise PlanLimitExceededError(
            f"Your {plan} plan allows {_describe_limit(limit)} campaigns and you have {current}. Upgrade your plan to create more."
        )


async def assert_can_send_emails(user_id: ObjectId, recipient_count: int) -> None:
    """Checked at launch, against emails already sent today. A campaign larger
    than the remaining daily allowance is rejected up front rather than
    silently truncated — the user should decide what to cut."""
    plan = await _get_plan(user_id)
    limit = PLAN_LIMITS[plan].maxDailyEmails
    sent_today = await email_log_repository.count_sent_since(user_id, _start_of_utc_day())

    if not _is_within_limit(sent_today, recipient_count, limit):
        raise PlanLimitExceededError(
            f"Your {plan} plan allows {_describe_limit(limit)} emails per day and you've sent {sent_today} today. "
            f"Launching to {recipient_count} recipients would exceed it — upgrade your plan or launch a smaller campaign."
        )
