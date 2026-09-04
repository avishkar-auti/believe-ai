"""Real, isolated single-file Python execution via Judge0/RapidAPI — reuses
services/code_sandbox_service.py, already live in Interview Prep. Eligible
for any single-file Python challenge whose starter code imports nothing
beyond the standard library (see judge0_eligible()) — not restricted to a
particular track. Judge0 can't install packages or run multi-file projects,
so a challenge needing numpy/sklearn/langchain/etc. (none currently seeded
do) automatically stays behind MockExecutionService instead of being routed
to a sandbox that would fail every submission with ImportError regardless
of correctness. This is the only ExecutionService implementation that
actually runs code — `executed` is True and outcomes are real
"passed"/"failed" only from here.

Grading works by generating a small harness: the student's own solution
source, followed by one try/except block per test case that evaluates the
test's `input` expression (challenge-authored, trusted content — not
student input) against the student's functions, and prints a JSON line
with the result. Judge0 returns one stdout blob for the whole script, which
_parse_results() splits back into per-test outcomes."""

from __future__ import annotations

import ast
import json
import re
import sys

from core.config import Settings
from models.practice_challenge import Challenge, ChallengeTestCase
from schemas.practice_submission import ExecutionResultDto, SubmissionTestResultDto
from services import code_sandbox_service

# Matches an expectedOutput authored as "SomeError: message" — graded by
# exception type only, since a student's exact message text can legitimately
# vary while still satisfying a challenge's stated requirement.
_EXCEPTION_PATTERN = re.compile(r"^(\w+Error): ")
_RESULT_LINE_PATTERN = re.compile(r"^\{.*\}$")


def _imports_only_stdlib(source: str) -> bool:
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return False

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            if any(alias.name.split(".")[0] not in sys.stdlib_module_names for alias in node.names):
                return False
        elif isinstance(node, ast.ImportFrom):
            if node.module and node.module.split(".")[0] not in sys.stdlib_module_names:
                return False
    return True


def judge0_eligible(challenge: Challenge) -> bool:
    if len(challenge.starterFiles) != 1 or not challenge.testCases:
        return False
    starter = challenge.starterFiles[0]
    return starter.path.endswith(".py") and _imports_only_stdlib(starter.content)


def _harness_snippet(test_case: ChallengeTestCase) -> str:
    test_id = json.dumps(test_case.id)
    exc_match = _EXCEPTION_PATTERN.match(test_case.expectedOutput or "")
    if exc_match:
        expected_type = json.dumps(exc_match.group(1))
        return (
            f"try:\n"
            f"    _r = {test_case.input}\n"
            f"    print(_json.dumps({{'id': {test_id}, 'passed': False, 'actual': repr(_r)}}))\n"
            f"except Exception as _e:\n"
            f"    _p = type(_e).__name__ == {expected_type}\n"
            f"    print(_json.dumps({{'id': {test_id}, 'passed': _p, 'actual': f'{{type(_e).__name__}}: {{_e}}'}}))\n"
        )
    expected = json.dumps(test_case.expectedOutput)
    return (
        f"try:\n"
        f"    _a = repr({test_case.input})\n"
        f"    _p = _a == {expected}\n"
        f"    print(_json.dumps({{'id': {test_id}, 'passed': _p, 'actual': _a}}))\n"
        f"except Exception as _e:\n"
        f"    print(_json.dumps({{'id': {test_id}, 'passed': False, 'actual': f'{{type(_e).__name__}}: {{_e}}'}}))\n"
    )


def _build_harness(solution_source: str, test_cases: list[ChallengeTestCase]) -> str:
    # Judge0's Python is 3.8.1, which doesn't support PEP 585 builtin generic
    # subscripting (`list[float]`) at runtime — but every challenge's starter
    # code uses that modern syntax in its annotations. `from __future__ import
    # annotations` (PEP 563) makes annotations lazy strings, never evaluated
    # unless something calls typing.get_type_hints() — which nothing here
    # does — so the harness runs fine without touching challenge content.
    parts = ["from __future__ import annotations", "", solution_source, "", "import json as _json"]
    parts.extend(_harness_snippet(t) for t in test_cases)
    return "\n".join(parts)


def _parse_results(stdout: str | None) -> dict[str, tuple[bool, str]]:
    results: dict[str, tuple[bool, str]] = {}
    for raw_line in (stdout or "").splitlines():
        line = raw_line.strip()
        if not _RESULT_LINE_PATTERN.match(line):
            continue
        try:
            data = json.loads(line)
            results[data["id"]] = (bool(data["passed"]), str(data.get("actual", "")))
        except (json.JSONDecodeError, KeyError, TypeError):
            continue
    return results


class Judge0ExecutionService:
    def __init__(self, settings: Settings):
        self._settings = settings

    async def _execute(self, challenge: Challenge, files: dict[str, str], test_cases: list[ChallengeTestCase]) -> ExecutionResultDto:
        starter = challenge.starterFiles[0]
        source = files.get(starter.path, starter.content)
        harness = _build_harness(source, test_cases)

        result = await code_sandbox_service.run(self._settings, "python", harness, "")
        parsed = _parse_results(result.stdout)

        test_results = [
            SubmissionTestResultDto(
                testCaseId=t.id,
                name=t.name,
                hidden=t.hidden,
                outcome=("passed" if parsed[t.id][0] else "failed") if t.id in parsed else "failed",
            )
            for t in test_cases
        ]

        total = len(test_results)
        passed_count = sum(1 for r in test_results if r.outcome == "passed")
        message = (
            f"Ran for real in an isolated Judge0 sandbox — {passed_count}/{total} test{'s' if total != 1 else ''} passed."
            if total
            else "Ran for real in an isolated Judge0 sandbox."
        )

        return ExecutionResultDto(
            engine="judge0",
            executed=True,
            stdout=result.stdout,
            stderr=result.stderr or result.compileOutput,
            testResults=test_results,
            totalCount=total,
            message=message,
        )

    async def run(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        # Run is the fast/public-only preview — never grades hidden tests.
        return await self._execute(challenge, files, [t for t in challenge.testCases if not t.hidden])

    async def evaluate(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        return await self._execute(challenge, files, challenge.testCases)

    async def submit(self, challenge: Challenge, files: dict[str, str], language: str) -> ExecutionResultDto:
        return await self._execute(challenge, files, challenge.testCases)
