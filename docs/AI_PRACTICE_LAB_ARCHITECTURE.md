# AI Practice Lab — Architecture Reference

Technical reference for the Phase 1 implementation. For scope rationale and decisions, see [`AI_PRACTICE_LAB_IMPLEMENTATION_PLAN.md`](./AI_PRACTICE_LAB_IMPLEMENTATION_PLAN.md).

## Frontend

`apps/web/src/features/practice-lab/` — one top-level page per route, small single-purpose components:

| Route | Page | Key components |
|---|---|---|
| `/app/practice` | `PracticeOverviewPage.tsx` | `PhaseNotice`, `PracticeProgressSummary`, `PracticeContinueCard`, `TrackOverviewCard`, `ChallengeCard` (featured) |
| `/app/practice/challenges` | `PracticeChallengesPage.tsx` | `ChallengeFilterBar`, `ChallengeGrid` → `ChallengeCard` / `ChallengeCardSkeleton` / `ChallengeLibraryEmptyState` / `ChallengeLibraryErrorState` |
| `/app/practice/challenges/:slug` | `PracticeWorkspacePage.tsx` | `WorkspaceHeader`, `ProblemPanel`, `FileExplorer`, `CodeEditor` (Monaco), `ResultTabs` → `TestsResultPanel` / `ConsolePanel`, `WorkspaceToolbar`, `SubmissionHistoryPanel`, `ExecutionStatusBanner` |

Shared: `practiceApi.ts` (all HTTP calls), `practiceWorkspaceStore.ts` (zustand, unpersisted — active file, dirty file contents, last execution result, scoped per challenge slug). `components/ui/Tabs.tsx` is a new shared primitive (underline-indicator tab bar with roving-tabindex keyboard nav), used for the challenge library's track filter and the workspace's Tests/Console tabs.

`ProblemPanel.tsx` renders challenge descriptions with a small dependency-free Markdown subset (`##` headings, blank-line paragraphs, `- ` lists, inline `` `code` `` and `**bold**` spans) rather than pulling in a Markdown library — nothing else in the app needs general Markdown rendering.

Monaco is loaded via `@monaco-editor/react` (the one new dependency this feature adds), themed to match the app's light/dark toggle.

## Backend

Standard four-layer pattern, one router per resource:

```
models/practice_challenge.py    Challenge (Beanie Document)
models/practice_submission.py   Submission
models/practice_progress.py     UserPracticeProgress

schemas/practice_challenge.py   ChallengeSummaryDto, ChallengeDetailDto, ...
schemas/practice_submission.py  RunSubmissionInput, ExecutionResultDto, SubmissionDto, ...
schemas/practice_progress.py    PracticeProgressDto

repositories/practice_challenge_repository.py
repositories/practice_submission_repository.py
repositories/practice_progress_repository.py

services/execution_service.py         ExecutionService Protocol + get_execution_service()
services/composite_execution_service.py  Routes each challenge to Judge0 or Mock
services/judge0_execution_service.py  Real execution for eligible single-file Python challenges
services/mock_execution_service.py    Honest no-op fallback for everything else
services/challenge_service.py
services/submission_service.py
services/practice_progress_service.py

api/routes/practice_challenges.py     GET /practice/challenges, GET /practice/challenges/{slug},
                                        POST /practice/challenges/{slug}/run,
                                        POST /practice/challenges/{slug}/evaluate
api/routes/practice_submissions.py    POST /practice/submissions, GET /practice/submissions,
                                        GET /practice/submissions/{id}
api/routes/practice_progress.py       GET /practice/progress
```

## MongoDB

Three collections. `Challenge.testCases` (hidden test definitions) is the one field that must never reach a public DTO — enforced structurally: `ChallengeDetailDto` has no `testCases` field at all, and `challenge_service._to_detail_dto` builds `sampleTests` only from `[t for t in doc.testCases if not t.hidden]`.

```
practice_challenges
  slug UNIQUE, (track, difficulty), (status, order)

practice_submissions
  (userId, createdAt DESC), (userId, challengeId, createdAt DESC)

user_practice_progress
  userId UNIQUE
```

`Challenge` has no `userId` — it's global, curated content, seeded via `apps/backend/scripts/seed_practice_challenges.py` reading `scripts/seed_data/practice_challenges/*.json` (one file per challenge, upserted by slug — safe to re-run after editing a file). No admin UI exists yet; authoring is directly editing these JSON files.

## Execution ("the honesty boundary")

```python
class ExecutionService(Protocol):
    async def run(self, challenge, files, language) -> ExecutionResultDto: ...
    async def evaluate(self, challenge, files, language) -> ExecutionResultDto: ...
    async def submit(self, challenge, files, language) -> ExecutionResultDto: ...
```

`get_execution_service(settings)` returns a `CompositeExecutionService`, which picks per challenge (`composite_execution_service.judge0_eligible()`, currently: `python-for-ai` track, single `.py` starter file):

- **Eligible → `Judge0ExecutionService`** — real, isolated execution. `executed: true`, `engine: "judge0"`, real `"passed"`/`"failed"` per test.
- **Everything else → `MockExecutionService`** — no code runs. `executed: false`, `engine: "mock"`, every test `"not_run"`.

Either way, the response carries an honest `message` the frontend renders via `ExecutionStatusBanner` (green when `executed: true`, amber when `false`) everywhere a result appears — workspace toolbar badge, Console tab, Tests tab (`TestsResultPanel` renders each test's *real* `outcome`, not a hardcoded label). No response ever claims a test passed when it didn't run.

**Run and Evaluate never touch MongoDB.** Only `submission_service.submit()` persists — it calls `ExecutionService.submit()`, writes one `Submission` document, and calls `practice_progress_repository.record_submission()` to update the caller's `UserPracticeProgress` (first-touch increments `challengesAttempted`; every submit increments `totalSubmissions` and updates the matching `attempts[]` entry).

### `Judge0ExecutionService` — how grading actually works

`services/judge0_execution_service.py` builds a harness: the student's own `solution.py` source, followed by one `try/except` block per test case that evaluates the test's `input` expression (challenge-authored, trusted — never student input) against the student's functions, and prints a JSON result line. `code_sandbox_service.run()` executes the whole harness as one Judge0 submission; `_parse_results()` splits the single stdout blob back into per-test outcomes by matching each line's `id`.

`Run` grades only non-hidden tests (fast public preview); `Evaluate`/`Submit` grade every test including hidden ones. A test's `expectedOutput` authored as `"SomeError: message"` is graded by exception type only (a student's exact message text can legitimately vary).

One real bug this caught during implementation, worth knowing if you add challenges: Judge0's available Python is **3.8.1**, which doesn't support PEP 585 builtin-generic syntax (`list[float]`) at runtime — but every challenge's starter code uses that modern annotation style. The harness fixes this by prepending `from __future__ import annotations` (PEP 563, lazy string annotations) rather than rewriting every challenge's type hints.

### `code_sandbox_service.py` — self-hosted Judge0, not RapidAPI

`services/code_sandbox_service.py` (shared with Interview Prep) tries two backends, self-hosted first: `JUDGE0_SELF_HOSTED_URL` (free, checked first since it costs nothing to call) then `RAPIDAPI_KEY` (the original hosted fallback). Both speak the same Judge0 REST API.

The self-hosted stack lives in `docker-compose.yml` (`judge0-db` Postgres, `judge0-redis`, `judge0-server`, `judge0-workers`) configured via `judge0.conf` at the repo root:

```
docker compose up -d judge0-db judge0-redis judge0-server judge0-workers
# API at http://localhost:2358 — set JUDGE0_SELF_HOSTED_URL=http://localhost:2358 in apps/backend/.env
```

**A real compatibility issue you'll hit on modern hosts**: `judge0/judge0:1.13.1` bundles `isolate` 1.8.1 (built 2021), which only understands the legacy cgroup v1 per-controller layout. Docker Desktop's WSL2 backend (and most current Linux kernels) run **cgroup v2 unified hierarchy only** — confirmed via `isolate-check-environment` inside the workers container reporting the v1 `memory`/`cpuacct`/`cpuset` controllers as absent, and `isolate --cg` failing with `Failed to create control group /sys/fs/cgroup/memory/box-0/: No such file or directory`.

The fix, discovered by reading Judge0's own `app/jobs/isolate_job.rb` (`@cgroups = (!enable_per_process_and_thread_time_limit || !enable_per_process_and_thread_memory_limit) ? "--cg" : ""`): isolate only runs *without* `--cg` — falling back to plain rlimit/namespace isolation — when both `ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT` and `ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT` (and their matching `ALLOW_ENABLE_*` flags, or Judge0 rejects the contradiction outright) are `true`. `judge0.conf` sets all four to `true` for exactly this reason. This is a real, still-isolated sandbox mode (chroot/namespace jail, `setrlimit()`-enforced CPU/memory/output caps, dropped privileges, no network) — just without cgroup-level resource accounting, which matters for precision under heavy concurrent load, not for basic safety at this scale.

If cgroup v1 (or a newer isolate build with native cgroup v2 support) is available on a future deployment target, this workaround can be reverted — nothing else about the integration depends on it.

### Future work: RAG/Agent execution

Judge0 only covers single-file Python with no external dependencies — RAG/Agent challenges need numpy/sklearn/langchain/etc. and can't run there. The real target for those is the blueprint's Docker-sandboxed worker vision: `apps/backend/worker/` already runs a real `arq` worker against a real Redis instance for other queues (`send_campaign_email`, etc.). A `practice_execution` job registered the same way, dispatched from `POST /practice/challenges/{slug}/run`, executing inside an ephemeral, resource-limited, network-disabled container (`believe-practice-python:1` / `-rag:1` / `-agents:1` images per the original blueprint) is the natural next step. This is genuinely new infrastructure (no Docker-from-Python precedent exists in this repo yet) and should get its own spike before wiring into the full challenge set. The frontend needs zero changes when it lands — `ExecutionResultDto`'s shape and the `TestOutcome` union already support real `"passed"`/`"failed"` values; only `get_execution_service()`'s routing changes.

## Evaluation

Not built in Phase 1. The blueprint's `BaseEvaluator` → `UnitTestEvaluator` / `RAGEvaluator` / `AgentEvaluator` / ... hierarchy is real future work once actual execution exists — grading requires something to have actually run. Phase 1's `testCases` schema (`input`, `expectedOutput`, `hidden`) is already evaluator-agnostic and ready for a real `UnitTestEvaluator` to consume once it exists.

## Security

- **Hidden tests never reach the browser** — verified live via network inspection during implementation, not just code review: `GET /practice/challenges/{slug}` returns `sampleTests` (non-hidden only), never `testCases`. The harness that evaluates hidden tests runs entirely server-side, inside the sandbox — the student never sees the hidden `input`/`expectedOutput` values, only whether their submission's own stdout line reported `passed`.
- **User code does execute for eligible challenges** — inside the self-hosted Judge0 sandbox (see Execution above), never in the FastAPI process. `MockExecutionService` (everything else) never calls `exec`, `eval`, or a subprocess — nothing to sandbox because nothing runs.
- **Sandbox isolation for the eligible path**: non-root execution, `setrlimit()`-enforced CPU time / wall time / memory / stack / output-size / process-count limits (see `judge0.conf`), a chroot/namespace-jailed working directory destroyed after each run, no network access, no Docker socket inside the sandbox container, no Believe.ai secrets or host filesystem reachable from it. The one deviation from the blueprint's baseline is cgroup-level resource *accounting* (see Execution above for why) — the limits themselves are still enforced, just via rlimits/namespaces instead of cgroups.
- **Auth** — every practice route requires `MongoUserIdDep` (a verified Firebase ID token resolved to the caller's Mongo user id), the same dependency every other authenticated route in this backend uses. No new auth pattern.
- RAG/Agent challenges (needing real dependencies) still run nothing — see Future Work — so the blueprint's full Docker-sandbox baseline (including cgroup accounting on a compatible host) applies in full whenever that lands.

## APIs

```
GET  /practice/challenges?q=&track=&difficulty=&challengeType=&status=&page=&limit=
GET  /practice/challenges/{slug}
POST /practice/challenges/{slug}/run        { files, language }  -> ExecutionResultDto (not persisted)
POST /practice/challenges/{slug}/evaluate   { files, language }  -> ExecutionResultDto (not persisted)
POST /practice/submissions                  { challengeId, files, language } -> SubmissionDto (persisted)
GET  /practice/submissions?challengeId=&page=&limit=
GET  /practice/submissions/{id}
GET  /practice/progress
```

All authenticated (`MongoUserIdDep`). Pagination follows the existing `PaginatedResult<T>` / `DEFAULT_PAGE_SIZE` convention (`schemas/pagination.py`). Filtering combines a MongoDB query (track/difficulty/challengeType/text search, via `repositories/practice_challenge_repository.py`'s regex-`$or` + exact-match pattern, mirroring `job_repository.py`) with an in-memory status filter (`unsolved`/`attempted`, resolved per-request against the caller's own `UserPracticeProgress` — deliberately not stored on `Challenge`, which is shared content) applied before pagination, since status depends on who's asking.

## Challenge authoring (current process — no CMS yet)

1. Add a JSON file to `apps/backend/scripts/seed_data/practice_challenges/`, named by slug, matching `Challenge`'s field shape (see any existing file for the exact structure — `slug`, `title`, `track`, `difficulty`, `challengeType`, `summary`, `description` (Markdown), `tags`, `estimatedMinutes`, `starterFiles`, `testCases` (`hidden: true/false` per case), `resources`, `order`).
2. Run `python -m scripts.seed_practice_challenges` from `apps/backend` — upserts by slug, safe to re-run.
3. `coding`/`debugging` challenges need a `solution.py` starter plus a mix of visible (`hidden: false`) and hidden sample tests. `system-design`/`prompt-engineering` challenges use a single `answer.md` starter and an empty `testCases` array — there's no automated grading story for free-text answers yet, even conceptually, so don't fabricate test cases for them.
4. Never write a description claiming functionality Phase 1 doesn't have (a specific latency number, a "grade" the mock can't produce, etc.) — the workspace will faithfully render whatever the description says, including anything dishonest.
