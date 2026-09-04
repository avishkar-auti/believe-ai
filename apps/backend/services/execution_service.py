"""The seam between challenge-solving UI actions and however code actually
gets executed. Mirrors providers/base.py's Protocol pattern for AiProvider —
one contract, swappable implementations. get_execution_service() returns a
CompositeExecutionService, which picks a real engine (Judge0, for eligible
single-file Python challenges) or MockExecutionService per challenge — see
services/composite_execution_service.py for the routing rule, and
services/judge0_execution_service.py / mock_execution_service.py for the
two implementations."""

from __future__ import annotations

from typing import Protocol

from core.config import Settings
from models.practice_challenge import Challenge
from schemas.practice_submission import ExecutionResultDto
from services.composite_execution_service import CompositeExecutionService


class ExecutionService(Protocol):
    async def run(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto: ...

    async def evaluate(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto: ...

    async def submit(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto: ...


def get_execution_service(settings: Settings) -> ExecutionService:
    return CompositeExecutionService(settings)
