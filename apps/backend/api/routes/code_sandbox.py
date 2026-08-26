"""Mirrors apps/api's codeSandbox.routes.ts."""

from __future__ import annotations

from fastapi import APIRouter

from api.dependencies import SettingsDep, UserIdDep
from schemas.code_sandbox import RunCodeInput, RunCodeResult
from services import code_sandbox_service

router = APIRouter(prefix="/code", tags=["code-sandbox"])


@router.post("/run", response_model=RunCodeResult)
async def run_code_route(body: RunCodeInput, settings: SettingsDep, _user_id: UserIdDep) -> RunCodeResult:
    return await code_sandbox_service.run(settings, body.language, body.sourceCode, body.stdin)
