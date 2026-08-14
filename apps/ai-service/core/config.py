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

    # Shared secret for trusted backend-to-backend calls (apps/worker has no
    # live user session to send a Firebase token with). Not required for
    # DB-backed routes, which always need a real user token.
    internal_service_key: str | None = Field(default=None, alias="INTERNAL_SERVICE_KEY")

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

    @property
    def provider_order(self) -> list[str]:
        return [p.strip() for p in self.ai_provider_order.split(",") if p.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
