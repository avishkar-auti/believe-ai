/** Client-side plain-text walk of a TipTap/ProseMirror JSON doc, for the
 * floating widget's short preview — mirrors the shape of the backend's
 * extract_plain_text (services/note_service.py) and its snippet-length
 * convention (note_ai_service.py's _SNIPPET_MAX_CHARS), just done client-side
 * to avoid a round trip or a DTO change for a tiny preview string. */

const PREVIEW_MAX_CHARS = 150;

interface DocNode {
  type?: string;
  text?: string;
  content?: DocNode[];
}

function walk(node: DocNode | undefined): string {
  if (!node) return "";
  const parts: string[] = [];
  if (typeof node.text === "string") parts.push(node.text);
  for (const child of node.content ?? []) parts.push(walk(child));
  const joiner = node.type === "paragraph" || node.type === "heading" || node.type === "listItem" ? "\n" : " ";
  return parts.filter(Boolean).join(joiner);
}

/** Untruncated plain text — for feeding a whole note into an AI transform,
 * where extractPreviewText's 150-char cap would throw away most of the note. */
export function extractPlainText(content: Record<string, unknown>): string {
  return walk(content as DocNode)
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPreviewText(content: Record<string, unknown>): string {
  const text = extractPlainText(content);
  return text.length <= PREVIEW_MAX_CHARS ? text : text.slice(0, PREVIEW_MAX_CHARS).replace(/\s+\S*$/, "") + "…";
}
