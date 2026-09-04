/**
 * Canonical Resume type shared between the API and the web client. The raw
 * file bytes live in a separate ResumeFile document (not modeled here — it's
 * never sent over the wire as JSON) so listing/reading resume metadata never
 * pulls a multi-MB binary along with it.
 *
 * Many resumes per user, one of them flagged `isPrimary` — every feature
 * that reads "the" resume (Career Fit, Roadmap, Ask My Resume, Interview
 * Prep, Outreach Draft, Campaign attachments) defaults to whichever one that
 * is when the caller doesn't ask for a specific resume by id.
 */
export interface ResumeChunk {
  text: string;
  /** Absent until the embedding pipeline has run for this chunk. */
  vector: number[] | null;
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
  chunks: ResumeChunk[];
  /** True once every chunk has a vector — lets clients tell "uploaded" apart from "ready for RAG". */
  embeddingReady: boolean;
  isPrimary: boolean;
  /** e.g. "Software Engineer", "AI/ML Engineer" — the resume's display name in the UI, falling back to fileName when unset. */
  targetRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateResumeInput {
  targetRole?: string | null;
}
