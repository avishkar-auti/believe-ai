"""Builds the configured providers and runs any capability across them with
fallback — mirrors packages/server/src/ai/AiService.ts's createAiService.
Which providers exist and their fallback order is entirely driven by
Settings, never hardcoded here.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import TypeVar

from core.config import Settings
from core.logging import get_logger
from providers.base import AiProvider
from providers.errors import AiProviderError
from providers.gemini import GeminiProvider
from providers.ollama import OllamaProvider
from providers.openai_compatible import OpenAiCompatibleProvider

logger = get_logger(__name__)
T = TypeVar("T")


def build_available_providers(settings: Settings) -> dict[str, AiProvider]:
    providers: dict[str, AiProvider] = {}

    if settings.gemini_api_key:
        providers["gemini"] = GeminiProvider(
            settings.gemini_api_key,
            settings.gemini_model,
            settings.gemini_embedding_model,
            settings.ai_request_timeout_seconds,
        )
    if settings.groq_api_key:
        # Groq has no embeddings endpoint — embed_texts() will 404 and
        # with_fallback simply moves on to the next configured provider.
        providers["groq"] = OpenAiCompatibleProvider(
            "groq",
            "https://api.groq.com/openai/v1",
            settings.groq_api_key,
            settings.groq_model,
            settings.groq_model,
            settings.ai_request_timeout_seconds,
        )
    if settings.openai_api_key:
        providers["openai"] = OpenAiCompatibleProvider(
            "openai",
            "https://api.openai.com/v1",
            settings.openai_api_key,
            settings.openai_model,
            settings.openai_embedding_model,
            settings.ai_request_timeout_seconds,
        )
    if settings.ollama_base_url and settings.ollama_model:
        providers["ollama"] = OllamaProvider(
            settings.ollama_base_url,
            settings.ollama_model,
            settings.ollama_embedding_model,
            settings.ai_request_timeout_seconds,
        )

    return providers


def ordered_providers(settings: Settings) -> list[AiProvider]:
    available = build_available_providers(settings)
    ordered = [available[p] for p in settings.provider_order if p in available]
    return ordered or list(available.values())


async def with_fallback(settings: Settings, operation: str, run: Callable[[AiProvider], Awaitable[T]]) -> T:
    providers = ordered_providers(settings)
    if not providers:
        raise AiProviderError(
            "No AI provider is configured. Set GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, or OLLAMA_BASE_URL."
        )

    last_error: Exception | None = None
    for provider in providers:
        try:
            return await run(provider)
        except Exception as err:  # noqa: BLE001 — deliberately broad: try the next provider
            last_error = err
            logger.warning("AI provider %s failed for %s, trying next: %s", provider.id, operation, err)

    raise AiProviderError(f"All AI providers failed for {operation}: {last_error}")
