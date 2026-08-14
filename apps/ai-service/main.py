"""believe.ai AI service entrypoint — FastAPI app exposing the AI agents as
a REST API. Run with: uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import campaigns, career, improve, insights, interview, jobs, personalize, resumes, writer
from core.config import get_settings
from core.errors import NotFoundError
from core.logging import configure_logging, get_logger
from providers.errors import AiProviderError

configure_logging()
logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(title="believe.ai AI Service", version="0.1.0")

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


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "believe.ai AI Service",
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
app.include_router(jobs.router)
