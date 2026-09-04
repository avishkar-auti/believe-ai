"""Best-effort split of a free-text "City, State, Country" location string
into parts — no job stores structured geo fields, internal postings are
typed by hand, and external (JSearch) listings are joined from
city/state/country by clients/jsearch_client.py in that exact order, so a
comma split is the only signal available."""

from __future__ import annotations

from dataclasses import dataclass

# Country values are inconsistent across sources — JSearch returns ISO
# alpha-2 codes ("IN"), manually posted/internal jobs tend to use the full
# name ("India") — so both must be recognized as the same country, both when
# matching internal listings and when picking JSearch's own `country` query
# param. Mirrors the frontend's INDIA_ALIASES (JobFilters.tsx).
_COUNTRY_ALIASES: dict[str, str] = {
    "india": "in",
    "united states": "us",
    "united states of america": "us",
    "usa": "us",
    "united kingdom": "gb",
    "uk": "gb",
    "canada": "ca",
    "australia": "au",
    "germany": "de",
    "singapore": "sg",
    "united arab emirates": "ae",
    "uae": "ae",
}


def normalize_country(country: str | None) -> str | None:
    """Folds a free-text or ISO-code country value down to a lowercase ISO
    alpha-2 code, so "India" and "IN" compare equal."""
    if not country:
        return None
    normalized = country.strip().lower()
    if len(normalized) == 2:
        return normalized
    return _COUNTRY_ALIASES.get(normalized, normalized)


@dataclass(frozen=True)
class ParsedLocation:
    raw: str
    city: str | None
    state: str | None
    country: str | None


def parse_location(raw: str | None) -> ParsedLocation:
    parts = [p.strip() for p in (raw or "").split(",") if p.strip()]
    if len(parts) >= 3:
        city, state, country = parts[0], parts[1], parts[-1]
    elif len(parts) == 2:
        city, state, country = parts[0], None, parts[1]
    elif len(parts) == 1:
        city, state, country = None, None, parts[0]
    else:
        city, state, country = None, None, None
    return ParsedLocation(raw=raw or "", city=city, state=state, country=country)


def matches(parsed: ParsedLocation, country: str | None, state: str | None, city: str | None) -> bool:
    if country and normalize_country(parsed.country) != normalize_country(country):
        return False
    if state and (parsed.state or "").strip().lower() != state.strip().lower():
        return False
    if city and (parsed.city or "").strip().lower() != city.strip().lower():
        return False
    return True
