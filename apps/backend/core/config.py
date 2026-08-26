"""Environment configuration, validated at startup (mirrors apps/api/src/config/env.ts)."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = Field(default=8000, alias="PORT")
    cors_origin: str = Field(default="http://localhost:5173", alias="CORS_ORIGIN")

    firebase_project_id: str = Field(alias="FIREBASE_PROJECT_ID")
    firebase_client_email: str = Field(alias="FIREBASE_CLIENT_EMAIL")
    firebase_private_key: str = Field(alias="FIREBASE_PRIVATE_KEY")

    # Same database the Node API/worker use — this service only ever reads from it.
    mongodb_uri: str = Field(default="mongodb://localhost:27017/believe-ai", alias="MONGODB_URI")

    # Same Redis the Node worker's BullMQ queues use today. Backs the arq
    # worker (worker/) — Phase 1 stands this up with one trivial job; real
    # queues move over in Phase 4 as each one is ported.
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")

    # 32-byte hex key for AES-256-GCM encryption of OAuth refresh tokens at
    # rest (core/crypto.py). Changing this value orphans any already-stored
    # refresh tokens — they'd fail to decrypt and need reconnecting.
    encryption_key: str | None = Field(default=None, alias="ENCRYPTION_KEY")

    ai_provider_order: str = Field(default="gemini", alias="AI_PROVIDER_ORDER")
    ai_request_timeout_seconds: float = Field(default=20.0, alias="AI_REQUEST_TIMEOUT_SECONDS")

    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-flash-latest", alias="GEMINI_MODEL")
    gemini_embedding_model: str = Field(default="gemini-embedding-001", alias="GEMINI_EMBEDDING_MODEL")

    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    openai_embedding_model: str = Field(default="text-embedding-3-small", alias="OPENAI_EMBEDDING_MODEL")

    ollama_base_url: str | None = Field(default=None, alias="OLLAMA_BASE_URL")
    ollama_model: str | None = Field(default=None, alias="OLLAMA_MODEL")
    ollama_embedding_model: str | None = Field(default=None, alias="OLLAMA_EMBEDDING_MODEL")

    # News feed's article source (clients/news_source_client.py). "mock"
    # (default, no key needed) returns a curated dev/tech article pool — the
    # real embedding-based retrieval/rerank still runs end to end against it.
    news_provider: str = Field(default="mock", alias="NEWS_PROVIDER")
    news_api_key: str | None = Field(default=None, alias="NEWS_API_KEY")

    # Opt-in LangGraph/LangSmith tracing (core/tracing.py) — unset by
    # default, no traces sent anywhere until this is configured.
    langsmith_api_key: str | None = Field(default=None, alias="LANGSMITH_API_KEY")
    langsmith_project: str = Field(default="believe-ai", alias="LANGSMITH_PROJECT")

    # Where OAuth consent redirects land the browser after connect/disconnect.
    app_base_url: str = Field(default="http://localhost:5173", alias="APP_BASE_URL")

    gmail_client_id: str | None = Field(default=None, alias="GMAIL_CLIENT_ID")
    gmail_client_secret: str | None = Field(default=None, alias="GMAIL_CLIENT_SECRET")
    gmail_redirect_uri: str | None = Field(default=None, alias="GMAIL_REDIRECT_URI")

    outlook_client_id: str | None = Field(default=None, alias="OUTLOOK_CLIENT_ID")
    outlook_client_secret: str | None = Field(default=None, alias="OUTLOOK_CLIENT_SECRET")
    outlook_redirect_uri: str | None = Field(default=None, alias="OUTLOOK_REDIRECT_URI")

    # Job Board's external search (clients/jsearch_client.py). Unset skips
    # external results entirely — internal listings still work fine.
    rapidapi_jsearch_key: str | None = Field(default=None, alias="RAPIDAPI_JSEARCH_KEY")

    # Roadmap's video enrichment (clients/youtube_client.py). Unset skips
    # video search entirely — the rest of a roadmap (stages, documentation)
    # is still perfectly usable without it.
    youtube_api_key: str | None = Field(default=None, alias="YOUTUBE_API_KEY")

    # Code sandbox's Judge0/RapidAPI key (services/code_sandbox_service.py).
    # Unset raises IntegrationError on use — unlike the two RAPIDAPI_* keys
    # above, there's no degraded fallback for "run this code".
    rapidapi_key: str | None = Field(default=None, alias="RAPIDAPI_KEY")

    # TURN relay for the Live Practice Room — optional. Without it, WebRTC
    # falls back to the public STUN server, which fails on networks that
    # block direct peer-to-peer connections.
    turn_urls: str | None = Field(default=None, alias="TURN_URLS")
    turn_username: str | None = Field(default=None, alias="TURN_USERNAME")
    turn_credential: str | None = Field(default=None, alias="TURN_CREDENTIAL")

    @property
    def provider_order(self) -> list[str]:
        return [p.strip() for p in self.ai_provider_order.split(",") if p.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
