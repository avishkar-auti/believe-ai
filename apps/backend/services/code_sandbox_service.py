"""Runs candidate code through Judge0 (via RapidAPI) — mirrors apps/api's
codeSandbox.service.ts. A small curated language set — enough for typical
interview practice, not a general-purpose IDE."""

from __future__ import annotations

import httpx

from core.config import Settings
from core.errors import IntegrationError, ValidationError
from schemas.code_sandbox import RunCodeResult

_LANGUAGE_IDS = {"python": 71, "javascript": 63, "java": 62, "cpp": 54, "go": 95}

_JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true"


async def run(settings: Settings, language: str, source_code: str, stdin: str) -> RunCodeResult:
    if not settings.rapidapi_key:
        raise IntegrationError("The code sandbox isn't configured yet — this needs a Judge0/RapidAPI key (RAPIDAPI_KEY) on the server.")
    if language not in _LANGUAGE_IDS:
        raise ValidationError(f"Unsupported language \"{language}\". Supported: {', '.join(_LANGUAGE_IDS)}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            _JUDGE0_URL,
            headers={
                "Content-Type": "application/json",
                "X-RapidAPI-Key": settings.rapidapi_key,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
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
