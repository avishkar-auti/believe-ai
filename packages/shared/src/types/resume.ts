/**
 * Canonical Resume type shared between the API and the web client. The raw
 * file bytes live in a separate ResumeFile document (not modeled here — it's
 * never sent over the wire as JSON) so listing/reading resume metadata never
 * pulls a multi-MB binary along with it.
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
  createdAt: string;
  updatedAt: string;
}
