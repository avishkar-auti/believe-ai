import type { RoadmapResource } from "@believe-ai/shared";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { youtubeCacheRepository, type CachedVideo } from "../repositories/youtubeCache.repository.js";

interface YtSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    publishedAt: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
  };
}

interface YtVideoDetails {
  id: string;
  contentDetails: { duration: string };
  statistics: { viewCount?: string; likeCount?: string };
}

/** Parses an ISO 8601 duration like "PT1H2M3S" into seconds. Returns null for anything unparseable. */
function parseIsoDuration(iso: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return null;
  const [, h, m, s] = match;
  return (Number(h ?? 0) * 3600) + (Number(m ?? 0) * 60) + Number(s ?? 0);
}

function scoreVideo(item: YtSearchItem, details: YtVideoDetails | undefined, query: string): number {
  const viewCount = Number(details?.statistics.viewCount ?? 0);
  const viewScore = Math.log10(viewCount + 1); // diminishing returns past a few hundred thousand views

  const ageMs = Date.now() - new Date(item.snippet.publishedAt).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365);
  const recencyScore = Math.max(0, 3 - ageYears) * 0.5; // mild boost for content under ~3 years old

  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const title = item.snippet.title.toLowerCase();
  const titleMatchScore = queryWords.filter((w) => title.includes(w)).length;

  const durationSeconds = parseIsoDuration(details?.contentDetails.duration ?? "");
  // Extremely short (Shorts) or extremely long (multi-hour streams) videos rank slightly lower
  // for "learning resource" purposes than a focused 10-60 minute tutorial.
  const durationScore = durationSeconds != null && durationSeconds >= 180 && durationSeconds <= 5400 ? 1 : 0;

  return viewScore + recencyScore + titleMatchScore + durationScore;
}

/**
 * Best-effort YouTube search — never throws. A missing key, quota error, or
 * network failure just means the roadmap's video section is empty; the rest
 * of the roadmap (stages, documentation) is still perfectly usable.
 */
export async function searchYoutubeVideos(query: string, limit = 4): Promise<RoadmapResource[]> {
  if (!env.YOUTUBE_API_KEY || !query.trim()) return [];

  const cached = await youtubeCacheRepository.find(query);
  if (cached) return cached.slice(0, limit).map(toResource);

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("maxResults", "10");
    searchUrl.searchParams.set("order", "relevance");
    searchUrl.searchParams.set("safeSearch", "strict");
    searchUrl.searchParams.set("key", env.YOUTUBE_API_KEY);

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      logger.warn({ status: searchRes.status }, "YouTube search request failed, roadmap videos will be empty");
      return [];
    }
    const searchData = (await searchRes.json()) as { items?: YtSearchItem[] };
    const items = (searchData.items ?? []).filter((i) => i.id?.videoId);
    if (items.length === 0) return [];

    const ids = items.map((i) => i.id.videoId).join(",");
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.searchParams.set("part", "contentDetails,statistics");
    detailsUrl.searchParams.set("id", ids);
    detailsUrl.searchParams.set("key", env.YOUTUBE_API_KEY);

    const detailsRes = await fetch(detailsUrl);
    const detailsById = new Map<string, YtVideoDetails>();
    if (detailsRes.ok) {
      const detailsData = (await detailsRes.json()) as { items?: YtVideoDetails[] };
      for (const d of detailsData.items ?? []) detailsById.set(d.id, d);
    }

    const ranked = items
      .map((item) => ({ item, details: detailsById.get(item.id.videoId) }))
      .sort((a, b) => scoreVideo(b.item, b.details, query) - scoreVideo(a.item, a.details, query))
      .slice(0, Math.max(limit, 5));

    const videos: CachedVideo[] = ranked.map(({ item, details }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      durationSeconds: details ? parseIsoDuration(details.contentDetails.duration) : null,
    }));

    await youtubeCacheRepository.save(query, videos);
    return videos.slice(0, limit).map(toResource);
  } catch (err) {
    logger.warn({ err }, "YouTube search errored, roadmap videos will be empty");
    return [];
  }
}

function toResource(v: CachedVideo): RoadmapResource {
  return {
    title: v.title,
    type: "video",
    url: v.url,
    videoId: v.videoId,
    channelName: v.channelName,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt,
    durationSeconds: v.durationSeconds,
  };
}
