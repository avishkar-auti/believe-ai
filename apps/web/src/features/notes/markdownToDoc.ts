/** Converts the constrained Markdown subset prompts/notes.py's transcript-cleanup
 * prompt is instructed to produce (headings, paragraphs, bullet lists, bold/italic,
 * inline code) into a TipTap/ProseMirror JSON document. Deliberately small and
 * self-contained rather than a full CommonMark parser — the LLM output shape is
 * known and narrow, and pulling in a markdown-editor-integration library here hit a
 * real dependency-resolution break in this workspace. */

interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: { type: string }[];
}

function parseInline(text: string): DocNode[] {
  const nodes: DocNode[] = [];
  // Bold (**x**), italic (*x*), inline code (`x`) — simple non-overlapping scan.
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      nodes.push({ type: "text", text: match[2], marks: [{ type: "bold" }] });
    } else if (match[3] !== undefined) {
      nodes.push({ type: "text", text: match[3], marks: [{ type: "italic" }] });
    } else if (match[4] !== undefined) {
      nodes.push({ type: "text", text: match[4], marks: [{ type: "code" }] });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }
  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

export function markdownToDoc(markdown: string): Record<string, unknown> {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const at = (idx: number): string => lines[idx] ?? "";
  const content: DocNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = at(i);

    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      content.push({ type: "heading", attrs: { level }, content: parseInline(heading[2] ?? "") });
      i++;
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(at(i))) {
        codeLines.push(at(i));
        i++;
      }
      i++; // skip closing fence
      content.push({ type: "codeBlock", content: [{ type: "text", text: codeLines.join("\n") }] });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: DocNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(at(i))) {
        items.push({ type: "listItem", content: [{ type: "paragraph", content: parseInline(at(i).replace(/^[-*]\s+/, "")) }] });
        i++;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: DocNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(at(i))) {
        items.push({ type: "listItem", content: [{ type: "paragraph", content: parseInline(at(i).replace(/^\d+\.\s+/, "")) }] });
        i++;
      }
      content.push({ type: "orderedList", content: items });
      continue;
    }

    // Plain paragraph — consume until a blank line or the start of a new block.
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length && at(i).trim() && !/^(#{1,6}\s|```|[-*]\s|\d+\.\s)/.test(at(i))) {
      paraLines.push(at(i));
      i++;
    }
    content.push({ type: "paragraph", content: parseInline(paraLines.join(" ")) });
  }

  return { type: "doc", content: content.length > 0 ? content : [{ type: "paragraph" }] };
}
