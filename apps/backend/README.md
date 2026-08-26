## believe.ai — Backend (Python)

The sole backend: a FastAPI app exposing every route the product needs
(auth, CRUD, campaigns/sending, tracking, realtime signaling, AI) plus an
in-process arq worker for background jobs (email sending, follow-ups,
meeting invites, room summaries). Everything that used to be split across a
Node API and a Node worker now lives here, alongside every AI capability.

## Auth

Every route takes a Firebase ID token (`Authorization: Bearer <token>`).
`core/security.py` verifies it and resolves it to the Mongo `User._id` every
document is scoped by — creating the user on first sign-in if one doesn't
exist yet (the one place a `User` document gets created).

## Layout

```
api/routes/         FastAPI route handlers (HTTP layer only)
agents/              One module per AI capability, plus LangGraph pipelines
                     (agents/news_search/, agents/outreach_approval/)
services/            Business logic — DB orchestration, state machines
repositories/        MongoDB access — Beanie-backed (write-capable) for most
                     collections, a few read-only raw-Motor modules remain
                     for cross-service reads
models/              Beanie Document models — one per collection
schemas/             Pydantic request/response DTOs
core/                Settings, Firebase auth, DB connections, logging, errors
providers/           AI provider abstraction (Gemini/Groq/OpenAI-compatible/
                     Ollama) with fallback
prompts/             One module per product domain, versioned + logged per call
rag/                 Shared agentic-RAG module (query analysis, retrieval,
                     rerank, grounding) used by every retrieval-touching agent
clients/             External API clients (YouTube, JSearch, LinkedIn leads, ...)
email_providers/     Gmail / Outlook send implementations behind one interface
worker/              arq background jobs + settings — run as its own process
ws/                  WebSocket routes (mock-interview WebRTC signaling)
mcp_server/          MCP server + tool registry, wrapping the same services
utils/               Parsing/validation/sanitization helpers
```

(Named `mcp_server/`, not `mcp/` — a local `mcp/` package would shadow the
installed `mcp` PyPI package on the import path.)

## Running locally

```bash
cd apps/backend
python -m venv .venv
.venv/Scripts/activate   # or: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill in FIREBASE_*, MONGODB_URI, and an AI provider key
uvicorn main:app --reload --port 8000
```

Run the background worker in a separate process (needs Redis):

```bash
arq worker.settings.WorkerSettings
```

## Running the MCP server

```bash
python -m mcp_server.server
```

MCP tools that touch stored data take a `firebase_id_token` argument
directly, since MCP tool calls don't carry HTTP headers.
