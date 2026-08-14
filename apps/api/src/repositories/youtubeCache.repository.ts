import { YoutubeCacheModel } from "@believe-ai/server";

export interface CachedVideo {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  description: string;
  publishedAt: string;
  url: string;
  durationSeconds: number | null;
}

/** Collapses whitespace/case so near-identical queries ("Docker  tutorial" vs "docker tutorial") share one cache entry. */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export const youtubeCacheRepository = {
  async find(query: string): Promise<CachedVideo[] | null> {
    const doc = await YoutubeCacheModel.findOne({ query: normalizeQuery(query) });
    if (!doc) return null;
    return doc.videos.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      channelName: v.channelName,
      thumbnailUrl: v.thumbnailUrl,
      description: v.description ?? "",
      publishedAt: v.publishedAt,
      url: v.url,
      durationSeconds: v.durationSeconds ?? null,
    }));
  },

  async save(query: string, videos: CachedVideo[]): Promise<void> {
    await YoutubeCacheModel.findOneAndUpdate(
      { query: normalizeQuery(query) },
      { query: normalizeQuery(query), videos, createdAt: new Date() },
      { upsert: true },
    );
  },
};
