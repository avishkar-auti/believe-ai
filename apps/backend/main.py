"""believe.ai backend entrypoint — FastAPI app exposing every route (AI
agents, CRUD, auth, realtime) as one REST API. Run with:
uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from agents.outreach_approval.graph import init_outreach_approval_graph
from api.routes import (
    analytics,
    audit,
    auth,
    campaigns,
    career,
    career_fit,
    code_sandbox,
    contacts,
    design,
    discussions,
    feedback,
    improve,
    insights,
    integrations,
    interview,
    interview_sessions,
    job_board,
    job_intel,
    job_lead,
    jobs,
    mock_interview_room,
    news,
    notes,
    notifications,
    outreach_draft,
    personalize,
    practice_challenges,
    practice_progress,
    practice_submissions,
    profile_achievements,
    profile_certifications,
    profile_education,
    profile_experience,
    profile_image,
    profile_projects,
    profile_skills,
    public_profile,
    resume,
    resumes,
    roadmap,
    room_feedback,
    room_idea,
    room_transcript,
    templates,
    tracking,
    usage,
    user_context,
    writer,
)
from core.config import get_settings
from core.db import init_odm
from core.errors import (
    AuthorizationError,
    IntegrationError,
    InvalidStateTransitionError,
    NotFoundError,
    PlanLimitExceededError,
    ValidationError,
)
from core.logging import configure_logging, get_logger
from core.tracing import configure_tracing
from providers.errors import AiProviderError
from ws import mock_interview

configure_logging()
logger = get_logger(__name__)
settings = get_settings()
configure_tracing(settings)

# Bounded, not indefinite: a Mongo blip at startup shouldn't take down every
# route in this service, only the Beanie-backed ones that actually need it —
# same "degrade, don't block" pattern used throughout this service's request
# handling, just applied to startup too.
ODM_INIT_TIMEOUT_SECONDS = 10.0

# Local SQLite file backing the Job Outreach approval graph's checkpointer —
# runtime pause/resume state, not domain data, so it deliberately doesn't live
# in Mongo alongside the OutreachDraft documents it pauses around.
OUTREACH_APPROVAL_CHECKPOINT_DB = Path(__file__).resolve().parent / "data" / "outreach_approval_checkpoints.sqlite"


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    try:
        await asyncio.wait_for(init_odm(), timeout=ODM_INIT_TIMEOUT_SECONDS)
    except Exception as err:  # noqa: BLE001 — deliberately broad: nothing here should stop this service starting
        logger.warning("Beanie ODM init failed or timed out, Beanie-backed routes will error: %s", err)

    OUTREACH_APPROVAL_CHECKPOINT_DB.parent.mkdir(parents=True, exist_ok=True)
    async with AsyncSqliteSaver.from_conn_string(str(OUTREACH_APPROVAL_CHECKPOINT_DB)) as checkpointer:
        # Without this, the checkpoints/writes tables never get created and every
        # graph.ainvoke() call fails with "no such table" the first time it tries
        # to persist a checkpoint — after the draft's already been written to Mongo,
        # so it manifests as a request that silently dies mid-response.
        await checkpointer.setup()
        init_outreach_approval_graph(checkpointer)
        yield


app = FastAPI(title="believe.ai Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AiProviderError)
async def ai_provider_error_handler(_request: Request, exc: AiProviderError) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"success": False, "error": {"code": "AI_PROVIDER_ERROR", "message": str(exc)}},
    )


@app.exception_handler(NotFoundError)
async def not_found_error_handler(_request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"success": False, "error": {"code": "NOT_FOUND", "message": str(exc)}},
    )


@app.exception_handler(PlanLimitExceededError)
async def plan_limit_exceeded_error_handler(_request: Request, exc: PlanLimitExceededError) -> JSONResponse:
    return JSONResponse(
        status_code=402,
        content={"success": False, "error": {"code": "PLAN_LIMIT_EXCEEDED", "message": str(exc)}},
    )


@app.exception_handler(InvalidStateTransitionError)
async def invalid_state_transition_error_handler(_request: Request, exc: InvalidStateTransitionError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"success": False, "error": {"code": "INVALID_STATE_TRANSITION", "message": str(exc)}},
    )


@app.exception_handler(ValidationError)
async def validation_error_handler(_request: Request, exc: ValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
    )


@app.exception_handler(AuthorizationError)
async def authorization_error_handler(_request: Request, exc: AuthorizationError) -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content={"success": False, "error": {"code": "UNAUTHORIZED", "message": str(exc)}},
    )


@app.exception_handler(IntegrationError)
async def integration_error_handler(_request: Request, exc: IntegrationError) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"success": False, "error": {"code": "INTEGRATION_ERROR", "message": str(exc)}},
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "believe.ai Backend",
        "docs": "/docs",
        "health": "/health",
    }


app.include_router(writer.router)
app.include_router(improve.router)
app.include_router(personalize.router)
app.include_router(insights.router)
app.include_router(campaigns.router)
app.include_router(resumes.router)
app.include_router(career.router)
app.include_router(interview.router)
app.include_router(interview_sessions.router)
app.include_router(jobs.router)
app.include_router(job_board.router)
app.include_router(job_intel.router)
app.include_router(outreach_draft.router)
app.include_router(job_lead.router)
app.include_router(mock_interview.router)
app.include_router(news.router)
app.include_router(notes.router)
app.include_router(audit.router)
app.include_router(notifications.router)
app.include_router(user_context.router)
app.include_router(usage.router)
app.include_router(contacts.router)
app.include_router(design.router)
app.include_router(templates.router)
app.include_router(tracking.router)
app.include_router(integrations.router)
app.include_router(discussions.router)
app.include_router(mock_interview_room.router)
app.include_router(room_idea.router)
app.include_router(room_feedback.router)
app.include_router(room_transcript.router)
app.include_router(code_sandbox.router)
app.include_router(auth.router)
app.include_router(public_profile.router)
app.include_router(profile_image.router)
app.include_router(profile_experience.router)
app.include_router(profile_education.router)
app.include_router(profile_skills.router)
app.include_router(profile_projects.router)
app.include_router(profile_certifications.router)
app.include_router(profile_achievements.router)
app.include_router(feedback.router)
app.include_router(analytics.router)
app.include_router(career_fit.router)
app.include_router(roadmap.router)
app.include_router(resume.router)
app.include_router(practice_challenges.router)
app.include_router(practice_submissions.router)
app.include_router(practice_progress.router)
