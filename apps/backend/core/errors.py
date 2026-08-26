class NotFoundError(Exception):
    """A requested resource doesn't exist, or doesn't belong to the caller."""


class PlanLimitExceededError(Exception):
    """The action is valid but exceeds the account's plan allowance — mirrors
    Node's PlanLimitExceededError (402 Payment Required)."""


class InvalidStateTransitionError(Exception):
    """Mirrors Node's InvalidStateTransitionError (409 Conflict)."""


class ValidationError(Exception):
    """Mirrors Node's ValidationError (400 Bad Request) — for business-rule
    validation that isn't expressible as a Pydantic field constraint."""


class AuthorizationError(Exception):
    """The caller is authenticated but not allowed to do this — mirrors
    Node's AuthorizationError (403 Forbidden)."""


class IntegrationError(Exception):
    """A third-party integration outside this service's own AI providers is
    unconfigured or failed — mirrors Node's IntegrationError (502 Bad
    Gateway). Distinct from AiProviderError, which is specifically the
    Gemini/Groq/OpenAI/Ollama fallback chain."""
