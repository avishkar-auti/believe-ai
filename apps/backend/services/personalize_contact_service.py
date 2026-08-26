"""Personalizes a campaign's email for one real, stored contact — pulls the
campaign's template, the contact's data, and the sender's Believe Profile,
then delegates to the same personalization agent the request-body-driven
route uses.
"""

from __future__ import annotations

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.personalization_agent import personalize_email
from core.config import Settings
from core.errors import NotFoundError
from repositories import campaigns_repository, contacts_repository, templates_repository, user_contexts_repository
from schemas.ai import AiPersonalizeRequest, AiPersonalizeResult, ContactPersonalizationInput
from utils.user_context import format_user_context_for_prompt


async def personalize_for_contact(
    settings: Settings,
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
    campaign_id: ObjectId,
    contact_id: ObjectId,
) -> AiPersonalizeResult:
    campaign = await campaigns_repository.find_by_id_scoped(db, campaign_id, user_id)
    if not campaign:
        raise NotFoundError("Campaign not found")

    template = await templates_repository.find_by_id_scoped(db, campaign["templateId"], user_id)
    if not template:
        raise NotFoundError("Campaign's template no longer exists")

    contact = await contacts_repository.find_by_id_scoped(db, contact_id, user_id)
    if not contact:
        raise NotFoundError("Contact not found")

    profile = await user_contexts_repository.find_by_user_id(db, user_id)

    req = AiPersonalizeRequest(
        templateSubject=campaign.get("subject") or template["subject"],
        templateBody=template["body"],
        contact=ContactPersonalizationInput(
            firstName=contact["firstName"],
            lastName=contact.get("lastName") or "",
            company=contact.get("company"),
            jobTitle=contact.get("jobTitle"),
        ),
        senderContext=format_user_context_for_prompt(profile),
    )
    return await personalize_email(settings, req)
