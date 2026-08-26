import { apiClient } from "../../lib/apiClient.js";

// Served directly by the Python AI service (agentic-RAG LangGraph pipeline,
// agents/news_search/) — ephemeral, same two-backend split as Resume Chat
// and Career Fit. The AI service returns the result directly, no
// {success,data} envelope.

export type NewsMode = "resume" | "search";

export interface ScoredArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string | null;
  embeddingScore: number | null;
  relevanceScore: number | null;
  /** Grounded, LLM-generated "why this matters to you" — null if generation was skipped or failed. */
  whyRelevant: string | null;
}

export interface NewsFeedResult {
  articles: ScoredArticle[];
  mode: NewsMode;
  queryUsed: string;
}

export async function fetchNewsFeed(mode: NewsMode, query?: string, pageSize = 8): Promise<NewsFeedResult> {
  const res = await apiClient.post<NewsFeedResult>("/news/feed", { mode, query, pageSize });
  return res.data;
}
