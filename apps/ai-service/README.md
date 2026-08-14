# believe.ai — AI Service (Python)

A standalone FastAPI service exposing believe.ai's AI capabilities — email
generation, personalization, improvement, and campaign insights — as both a
REST API and MCP (Model Context Protocol) tools.

This runs **alongside** the Node.js/TypeScript API (`apps/api`), not in
place of it. `apps/api` and `apps/worker` keep their own TypeScript AI
implementation (`packages/server/src/ai`) for the product's normal request
path; this service is a separate, independently deployable surface for the
same AI capabilities — useful for MCP-based tool integrations or any client
that wants to call believe.ai's AI features directly in Python.

It reads (never writes) the same MongoDB database as the Node app, so it can
operate on a caller's real stored campaigns, contacts, templates, and
Believe Profile — not just data passed in the request body.

## Auth

Every route takes the same Firebase ID token the web app already uses
(`Authorization: Bearer <token>`), verified against the same Firebase
project as `apps/api`. Routes that touch stored data resolve that token to
the Mongo `User._id` every Contact/Campaign/Template document is scoped by,
then filter every query on it — the same ownership boundary the Node API
enforces.

## Layout

```
api/routes/     FastAPI route handlers (HTTP layer only)
agents/         One module per AI capability — builds a prompt, calls a provider, validates output
services/       DB-backed orchestration: fetch real data, then call an agent
repositories/   Read-only MongoDB queries, one module per collection
core/           Settings, Firebase auth + Mongo-user resolution, DB connection, logging
providers/      AI provider abstraction (Gemini, Groq/OpenAI-compatible, Ollama) with fallback
schemas/        Pydantic request/response models (mirror packages/shared's TS types)
prompts/        Shared prompt-building functions used by agents
mcp_server/     MCP server + tool registry, wrapping the same agents/services — no separate logic
utils/          JSON parsing/validation, sanitization, ObjectId parsing helpers
```

(Named `mcp_server/`, not `mcp/` — a local `mcp/` package would shadow the
installed `mcp` PyPI package on the import path and break `from mcp.server...`
imports inside itself.)

## Endpoints

Request-body-driven (no DB access needed):
- `POST /ai/email` — generate an email from a goal/target/tone brief
- `POST /ai/improve` — rewrite an email per an improvement action
- `POST /ai/personalize` — personalize a template for a given contact payload
- `POST /ai/campaign-insights` — analyze given aggregate campaign numbers

Real-data (resolves the caller's own stored records):
- `GET /campaigns/{id}/insights` — insights computed from the campaign's actual EmailLog stats
- `POST /campaigns/{id}/contacts/{contactId}/personalize` — personalizes using the real stored contact, template, and Believe Profile

## Running locally

```bash
cd apps/ai-service
python -m venv .venv
.venv/Scripts/activate   # or: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill in FIREBASE_*, MONGODB_URI, and an AI provider key
uvicorn main:app --reload --port 8000
```

## Running the MCP server

```bash
python -m mcp_server.server
```

MCP tools that touch stored data (`get_campaign_insights_tool`,
`personalize_for_contact_tool`) take a `firebase_id_token` argument directly,
since MCP tool calls don't carry HTTP headers.
