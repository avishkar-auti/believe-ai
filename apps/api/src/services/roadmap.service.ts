import type { HydratedDocument } from "mongoose";
import type { PaginatedResult, Roadmap, RoadmapResource, RoadmapResourceType } from "@believe-ai/shared";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@believe-ai/shared";
import type { RoadmapDocument } from "@believe-ai/server";
import { roadmapRepository } from "../repositories/roadmap.repository.js";
import { getRoadmap as getRoadmapFromAiService, type RoadmapAiResult } from "./aiServiceClient.js";
import { searchYoutubeVideos } from "./youtube.client.js";
import { findDocumentation } from "./documentationResources.js";
import { NotFoundError } from "../errors/AppError.js";

type AiStage = RoadmapAiResult["stages"][number];

function toDto(doc: HydratedDocument<RoadmapDocument>): Roadmap {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    goal: doc.goal,
    detectedSkills: doc.detectedSkills ?? [],
    stages: (doc.stages ?? []).map((stage) => ({
      title: stage.title,
      topics: stage.topics ?? [],
      difficulty: (stage.difficulty as Roadmap["stages"][number]["difficulty"]) ?? null,
      prerequisites: stage.prerequisites ?? [],
      skillStatus: (stage.skillStatus as Roadmap["stages"][number]["skillStatus"]) ?? null,
      resources: (stage.resources ?? []).map((r) => ({
        title: r.title,
        type: r.type as RoadmapResourceType,
        url: r.url ?? null,
        videoId: r.videoId ?? null,
        channelName: r.channelName ?? null,
        thumbnailUrl: r.thumbnailUrl ?? null,
        publishedAt: r.publishedAt ?? null,
        durationSeconds: r.durationSeconds ?? null,
      })),
    })),
    createdAt: doc.createdAt.toISOString(),
  };
}

/** "Kubernetes for beginners DevOps" — scoped to the stage + goal + level, not the whole resume (relevance over recall). */
function buildYoutubeQuery(stageTitle: string, goal: string, difficulty: AiStage["difficulty"]): string {
  const level = difficulty === "beginner" ? "for beginners" : difficulty === "advanced" ? "advanced" : "tutorial";
  return `${stageTitle} ${level} ${goal}`.trim();
}

/**
 * Replaces the agent's placeholder resources with real ones: the LLM never emits a genuine
 * video URL (it's told not to), so every "video" resource here comes from a real YouTube
 * search. Documentation prefers our curated, hand-verified map over the LLM's own guess,
 * falling back to the LLM's url only when it set one and our map has no match.
 */
async function enrichStage(stage: AiStage, goal: string): Promise<RoadmapResource[]> {
  const query = buildYoutubeQuery(stage.title, goal, stage.difficulty);
  const [videos, ownDoc] = await Promise.all([
    searchYoutubeVideos(query, 4),
    Promise.resolve(findDocumentation(stage.title) ?? findDocumentation(stage.topics.join(" "))),
  ]);

  const llmDocsWithUrl = stage.resources.filter((r) => r.type === "documentation" && r.url);
  const otherResources = stage.resources.filter((r) => r.type !== "video" && r.type !== "documentation");

  const docResources: RoadmapResource[] = ownDoc ? [ownDoc] : llmDocsWithUrl.map((r) => ({ ...r, type: "documentation" }));

  return [...docResources, ...videos, ...otherResources.map((r) => ({ ...r, type: r.type as RoadmapResourceType }))];
}

export const roadmapService = {
  toDto,

  /**
   * Calls the AI service (which reads the caller's own stored resume when personalize is on)
   * then enriches every stage with real YouTube videos + documentation before persisting.
   */
  async generate(userId: string, bearerToken: string, goal: string, personalize: boolean): Promise<Roadmap> {
    const result = await getRoadmapFromAiService(bearerToken, goal, personalize);

    const enrichedStages = await Promise.all(
      result.stages.map(async (stage) => ({
        title: stage.title,
        topics: stage.topics,
        difficulty: stage.difficulty,
        prerequisites: stage.prerequisites,
        skillStatus: stage.skillStatus,
        resources: await enrichStage(stage, result.goal),
      })),
    );

    const doc = await roadmapRepository.create({
      userId,
      goal: result.goal,
      detectedSkills: result.detectedSkills,
      stages: enrichedStages,
    });
    return toDto(doc);
  },

  async list(userId: string, page = 1, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<Roadmap>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));
    const [items, total] = await roadmapRepository.list(userId, safePage, safeLimit);

    return {
      items: items.map(toDto),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  },

  async getById(id: string, userId: string): Promise<Roadmap> {
    const doc = await roadmapRepository.findById(id, userId);
    if (!doc) throw new NotFoundError("Roadmap not found");
    return toDto(doc);
  },

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await roadmapRepository.delete(id, userId);
    if (!deleted) throw new NotFoundError("Roadmap not found");
  },
};
