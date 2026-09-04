"""Routes each challenge to a real execution engine when one exists for its
shape, and falls back to MockExecutionService otherwise — so an unsupported
challenge (multi-file, needs external dependencies) or a missing Judge0
backend (see services/code_sandbox_service.py — self-hosted or RapidAPI)
degrades honestly to a clearly-labeled preview instead of hard-failing the
whole workspace. A genuine Judge0 failure (network error, Judge0 down) is
deliberately NOT caught here and swallowed into a fake mock response —
letting it propagate to the existing IntegrationError -> 502 handler is
more honest than silently pretending nothing was attempted."""

from __future__ import annotations

from core.config import Settings
from models.practice_challenge import Challenge
from schemas.practice_submission import ExecutionResultDto
from services.judge0_execution_service import Judge0ExecutionService, judge0_eligible
from services.mock_execution_service import MockExecutionService


class CompositeExecutionService:
    def __init__(self, settings: Settings):
        self._mock = MockExecutionService()
        judge0_configured = bool(settings.judge0_self_hosted_url or settings.rapidapi_key)
        self._judge0 = Judge0ExecutionService(settings) if judge0_configured else None

    def _select(self, challenge: Challenge) -> MockExecutionService | Judge0ExecutionService:
        if self._judge0 and judge0_eligible(challenge):
            return self._judge0
        return self._mock

    async def run(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        return await self._select(challenge).run(challenge, files, language)

    async def evaluate(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        return await self._select(challenge).evaluate(challenge, files, language)

    async def submit(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        return await self._select(challenge).submit(challenge, files, language)
