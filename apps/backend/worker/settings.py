"""arq worker process — replaces apps/worker's (Node/BullMQ) background job
processing, one queue at a time as each gets ported (Phase 4+). health_check
proved the pipeline end to end before send_campaign_email became the first
real queue to move over.

Run with: arq worker.settings.WorkerSettings
"""

from __future__ import annotations

from typing import Any

from arq import func

from core.db import init_odm
from core.logging import configure_logging, get_logger
from worker.client import get_redis_settings
from worker.jobs.generate_room_summary import generate_room_summary
from worker.jobs.health_check import health_check
from worker.jobs.send_campaign_email import send_campaign_email
from worker.jobs.send_meeting_email import send_meeting_email
from worker.jobs.send_outreach_follow_up import send_outreach_follow_up

configure_logging()
logger = get_logger(__name__)


async def on_startup(ctx: dict[str, Any]) -> None:
    logger.info("arq worker starting up")
    await init_odm()


async def on_shutdown(ctx: dict[str, Any]) -> None:
    logger.info("arq worker shutting down")


class WorkerSettings:
    # attempts: 5, matching Node's BullMQ email queue default — the
    # exponential backoff itself is implemented inside the job (arq's
    # built-in retry has no backoff without an explicit Retry(defer=...)).
    functions = [
        health_check,
        func(send_campaign_email, max_tries=5),
        func(send_outreach_follow_up, max_tries=3),
        # meeting.email/room.summary ran with BullMQ's default (no automatic
        # retry) in Node — max_tries=1 keeps that behavior, not a regression.
        func(send_meeting_email, max_tries=1),
        func(generate_room_summary, max_tries=1),
    ]
    redis_settings = get_redis_settings()
    on_startup = on_startup
    on_shutdown = on_shutdown
