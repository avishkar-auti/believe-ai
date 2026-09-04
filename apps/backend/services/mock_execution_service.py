"""Phase 1 placeholder ExecutionService. No Docker sandbox, no Judge0 call —
no code is ever actually executed. Every result is unambiguous about that
(executed=False, engine="mock", outcome="not_run" for every test) so the
frontend never renders a real-looking pass/fail state for work that never
ran. See services/execution_service.py for the abstraction this implements
and the future real-engine swap point."""

from __future__ import annotations

from models.practice_challenge import Challenge
from schemas.practice_submission import ExecutionResultDto, SubmissionTestResultDto

_DISCLAIMER = (
    "Sandboxed execution isn't connected yet — this is a Phase 1 preview. Your code was saved, but nothing actually ran."
)


def _not_run_results(challenge: Challenge) -> list[SubmissionTestResultDto]:
    return [
        SubmissionTestResultDto(testCaseId=t.id, name=t.name, hidden=t.hidden, outcome="not_run")
        for t in challenge.testCases
    ]


class MockExecutionService:
    async def run(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        return ExecutionResultDto(
            engine="mock", executed=False, stdout=None, stderr=None, testResults=[], totalCount=0, message=_DISCLAIMER
        )

    async def evaluate(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        results = _not_run_results(challenge)
        message = (
            f"No sandbox is connected yet — none of this challenge's {len(results)} tests actually ran."
            if results
            else _DISCLAIMER
        )
        return ExecutionResultDto(
            engine="mock", executed=False, stdout=None, stderr=None, testResults=results, totalCount=len(results), message=message
        )

    async def submit(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        results = _not_run_results(challenge)
        return ExecutionResultDto(
            engine="mock",
            executed=False,
            stdout=None,
            stderr=None,
            testResults=results,
            totalCount=len(results),
            message=_DISCLAIMER,
        )
