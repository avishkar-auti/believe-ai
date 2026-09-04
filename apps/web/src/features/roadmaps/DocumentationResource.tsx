import { BookOpen, ExternalLink } from "lucide-react";
import type { RoadmapResource } from "@believe-ai/shared";

const TYPE_LABEL: Record<string, string> = {
  documentation: "Documentation",
  course: "Course",
  book: "Book",
  practice: "Practice",
  article: "Article",
};

export function DocumentationResource({ resource }: { resource: RoadmapResource }) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-2 text-fg-muted">
        <BookOpen className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{resource.title}</span>
        <span className="block text-caption text-fg-subtle">{TYPE_LABEL[resource.type] ?? "Resource"}</span>
      </span>
      {resource.url && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform duration-150 group-hover:translate-x-px group-hover:-translate-y-px" />
      )}
    </>
  );

  const className =
    "group flex min-h-[60px] items-center gap-3 rounded-control border border-line bg-surface px-3.5 py-2.5 transition-colors duration-150 hover:border-line-strong";

  return resource.url ? (
    <a href={resource.url} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}
