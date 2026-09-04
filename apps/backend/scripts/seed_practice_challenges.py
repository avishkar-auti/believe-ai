"""One-off dev script — seeds/updates AI Practice Lab's challenge library
from scripts/seed_data/practice_challenges/*.json. Upserts by slug, so it's
safe to re-run after editing a challenge's JSON.

Run from apps/backend:
    python -m scripts.seed_practice_challenges
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from core.db import init_odm
from core.logging import configure_logging, get_logger
from models.practice_challenge import Challenge

configure_logging()
logger = get_logger(__name__)

SEED_DIR = Path(__file__).resolve().parent / "seed_data" / "practice_challenges"


async def seed() -> None:
    await init_odm()

    files = sorted(SEED_DIR.glob("*.json"))
    if not files:
        logger.warning("No seed files found in %s", SEED_DIR)
        return

    created = 0
    updated = 0
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        existing = await Challenge.find_one(Challenge.slug == data["slug"])
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            await existing.save()
            updated += 1
        else:
            await Challenge(**data).insert()
            created += 1

    logger.info("Seeded practice challenges from %s: %d created, %d updated", SEED_DIR, created, updated)


if __name__ == "__main__":
    asyncio.run(seed())
