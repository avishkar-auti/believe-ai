"""Best-effort split of a free-text "City, State, Country" location string
into parts — no job stores structured geo fields, internal postings are
typed by hand, and external (JSearch) listings are joined from
city/state/country by clients/jsearch_client.py in that exact order, so a
comma split is the only signal available."""

from __future__ import annotations

from dataclasses import dataclass


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
    if country and parsed.country != country:
        return False
    if state and parsed.state != state:
        return False
    if city and parsed.city != city:
        return False
    return True
