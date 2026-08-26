"""Outreach drafts — mirrors apps/api's outreachDraft.service.ts. Step A
(grounded hook, no LLM) -> Step B (one in-process AI call per contact for
cold email + LinkedIn note). Every draft persists as "pending" — nothing
here ever sends anything, that's services/outreach_send_service.py.
"""

from __future__ import annotations

from bson import ObjectId
from langgraph.types import Command
from motor.motor_asyncio import AsyncIOMotorDatabase

from agents.outreach_approval.graph import get_outreach_approval_graph
from agents.outreach_draft_agent import generate_outreach_draft
from core.config import Settings
from core.errors import NotFoundError, ValidationError
from models.outreach_draft import OutreachDraft
from models.user import User
from repositories import contact_repository, job_intel_repository, outreach_draft_repository, resumes_repository
from schemas.ai import OutreachDraftRequest
from schemas.outreach_draft import DecidableDraftStatus, OutreachDraftDto, OutreachDraftEditedTextInput
from services.outreach_hook import compute_matching_skills, compute_outreach_hook

_LINKEDIN_NOTE_CHAR_LIMIT = 300


def _to_dto(doc: OutreachDraft) -> OutreachDraftDto:
    return OutreachDraftDto(
        id=str(doc.id),
        userId=str(doc.userId),
        jobIntelId=str(doc.jobIntelId),
        contactId=str(doc.contactId),
        contactName=doc.contactName,
        hook=doc.hook,
        hookConfidence=doc.hookConfidence,
        coldEmail=doc.coldEmail,
        linkedinNote=doc.linkedinNote,
        referralRequest=doc.referralRequest,
        coverLetter=doc.coverLetter,
        status=doc.status,
        editedText=(
            OutreachDraftEditedTextInput(
                coldEmail=doc.editedText.coldEmail,
                linkedinNote=doc.editedText.linkedinNote,
                referralRequest=doc.editedText.referralRequest,
                coverLetter=doc.editedText.coverLetter,
            )
            if doc.editedText
            else None
        ),
        createdAt=doc.createdAt.isoformat(),
        updatedAt=doc.updatedAt.isoformat(),
    )


def _truncate_linkedin_note(text: str) -> str:
    """Deterministic truncation — the model is asked to respect the 300-char LinkedIn
    connection-note limit but isn't fully reliable about it on its own."""
    if len(text) <= _LINKEDIN_NOTE_CHAR_LIMIT:
        return text
    return text[: _LINKEDIN_NOTE_CHAR_LIMIT - 1].rstrip() + "…"


async def generate(
    settings: Settings, db: AsyncIOMotorDatabase, user_id: ObjectId, job_intel_id: ObjectId, contact_ids: list[ObjectId]
) -> list[OutreachDraftDto]:
    if not contact_ids:
        raise ValidationError("Select at least one contact")

    job_intel = await job_intel_repository.find_by_id(job_intel_id, user_id)
    if not job_intel:
        raise NotFoundError("Job analysis not found")

    contacts = await contact_repository.find_many_by_ids(contact_ids, user_id)
    if len(contacts) != len(contact_ids):
        raise NotFoundError("One or more contacts not found")

    resume, user = await resumes_repository.find_by_user_id(db, user_id), await User.get(user_id)

    outreach_hook = compute_outreach_hook(job_intel.company, job_intel.skills, job_intel.companyIntel)
    matching_skills = compute_matching_skills(job_intel.skills, (resume or {}).get("content"))
    include_cover_letter = bool(resume)

    drafts: list[OutreachDraft] = []
    for contact in contacts:
        contact_name = f"{contact.firstName} {contact.lastName}".strip()
        ai = await generate_outreach_draft(
            settings,
            OutreachDraftRequest(
                contactName=contact_name,
                roleTitle=job_intel.roleTitle,
                company=job_intel.company,
                hook=outreach_hook.hook,
                matchingSkills=matching_skills,
                candidateName=user.name if user else None,
                includeCoverLetter=include_cover_letter,
            ),
        )
        assert contact.id is not None
        drafts.append(
            OutreachDraft(
                userId=user_id,
                jobIntelId=job_intel_id,
                contactId=contact.id,
                contactName=contact_name,
                hook=outreach_hook.hook,
                hookConfidence=outreach_hook.confidence,
                coldEmail=ai.coldEmail,
                linkedinNote=_truncate_linkedin_note(ai.linkedinNote),
                # OutreachDraftResult has no coverLetter field yet — matches
                # today's actual Node behavior (includeCoverLetter is sent to
                # the model but never comes back structured), not a regression.
                coverLetter=None,
            )
        )

    created = await outreach_draft_repository.create_many(drafts)

    # Each draft gets its own interrupted graph run, keyed by draft id — parked at
    # await_approval until a later decide() call resumes it with the human's
    # decision, possibly hours or days from now, possibly after a restart.
    graph = get_outreach_approval_graph()
    for doc in created:
        assert doc.id is not None
        await graph.ainvoke(
            {"draft_id": str(doc.id), "user_id": str(user_id)}, config={"configurable": {"thread_id": str(doc.id)}}
        )

    return [_to_dto(doc) for doc in created]


async def list_by_job_intel(job_intel_id: ObjectId, user_id: ObjectId) -> list[OutreachDraftDto]:
    docs = await outreach_draft_repository.list_by_job_intel(job_intel_id, user_id)
    return [_to_dto(doc) for doc in docs]


async def decide(
    draft_id: ObjectId, user_id: ObjectId, status: DecidableDraftStatus, edited_text: OutreachDraftEditedTextInput | None
) -> OutreachDraftDto:
    if status == "edited" and not edited_text:
        raise ValidationError("editedText is required when marking a draft edited")

    # Scoped-by-user lookup before touching anything — the graph resume below is
    # keyed only by draft_id (its thread_id), so this is what actually enforces
    # that a user can only decide on their own drafts.
    existing = await outreach_draft_repository.find_by_id(draft_id, user_id)
    if not existing:
        raise NotFoundError("Draft not found")

    # Resumes the same interrupted run generate() started for this draft — this
    # is the actual human_approval_gate: persist_decision_node (graph.py) only
    # ever writes the decision once this resume unblocks it.
    graph = get_outreach_approval_graph()
    await graph.ainvoke(
        Command(resume={"status": status, "editedText": edited_text.model_dump() if edited_text else None}),
        config={"configurable": {"thread_id": str(draft_id)}},
    )

    doc = await outreach_draft_repository.find_by_id(draft_id, user_id)
    if not doc:
        raise NotFoundError("Draft not found")
    return _to_dto(doc)
