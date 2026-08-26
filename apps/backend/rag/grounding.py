"""Lightweight grounding check for generated text — flags a claim as
possibly ungrounded when it shares too little vocabulary with the source it
was supposedly generated from. Deterministic and free (no second LLM call
per check), so it's cheap enough to run on every generation rather than
reserved for spot-checks. This is a real signal, not a rubber stamp: a
specific agent can upgrade to an LLM-based self-check later where the
stakes justify the extra call — this heuristic is the sensible default
everywhere else.
"""

from __future__ import annotations

import re

_WORD_RE = re.compile(r"[a-z0-9]+")
_STOPWORDS = frozenset(
    "a an the is are was were be been being this that these those it its of "
    "in on at to for with and or but not no as by from into onto over under".split()
)


def _significant_words(text: str) -> set[str]:
    return {w for w in _WORD_RE.findall(text.lower()) if w not in _STOPWORDS and len(w) > 2}


def grounding_overlap(generated_text: str, source_text: str) -> float:
    """Fraction of the generated text's significant words that also appear
    in the source. 1.0 means every notable word traces back to the source
    vocabulary; low values suggest the model may have drifted or invented
    specifics not actually present in what it was given."""
    generated_words = _significant_words(generated_text)
    if not generated_words:
        return 1.0
    source_words = _significant_words(source_text)
    return len(generated_words & source_words) / len(generated_words)


def is_grounded(generated_text: str, source_text: str, *, threshold: float = 0.3) -> bool:
    return grounding_overlap(generated_text, source_text) >= threshold
