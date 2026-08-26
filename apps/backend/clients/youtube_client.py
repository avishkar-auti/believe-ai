"""Roadmap's video enrichment — mirrors apps/api's youtube.client.ts,
including its YoutubeCache-backed dedup so repeated roadmap generations for
the same topic don't burn YouTube Data API quota."""

from __future__ import annotations

import math
import re
from datetime import UTC, datetime

import httpx

from core.config import Settings
from core.logging import get_logger
from models.roadmap import RoadmapResource
from models.youtube_cache import CachedVideo, YoutubeCache

logger = get_logger(__name__)

_ISO_DURATION_RE = re.compile(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$")


def _normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", query.strip().lower())


def _parse_iso_duration(iso: str) -> int | None:
    """Parses an ISO 8601 duration like "PT1H2M3S" into seconds. Returns None for anything unparseable."""
    match = _ISO_DURATION_RE.match(iso)
    if not match:
        return None
    hours, minutes, seconds = (int(g) if g else 0 for g in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def _score_video(snippet: dict, details: dict | None, query: str) -> float:
    stats = (details or {}).get("statistics", {})
    view_count = float(stats.get("viewCount") or 0)
    view_score = math.log10(view_count + 1)  # diminishing returns past a few hundred thousand views

    published_at = datetime.fromisoformat(snippet["publishedAt"].replace("Z", "+00:00"))
    age_years = (datetime.now(UTC) - published_at).total_seconds() / (60 * 60 * 24 * 365)
    recency_score = max(0.0, 3 - age_years) * 0.5  # mild boost for content under ~3 years old

    query_words = [w for w in query.lower().split() if w]
    title = snippet["title"].lower()
    title_match_score = sum(1 for w in query_words if w in title)

    duration_seconds = _parse_iso_duration((details or {}).get("contentDetails", {}).get("duration", ""))
    # Extremely short (Shorts) or extremely long (multi-hour streams) videos rank slightly lower
    # for "learning resource" purposes than a focused 10-60 minute tutorial.
    duration_score = 1.0 if duration_seconds is not None and 180 <= duration_seconds <= 5400 else 0.0

    return view_score + recency_score + title_match_score + duration_score


def _to_resource(video: CachedVideo) -> RoadmapResource:
    return RoadmapResource(
        title=video.title,
        type="video",
        url=video.url,
        videoId=video.videoId,
        channelName=video.channelName,
        thumbnailUrl=video.thumbnailUrl,
        publishedAt=video.publishedAt,
        durationSeconds=video.durationSeconds,
    )


async def search_youtube_videos(settings: Settings, query: str, limit: int = 4) -> list[RoadmapResource]:
    """Best-effort YouTube search — never raises. A missing key, quota error,
    or network failure just means the roadmap's video section is empty; the
    rest of the roadmap (stages, documentation) is still perfectly usable."""
    if not settings.youtube_api_key or not query.strip():
        return []

    cached = await YoutubeCache.find_one(YoutubeCache.query == _normalize_query(query))
    if cached:
        return [_to_resource(v) for v in cached.videos[:limit]]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            search_res = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "part": "snippet",
                    "type": "video",
                    "q": query,
                    "maxResults": 10,
                    "order": "relevance",
                    "safeSearch": "strict",
                    "key": settings.youtube_api_key,
                },
            )
            if search_res.is_error:
                logger.warning("YouTube search request failed (%s), roadmap videos will be empty", search_res.status_code)
                return []
            items = [i for i in search_res.json().get("items", []) if i.get("id", {}).get("videoId")]
            if not items:
                return []

            video_ids = ",".join(i["id"]["videoId"] for i in items)
            details_res = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={"part": "contentDetails,statistics", "id": video_ids, "key": settings.youtube_api_key},
            )
            details_by_id = {}
            if not details_res.is_error:
                for d in details_res.json().get("items", []):
                    details_by_id[d["id"]] = d
    except httpx.HTTPError as err:
        logger.warning("YouTube search errored, roadmap videos will be empty: %s", err)
        return []

    ranked = sorted(
        items, key=lambda i: _score_video(i["snippet"], details_by_id.get(i["id"]["videoId"]), query), reverse=True
    )[: max(limit, 5)]

    videos = []
    for item in ranked:
        snippet = item["snippet"]
        details = details_by_id.get(item["id"]["videoId"])
        thumbnails = snippet.get("thumbnails", {})
        videos.append(
            CachedVideo(
                videoId=item["id"]["videoId"],
                title=snippet["title"],
                channelName=snippet["channelTitle"],
                thumbnailUrl=(thumbnails.get("medium") or thumbnails.get("default") or {}).get("url", ""),
                description=snippet.get("description", ""),
                publishedAt=snippet["publishedAt"],
                url=f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                durationSeconds=_parse_iso_duration(details["contentDetails"]["duration"]) if details else None,
            )
        )

    normalized = _normalize_query(query)
    try:
        existing = await YoutubeCache.find_one(YoutubeCache.query == normalized)
        if existing:
            existing.videos = videos
            existing.createdAt = datetime.now(UTC)
            await existing.save()
        else:
            await YoutubeCache(query=normalized, videos=videos).insert()
    except Exception as err:  # noqa: BLE001 — caching is an optimization, a failed write must never break the search result
        logger.warning("Failed to cache YouTube search results for %r: %s", normalized, err)
    return [_to_resource(v) for v in videos[:limit]]
