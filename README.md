# believe.ai

**Believe in your next opportunity.**

An AI-powered career and outreach platform — write with AI, personalize per
recipient, send responsibly, practice interviews live with peers, and
understand what actually gets responses.

---

## Features

| Area | What's implemented |
| --- | --- |
| **Auth** | Firebase Authentication (Google + email/password), backend ID-token verification, per-user data scoping, self-serve profile |
| **Contacts** | CRUD, search/filter/sort, tags, CSV import with column mapping + validation, CSV export |
| **Templates** | CRUD, duplicate, `{{variable}}` interpolation, HTML sanitization |
| **AI writing** | Email writer, tone/style improvement, per-recipient personalization, campaign insights — provider fallback (Gemini/Groq/OpenAI-compatible/Ollama) |
| **Believe Profile** | Optional user context (about, company, offer, skills, achievements, audience) fed automatically into every AI call |
| **Campaigns** | Explicit state machine, audience selection, scheduling, daily send limits with jitter, launch/pause/resume/cancel, auto-completion |
| **Sequences** | Multi-step follow-ups with per-step delay and template, automatic stop-on-reply |
| **Sending** | Queue-based via arq; Gmail and Outlook providers behind one interface |
| **Tracking** | Open pixel, click redirect, public unsubscribe endpoint, suppression list enforced at send time |
| **Analytics** | Dashboard rollups, per-campaign sent/open/click/reply/bounce rates, AI-generated insights |
| **Career tools** | Resume upload + chat (RAG), Career Fit assessment, Learning Roadmap (with real YouTube + documentation enrichment), Interview Prep questions + coaching, code sandbox |
| **Job Outreach** | Job intel synthesis, contact/lead discovery, AI-drafted outreach with a real LangGraph human-approval gate before anything sends |
| **Live Practice Room** | Scheduled group WebRTC interview practice — live signaling, shared idea board, peer feedback, AI-generated questions/recap/summary |
| **News feed** | Resume-personalized news via a real agentic-RAG pipeline (retrieval → rerank → grounded generation), with a News → Career Fit agent-to-agent subgraph call |
| **Plans & usage** | Tiered limits (contacts, campaigns, daily emails) enforced server-side, usage display |
| **Audit & notifications** | Audit trail of key actions; in-app notifications with unread count |

---

## Architecture

```
                    ┌──────────────┐
                    │  apps/web    │  React + Vite + TypeScript
                    └──────┬───────┘
                           │
                   Firebase ID token
                           │
                  ┌────────▼─────────┐
                  │  apps/backend    │  FastAPI + Python
                  │                  │
                  │  every route:    │
                  │  auth, contacts, │
                  │  templates,      │
                  │  campaigns,      │
                  │  tracking,       │
                  │  analytics,      │
                  │  career tools,   │
                  │  job outreach,   │
                  │  practice room,  │
                  │  AI agents,      │
                  │  MCP tool server │
                  └───┬──────────┬───┘
                      │          │
                arq enqueue      │ WebSocket
                      │          │ (mock-interview signaling)
                ┌─────▼──────┐   │
                │ arq worker │   │
                │ (same repo,│   │
                │  own proc) │   │
                └─────┬──────┘   │
                      │          │
             ┌────────▼──────────▼────┐
             │   MongoDB       Redis  │
             └─────────────────────────┘
```

**One backend.** Every route, every write, and every AI capability lives in
`apps/backend`. The background worker (`worker/`) is the same codebase run
as a second process (`arq worker.settings.WorkerSettings`) — not a separate
service, just a separate process so send throughput scales independently of
request traffic. Beanie (async Mongo ODM built on Pydantic) is the
persistence layer; a handful of read-only raw-Motor repository functions
remain for cross-service reads that don't need write access.

### Request → response layering

```
apps/backend: route → service → repository → MongoDB
              route → agent → provider (with fallback)   [AI capabilities]
```

Business logic lives in services, never in routes. Database access lives in
repositories/models, never in routes.

---

## Tech stack

**Frontend** — React, TypeScript, Vite, React Router, Tailwind CSS,
TanStack Query, Recharts, Firebase SDK, Axios

**Backend** — Python 3.12, FastAPI, Pydantic v2, Beanie (Motor + Pydantic
ODM), LangGraph, httpx, arq, firebase-admin, MCP SDK, pypdf

**Infrastructure** — MongoDB, Redis, pnpm workspaces + Turborepo, Docker Compose

---

## Directory structure

```
believe-ai/
├── apps/
│   ├── web/                  React SPA
│   │   └── src/
│   │       ├── app/          router, providers, layouts
│   │       ├── components/   ui primitives, layout
│   │       ├── features/     one folder per feature (api + pages + components)
│   │       ├── hooks/  lib/  utils
│   │       └── main.tsx
│   │
│   └── backend/              Python FastAPI backend + arq worker
│       ├── api/routes/       HTTP handlers
│       ├── agents/           one module per AI capability, plus LangGraph
│       │                     pipelines (news_search/, outreach_approval/)
│       ├── services/         business logic / orchestration
│       ├── repositories/     MongoDB access (Beanie-backed + a few read-only)
│       ├── models/           Beanie Document models
│       ├── schemas/          Pydantic request/response DTOs
│       ├── providers/        Gemini / Groq / OpenAI-compatible / Ollama + fallback
│       ├── prompts/  rag/  core/  utils/
│       ├── clients/          external API clients (YouTube, JSearch, ...)
│       ├── email_providers/  Gmail / Outlook send implementations
│       ├── worker/           arq background jobs + settings
│       ├── ws/                WebSocket routes (practice-room signaling)
│       ├── mcp_server/       MCP tool server + tools
│       └── main.py
│
├── packages/
│   ├── shared/                TypeScript types + plan config + constants
│   │                          (shared between the web app's own code)
│   └── eslint-config/
│
├── docker-compose.yml        MongoDB + Redis for local dev
└── turbo.json  pnpm-workspace.yaml
```

`packages/shared` is imported by the web app for its API response/request
types. It has no runtime validation logic — Pydantic validates on the
backend; `packages/shared` exists purely to keep the frontend's TypeScript
types honest without hand-duplicating them.

---

## Local development

### Prerequisites

Node 20+, pnpm 9+, Python 3.12+, Docker (for MongoDB + Redis).

### 1. Infrastructure

```bash
docker compose up -d
```

Starts MongoDB on `27017` and Redis on `6379`.

### 2. Environment

Each app reads its own `.env` (dotenv loads from the app's working
directory, so a single root `.env` is not enough):

```bash
cp apps/web/.env.example      apps/web/.env
cp apps/backend/.env.example  apps/backend/.env
```

Then fill in the values described under [Environment variables](#environment-variables).

### 3. Web app

```bash
pnpm install
pnpm dev          # runs web (5173) via Turborepo
```

### 4. Backend

```bash
cd apps/backend
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Run the background worker in a second terminal (needs Redis):

```bash
cd apps/backend
arq worker.settings.WorkerSettings
```

| Service | URL |
| --- | --- |
| Web | http://localhost:5173 |
| Backend | http://localhost:8000 (interactive docs at `/docs`) |

---

## Environment variables

Secrets are never committed — `.gitignore` excludes `.env` while tracking
`.env.example`. Every service validates its environment at startup (Pydantic
Settings on the backend) and exits immediately on a misconfiguration rather
than failing later at runtime.

### `apps/backend`

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI`, `REDIS_URL` | Datastores |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Service account for token verification (and creating a `User` on first sign-in) |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM encryption of OAuth refresh tokens |
| `AI_PROVIDER_ORDER` | Comma-separated fallback order, e.g. `gemini,groq` |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENAI_API_KEY` / `OLLAMA_BASE_URL` | Provider credentials — only configured providers are built |
| `GMAIL_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | Gmail OAuth app |
| `OUTLOOK_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | Microsoft Entra app |
| `RAPIDAPI_JSEARCH_KEY` / `RAPIDAPI_LINKEDIN_KEY` | Job Board / Lead Discovery — unset degrades gracefully |
| `RAPIDAPI_KEY` | Code sandbox (Judge0) |
| `YOUTUBE_API_KEY` | Roadmap video enrichment — unset skips video search |
| `TURN_URLS` / `_USERNAME` / `_CREDENTIAL` | Practice Room WebRTC TURN relay — optional |
| `CORS_ORIGIN`, `APP_BASE_URL` | URLs |

### `apps/web`

Only `VITE_`-prefixed variables reach the browser: `VITE_API_BASE_URL`
(the backend's base URL) and the `VITE_FIREBASE_*` public web config.

---

## Queues

An arq worker process (`worker/settings.py`, backed by Redis) runs:

- `send_campaign_email` — one job per sendable recipient, spaced across the
  campaign's `dailyLimit` with jitter; re-checks suppression/status/replies
  at send time; 5 retries with exponential backoff
- `send_outreach_follow_up` — day-3/7/14 follow-up sends; 3 retries
- `send_meeting_email` — Practice Room invite/reminder emails (with a
  generated `.ics` calendar attachment on the invite)
- `generate_room_summary` — post-call AI summary + per-participant notification, triggered when a host ends a room

Failures beyond their retry budget are logged and, where applicable, marked
`FAILED` rather than silently dropped.

---

## AI

All AI runs through `apps/backend`'s provider-fallback registry — Gemini,
Groq, OpenAI-compatible, and Ollama implement one interface and are selected
by `AI_PROVIDER_ORDER`, falling through to the next on failure. No provider
name is hardcoded in business logic.

Several capabilities are real LangGraph pipelines, not single prompt calls:
News' resume-personalized feed is a multi-step agentic-RAG graph (retrieval
→ rerank → grounded generation) that calls Career Fit's skill-extraction as
a subroutine rather than duplicating that prompt; Job Outreach's
human-approval gate is a genuine `interrupt()`-based pause/resume, backed by
a persistent checkpointer so it survives a process restart between draft
generation and a human's decision.

AI output is treated as untrusted input: responses are parsed, validated
against a Pydantic schema, and sanitized before use. Prompts explicitly mark
contact/resume/sender data as untrusted so instructions can't be smuggled in
through imported data, and instruct the model never to invent facts about a
person or company.

The same capabilities are exposed as **MCP tools** (`python -m mcp_server.server`)
for MCP-compatible clients.

---

## Email integrations

`EmailProvider` is a single interface with Gmail (OAuth2) and Outlook
(Microsoft Graph) implementations. The provider is picked per sending user
from whichever integration they connected — adding Outlook required no
changes to campaign or queue logic.

OAuth refresh tokens are encrypted with AES-256-GCM before storage; no
passwords are ever stored.

---

## Testing

This project verifies behavior through the **CLI against running services**
rather than committed test files — `curl` against real endpoints, `mongosh`
against real data, and the full static-analysis suite:

```bash
pnpm lint          # ESLint across all packages
pnpm typecheck     # tsc --noEmit across all packages
pnpm build         # full build

cd apps/backend
.venv/Scripts/python -m ruff check .
.venv/Scripts/python -m mypy .
```

---

## Security

- Firebase ID token verification on every authenticated request; client-supplied user IDs are never trusted
- Every resource query is scoped by the authenticated `userId`
- CORS allow-list
- Pydantic validation on all request bodies, params, and query strings
- HTML sanitization of template bodies and AI output
- OAuth refresh tokens encrypted at rest (AES-256-GCM)
- Audit log of key actions; logs redact tokens, passwords, and API keys
- Unsubscribe/suppression enforced at send time, not just at launch

---

## Deployment

| Component | Target |
| --- | --- |
| Web | Vercel or any static host |
| Backend (API) | Render / Railway / Fly.io |
| Backend (worker) | The same codebase as a separate process — `arq worker.settings.WorkerSettings` — scale independently of the API |
| MongoDB | MongoDB Atlas |
| Redis | Upstash or managed Redis |

Run the worker as its own process, not inside the API — that's what makes
send throughput scalable independently of request traffic.

---

## Status

Full backend migration from Node/Express to Python/FastAPI + LangGraph is
complete: every route, every write, and every AI capability now lives in
`apps/backend`, verified against the previous Node implementation
feature-by-feature before each piece was cut over.

Deliberately not built yet — each needs a product decision or an external
account rather than just code: organizations/multi-tenancy, real billing
(Stripe), public API + webhooks, and automatic inbound reply detection
(replies are currently marked manually, since detection requires Gmail push
notifications and Pub/Sub domain verification).

---

## License

MIT — see [LICENSE](./LICENSE).
