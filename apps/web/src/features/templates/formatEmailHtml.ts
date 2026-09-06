/** Block-level tags in the email allowlist (see services/email_content.py) —
 * these get their own lines. Everything else is inline and stays on the line
 * with the text around it, because breaking `<strong>` onto its own line
 * would change how the sentence reads in the editor. */
const BLOCK_TAGS = new Set(["p", "div", "ul", "ol", "li", "h1", "h2", "h3", "blockquote"]);

const INDENT = "  ";

function openTag(el: Element): string {
  // Rebuilt from the attribute list rather than sliced out of outerHTML, so an
  // attribute value containing ">" can't truncate the tag.
  const attrs = [...el.attributes].map((a) => ` ${a.name}="${a.value.replace(/"/g, "&quot;")}"`).join("");
  return `<${el.tagName.toLowerCase()}${attrs}>`;
}

function hasBlockChild(el: Element): boolean {
  return [...el.children].some((child) => BLOCK_TAGS.has(child.tagName.toLowerCase()));
}

/** A block's inline content, split into one entry per `<br>`. A sign-off like
 * "Best regards,<br>{{senderName}}<br>{{linkedin}}" is the single most common
 * thing people need to read in this editor, and as one line it's unreadable. */
function inlineRuns(el: Element): string[] {
  const runs: string[] = [];
  let current = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Collapse runs of whitespace the way HTML rendering will anyway, so
      // re-formatting an already-formatted body is stable.
      current += (node.textContent ?? "").replace(/\s+/g, " ");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element;
      current += child.outerHTML;
      if (child.tagName.toLowerCase() === "br") {
        runs.push(current);
        current = "";
      }
    }
  }
  if (current.trim()) runs.push(current);
  return runs.map((r) => r.trim()).filter(Boolean);
}

function walk(parent: Element, depth: number, lines: string[]): void {
  const pad = INDENT.repeat(depth);
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) lines.push(pad + text);
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;

    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (!BLOCK_TAGS.has(tag)) {
      lines.push(pad + el.outerHTML);
      continue;
    }

    if (hasBlockChild(el)) {
      lines.push(pad + openTag(el));
      walk(el, depth + 1, lines);
      lines.push(`${pad}</${tag}>`);
      continue;
    }

    const runs = inlineRuns(el);
    if (runs.length <= 1) {
      lines.push(`${pad}${openTag(el)}${runs[0] ?? ""}</${tag}>`);
    } else {
      lines.push(pad + openTag(el));
      for (const run of runs) lines.push(INDENT.repeat(depth + 1) + run);
      lines.push(`${pad}</${tag}>`);
    }
  }
}

/** Turns the single-line HTML the rich editor produces into something
 * readable — one block per line, nested tags indented, sign-off lines split
 * at each `<br>`.
 *
 * Whitespace-only text between block tags is insignificant in HTML rendering,
 * so this changes how the source reads, never how the email looks. The
 * indentation it introduces inside a block is stripped again server-side when
 * building the text/plain part (services/email_content.py::to_plain_text). */
export function formatEmailHtml(html: string): string {
  if (!html.trim()) return html;
  try {
    const doc = new DOMParser().parseFromString(`<div id="__fmt_root">${html}</div>`, "text/html");
    const root = doc.getElementById("__fmt_root");
    if (!root) return html;
    const lines: string[] = [];
    walk(root, 0, lines);
    return lines.join("\n");
  } catch {
    // Never let a formatting failure cost someone their draft — show the
    // original source instead.
    return html;
  }
}
