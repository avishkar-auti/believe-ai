"""AI output is untrusted input: strip markdown fences if present and
validate against the expected schema before it's ever used.
"""

from __future__ import annotations

import json
import re
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from providers.errors import AiProviderError

T = TypeVar("T", bound=BaseModel)

_FENCE_START = re.compile(r"^```(?:json)?\s*", re.IGNORECASE)
_FENCE_END = re.compile(r"```\s*$")


def parse_and_validate_json(provider_id: str, raw: str, schema: type[T]) -> T:
    cleaned = _FENCE_END.sub("", _FENCE_START.sub("", raw.strip()))

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as err:
        raise AiProviderError(f"{provider_id} returned non-JSON output") from err

    try:
        return schema.model_validate(parsed)
    except ValidationError as err:
        raise AiProviderError(f"{provider_id} returned output that failed schema validation") from err
