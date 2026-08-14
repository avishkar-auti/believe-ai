const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 100;

/**
 * Splits text into overlapping ~400-char windows for embedding + retrieval.
 * The overlap means a sentence that straddles a chunk boundary still appears
 * whole in at least one chunk, so similarity search doesn't miss it.
 */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (end === normalized.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}
