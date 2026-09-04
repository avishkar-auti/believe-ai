import { Fragment, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import type { ChallengeDetail } from "@believe-ai/shared";
import { SectionLabel } from "../../components/ui/Surface.js";

/** Renders `**bold**` and `` `code` `` spans within one line of text — the
 * only inline Markdown challenge descriptions actually use. */
function renderInline(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${keyPrefix}-${i}`} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[13px] text-fg">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

/** Minimal, dependency-free renderer for the small Markdown subset challenge
 * descriptions actually use (headings, blank-line paragraphs, dash lists,
 * inline bold/code spans) — not a general Markdown library, since nothing
 * else in the app needs one. */
function MarkdownBlocks({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h3 key={i} className="pt-1 text-[15px] font-semibold text-fg">
              {renderInline(block.slice(3), `h${i}`)}
            </h3>
          );
        }
        const lines = block.split("\n").filter(Boolean);
        if (lines.every((l) => l.trimStart().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-fg-muted">
              {lines.map((l, j) => (
                <li key={j}>{renderInline(l.trimStart().slice(2), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-fg-muted">
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(l, `${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function ProblemPanel({ challenge }: { challenge: ChallengeDetail }) {
  return (
    <div className="min-w-0 space-y-6 overflow-y-auto">
      <MarkdownBlocks text={challenge.description} />

      {challenge.sampleTests.length > 0 && (
        <div>
          <SectionLabel>Sample tests</SectionLabel>
          <div className="mt-2.5 space-y-2">
            {challenge.sampleTests.map((t, i) => (
              <div key={i} className="rounded-control border border-line bg-surface-2 p-3 font-mono text-xs">
                {t.name && <p className="mb-1 font-sans text-caption font-medium text-fg-muted">{t.name}</p>}
                {t.input && <p className="text-fg">{t.input}</p>}
                {t.expectedOutput && <p className="mt-0.5 text-fg-subtle">→ {t.expectedOutput}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {challenge.resources.length > 0 && (
        <div>
          <SectionLabel>Resources</SectionLabel>
          <div className="mt-2.5 space-y-1.5">
            {challenge.resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="group/link flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                {r.title}
                <ExternalLink className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {challenge.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {challenge.tags.map((tag) => (
            <span key={tag} className="rounded-pill border border-line px-2 py-0.5 text-[11px] font-medium text-fg-subtle">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
