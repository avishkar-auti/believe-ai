"""Runs candidate code through Judge0 — mirrors apps/api's codeSandbox.service.ts.
A small curated language set — enough for typical interview practice, not a
general-purpose IDE.

Two Judge0 backends are supported, tried in this order:
1. Self-hosted (JUDGE0_SELF_HOSTED_URL, see docker-compose.yml's judge0-server
   + judge0.conf) — free, no external API key, checked first since it costs
   nothing to call.
2. Judge0-via-RapidAPI (RAPIDAPI_KEY) — the original hosted fallback.

Both speak the same Judge0 REST API; only the base URL and auth headers differ.
"""

from __future__ import annotations

import httpx

from core.config import Settings
from core.errors import IntegrationError, ValidationError
from schemas.code_sandbox import RunCodeResult

_LANGUAGE_IDS = {"python": 71, "javascript": 63, "java": 62, "cpp": 54, "go": 95}

_RAPIDAPI_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true"


def _request_target(settings: Settings) -> tuple[str, dict[str, str]] | None:
    """Returns (url, extra_headers) for whichever backend is configured, or
    None if neither is. Self-hosted wins when both are set."""
    if settings.judge0_self_hosted_url:
        base = settings.judge0_self_hosted_url.rstrip("/")
        return f"{base}/submissions?base64_encoded=false&wait=true", {}
    if settings.rapidapi_key:
        return _RAPIDAPI_URL, {"X-RapidAPI-Key": settings.rapidapi_key, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"}
    return None


async def run(settings: Settings, language: str, source_code: str, stdin: str) -> RunCodeResult:
    target = _request_target(settings)
    if not target:
        raise IntegrationError(
            "The code sandbox isn't configured yet — set JUDGE0_SELF_HOSTED_URL (a self-hosted Judge0, see "
            "docker-compose.yml) or RAPIDAPI_KEY (Judge0 via RapidAPI) on the server."
        )
    if language not in _LANGUAGE_IDS:
        raise ValidationError(f"Unsupported language \"{language}\". Supported: {', '.join(_LANGUAGE_IDS)}")

    url, extra_headers = target
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            url,
            headers={"Content-Type": "application/json", **extra_headers},
            json={"source_code": source_code, "language_id": _LANGUAGE_IDS[language], "stdin": stdin},
        )

    if res.is_error:
        raise IntegrationError(f"Code sandbox request failed: {res.status_code} {res.text}")

    data = res.json()
    return RunCodeResult(
        stdout=data.get("stdout"),
        stderr=data.get("stderr") or data.get("message"),
        compileOutput=data.get("compile_output"),
        status=data["status"]["description"],
        timeSeconds=float(data["time"]) if data.get("time") else None,
        memoryKb=data.get("memory"),
    )
