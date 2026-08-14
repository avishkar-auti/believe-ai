# believe.ai

**Believe in your next opportunity.**

An AI-powered outreach and communication platform — import an audience, write
with AI, personalize per recipient, send responsibly, and understand what
actually gets responses.

---

## Features

| Area | What's implemented |
| --- | --- |
| **Auth** | Firebase Authentication (Google + email/password), backend ID-token verification, per-user data scoping |
| **Contacts** | CRUD, search/filter/sort, tags, CSV import with column mapping + validation (invalid/duplicate/unsubscribed detection), CSV export |
| **Templates** | CRUD, duplicate, `{{variable}}` interpolation, HTML sanitization |
| **AI** | Email writer, tone/style improvement, per-recipient personalization, campaign insights — all in the Python service, with provider fallback |
| **Believe Profile** | Optional user context (about, company, offer, skills, achievements, audience) fed automatically into every AI call |
| **Campaigns** | Explicit state machine, audience selection, scheduling, daily send limits with jitter, launch/pause/resume/cancel, auto-completion |
| **Sequences** | Multi-step follow-ups with per-step delay and template, automatic stop-on-reply |
| **Sending** | Queue-based via BullMQ with retries/backoff; Gmail and Outlook providers behind one interface; SMTP for local testing |
| **Tracking** | Open pixel, click redirect, public unsubscribe endpoint, suppression list enforced at send time |
| **Analytics** | Dashboard rollups, per-campaign sent/open/click/reply/bounce rates, AI-generated insights |
| **Plans & usage** | Tiered limits (contacts, campaigns, daily emails) enforced server-side, usage display |
| **Audit & notifications** | Audit trail of key actions; in-app notifications with unread count |

---

## Architecture

```
                    ┌──────────────┐
                    │  apps/web    │  React + Vite + TypeScript
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     Firebase ID token          Firebase ID token
              │                         │
      ┌───────▼────────┐       ┌────────▼─────────┐
      │   apps/api     │       │ apps/ai-service  │
      │ Express + TS   │       │ FastAPI + Python │
      │                │       │                  │
      │ contacts       │       │ email writer     │
      │ templates      │       │ improve          │
      │ campaigns      │       │ personalize      │
      │ integrations   │       │ campaign insights│
      │ tracking       │       │ MCP tool server  │
      │ analytics      │       │                  │
      │ usage / audit  │       │                  │
      └───┬────────┬───┘       └────────┬─────────┘
          │        │                    │
          │        │  BullMQ            │ read-only
          │        ▼                    │
          │  ┌──────────────┐           │
          │  │ apps/worker  │───────────┤ internal service key
          │  │ email sender │           │ (POST /ai/personalize)
          │  └──────┬───────┘           │
          │         │                   │
     ┌────▼─────────▼───────────────────▼────┐
     │   MongoDB              Redis          │
     └───────────────────────────────────────┘
```

**Why two backends.** The Node API owns all application data and writes;
the Python service owns *all* AI. There is exactly one AI implementation —
the web app and the worker both call the Python service rather than each
having their own. The Python service reads the same MongoDB **read-only**,
so it can compute insights from real campaign stats without being able to
drift from the Node app's validation rules.

### Request → response layering

```
apps/api:        route → controller → service → repository → MongoDB
apps/ai-service: route → agent → provider (with fallback)
                 route → service → repository → MongoDB (read-only)
```

Business logic lives in services, never in controllers or routes. Database
access lives in repositories, never in controllers.

---

## Tech stack

**Frontend** — React, TypeScript, Vite, React Router, Tailwind CSS,
TanStack Query, Recharts, Firebase SDK, Axios

**API / Worker** — Node.js, TypeScript, Express, Mongoose, BullMQ, ioredis,
Firebase Admin, Zod, Helmet, Pino, Nodemailer, googleapis

**AI service** — Python 3.12, FastAPI, Pydantic v2, httpx, Motor,
firebase-admin, MCP SDK

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
│   ├── api/                  Express REST API
│   │   └── src/
│   │       ├── config/       env, db, redis, firebase, logger
│   │       ├── controllers/  HTTP layer only
│   │       ├── middleware/   auth, error, sanitize
│   │       ├── repositories/ all MongoDB access
│   │       ├── routes/       route definitions
│   │       ├── services/     business logic
│   │       ├── queues/       BullMQ producers
│   │       ├── errors/ utils/ types/
│   │       ├── app.ts  server.ts
│   │
│   ├── worker/               BullMQ consumer (email sending)
│   │   └── src/
│   │       ├── config/  queues/  services/  workers/
│   │       └── index.ts
│   │
│   └── ai-service/           Python FastAPI AI service
│       ├── api/routes/       HTTP handlers
│       ├── agents/           one module per AI capability
│       ├── services/         DB-backed orchestration
│       ├── repositories/     read-only MongoDB queries
│       ├── providers/        Gemini / OpenAI-compatible / Ollama + fallback
│       ├── prompts/  schemas/  core/  utils/
│       ├── mcp_server/       MCP tool server + tools
│       └── main.py
│
├── packages/
│   ├── shared/               types, Zod schemas, plan config, constants
│   ├── server/               Mongoose models, email providers, crypto, db
│   └── eslint-config/
│
├── docker-compose.yml        MongoDB + Redis for local dev
└── turbo.json  pnpm-workspace.yaml
```

`packages/shared` is imported by **both** the web app and the Node services,
so API contracts are typed end to end without duplicated definitions.

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
cp apps/api/.env.example        apps/api/.env
cp apps/worker/.env.example     apps/worker/.env
cp apps/web/.env.example        apps/web/.env
cp apps/ai-service/.env.example apps/ai-service/.env
```

Then fill in the values described under [Environment variables](#environment-variables).

### 3. Node services

```bash
pnpm install
pnpm dev          # runs web (5173), api (4000), worker — via Turborepo
```

### 4. Python AI service

```bash
cd apps/ai-service
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

| Service | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:4000 |
| AI service | http://localhost:8000 (interactive docs at `/docs`) |

---

## Environment variables

Secrets are never committed — `.gitignore` excludes `.env` while tracking
`.env.example`. Every service validates its environment at startup (Zod on
the Node side, Pydantic Settings on the Python side) and exits immediately
on a misconfiguration rather than failing later at runtime.

### `apps/api`

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI`, `REDIS_URL` | Datastores |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Service account for token verification |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM encryption of OAuth refresh tokens |
| `GMAIL_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | Gmail OAuth app |
| `OUTLOOK_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | Microsoft Entra app |
| `CORS_ORIGIN`, `APP_BASE_URL`, `API_BASE_URL` | URLs |

### `apps/worker`

Same datastore / OAuth / encryption values, plus:

| Variable | Purpose |
| --- | --- |
| `AI_SERVICE_URL` | Where the Python service lives |
| `INTERNAL_SERVICE_KEY` | Shared secret for backend-to-backend AI calls — **must match** the AI service |
| `EMAIL_PROVIDER` | Optional override; leave unset to pick per-user by connected integration, or set `smtp` for local testing |
| `SMTP_*` | Only when `EMAIL_PROVIDER=smtp` |

### `apps/ai-service`

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Same database, read-only |
| `FIREBASE_*` | Same project — verifies the same user tokens |
| `INTERNAL_SERVICE_KEY` | Must match the worker's |
| `AI_PROVIDER_ORDER` | Comma-separated fallback order, e.g. `gemini,groq` |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENAI_API_KEY` / `OLLAMA_BASE_URL` | Provider credentials — only configured providers are built |

### `apps/web`

Only `VITE_`-prefixed variables reach the browser: `VITE_API_BASE_URL`,
`VITE_AI_SERVICE_URL`, and the `VITE_FIREBASE_*` public web config.

---

## Queues

`email.send` (BullMQ, Redis) carries `{ emailLogId, campaignId, contactId, userId, stepIndex }`.

Jobs are created at launch — one per sendable recipient — spaced across the
campaign's `dailyLimit` with random jitter so sends never burst. The worker
re-checks suppression, campaign status, and prior replies at send time,
because state can change between enqueue and delivery. Failures retry with
exponential backoff (5 attempts); only after retries are exhausted is the
recipient marked `FAILED`. Follow-up steps are enqueued after a successful
send, and the campaign auto-transitions to `COMPLETED` when no recipients
remain queued.

---

## AI

All AI runs in `apps/ai-service`. Providers implement one interface and are
selected by `AI_PROVIDER_ORDER`, falling through to the next on failure — no
provider name is hardcoded in business logic.

AI output is treated as untrusted input: responses are parsed, validated
against a Pydantic schema, and sanitized before use. Prompts explicitly mark
contact and sender data as untrusted so instructions can't be smuggled in
through imported CSV fields, and instruct the model never to invent facts
about a recipient.

If personalization fails at send time, the worker falls back to plain
`{{variable}}` interpolation — an AI hiccup never blocks a send.

The same capabilities are exposed as **MCP tools** (`python -m mcp_server.server`)
for MCP-compatible clients.

---

## Email integrations

`EmailProvider` is a single interface with Gmail (OAuth2), Outlook
(Microsoft Graph), and SMTP implementations. The worker picks the provider
from whichever integration the sending user connected — adding Outlook
required no changes to campaign or queue logic.

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

cd apps/ai-service
.venv/Scripts/python -m ruff check .
.venv/Scripts/python -m mypy .
```

---

## Security

- Firebase ID token verification on every authenticated request; client-supplied user IDs are never trusted
- Every resource query is scoped by the authenticated `userId`
- Helmet, CORS allow-list, global + per-route rate limiting
- Zod validation on all request bodies, params, and query strings
- Mongo operator sanitization on all user input
- HTML sanitization of template bodies and AI output
- OAuth refresh tokens encrypted at rest (AES-256-GCM)
- Audit log of key actions; logs redact tokens, passwords, and API keys
- Unsubscribe/suppression enforced at send time, not just at launch

---

## Deployment

| Component | Target |
| --- | --- |
| Web | Vercel or any static host |
| API | Render / Railway / Fly.io |
| Worker | A separate worker process — scale independently of the API |
| AI service | Any Python host (Render / Fly.io / Cloud Run) |
| MongoDB | MongoDB Atlas |
| Redis | Upstash or managed Redis |

Run the worker as its own process, not inside the API — that's what makes
send throughput scalable independently of request traffic.

---

## Status

Phases 1–6 are implemented and verified end to end: foundation, core
outreach, automation/sequences, AI intelligence, Outlook + plan limits, and
production hardening (audit logs, notifications, campaign completion).

Deliberately not built yet — each needs a product decision or an external
account rather than just code: organizations/multi-tenancy, real billing
(Stripe), public API + webhooks, and automatic inbound reply detection
(replies are currently marked manually, since detection requires Gmail
push notifications and Pub/Sub domain verification).

---

## License

MIT — see [LICENSE](./LICENSE).
