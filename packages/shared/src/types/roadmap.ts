/**
 * Canonical Roadmap type — a staged learning plan toward a stated goal,
 * grounded in the user's resume.
 */
export type RoadmapResourceType = "documentation" | "course" | "book" | "practice" | "video" | "article";
export type RoadmapDifficulty = "beginner" | "intermediate" | "advanced";
export type SkillStatus = "strong" | "missing" | "improve";
/** Client-only filter over an already-fetched roadmap's resources — never sent to the server. */
export type ResourceView = "documentation" | "youtube" | "both";

export interface RoadmapResource {
  title: string;
  type: RoadmapResourceType;
  /** Only ever populated for a well-known canonical page (docs) or a real, verified YouTube video — never a guessed link. */
  url: string | null;
  /** Populated only when type === "video", from a real YouTube Data API lookup. */
  videoId?: string | null;
  channelName?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
}

export interface RoadmapStage {
  title: string;
  topics: string[];
  resources: RoadmapResource[];
  difficulty: RoadmapDifficulty | null;
  prerequisites: string[];
  /** Set only when the roadmap was generated with a resume on file; null otherwise. */
  skillStatus: SkillStatus | null;
}

export interface Roadmap {
  id: string;
  userId: string;
  goal: string;
  stages: RoadmapStage[];
  /** Skills detected in the user's resume relevant to this goal — empty when generated without a resume. */
  detectedSkills: string[];
  createdAt: string;
}
