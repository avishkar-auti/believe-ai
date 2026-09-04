"""LinkedIn relationship-status abstraction, kept deliberately separate from
contact discovery — SerpAPI (or any web-search-based provider) can never be
used to determine whether the user is connected to someone, only whether a
profile exists publicly.

Today's implementation always returns "unknown": LinkedIn's self-serve OAuth
tier (the only one available without applying for and being approved for
LinkedIn's restricted Talent/Marketing Partner Program) grants access to the
signed-in user's own basic profile only — it does not expose their
connections list or a way to check relationship status with an arbitrary
profile URL. Returning "connected" without that real, authorized signal
would be fabricating a fact this service has no way to know. If/when a real
LinkedIn integration with that level of access exists, this is the one seam
that needs to change — nothing else in Job Outreach depends on how the
status is determined, only on the three possible values.
"""

from __future__ import annotations

from typing import Literal

RelationshipStatus = Literal["connected", "not_connected", "unknown"]


async def get_relationship_status(profile_url: str) -> RelationshipStatus:
    return "unknown"
