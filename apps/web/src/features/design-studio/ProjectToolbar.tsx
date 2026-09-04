import { Grid3x3, List, Search } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { Select } from "../../components/ui/Select.js";

export type ProjectSort = "updated" | "name";
export type ProjectView = "grid" | "list";
export type PlatformFilter = "all" | "web" | "mobile";

const shortcutLabel = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

export function ProjectToolbar({
  onOpenSearch,
  sort,
  onSortChange,
  view,
  onViewChange,
  platformFilter,
  onPlatformFilterChange,
}: {
  onOpenSearch: () => void;
  sort: ProjectSort;
  onSortChange: (s: ProjectSort) => void;
  view: ProjectView;
  onViewChange: (v: ProjectView) => void;
  platformFilter: PlatformFilter;
  onPlatformFilterChange: (p: PlatformFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-9 w-48 items-center gap-2 rounded-pill border border-line bg-surface px-3 text-xs text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted sm:w-56"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search projects…</span>
        <kbd className="hidden rounded-pill bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-subtle sm:inline">{shortcutLabel}</kbd>
      </button>

      <Select className="!h-9 w-36" value={platformFilter} onChange={(e) => onPlatformFilterChange(e.target.value as PlatformFilter)}>
        <option value="all">All platforms</option>
        <option value="web">Desktop</option>
        <option value="mobile">Mobile</option>
      </Select>

      <Select className="!h-9 w-36" value={sort} onChange={(e) => onSortChange(e.target.value as ProjectSort)}>
        <option value="updated">Last edited</option>
        <option value="name">Name</option>
      </Select>

      <div className="ml-auto flex items-center gap-0.5 rounded-pill border border-line bg-surface p-0.5">
        <button
          type="button"
          onClick={() => onViewChange("grid")}
          aria-pressed={view === "grid"}
          aria-label="Grid view"
          className={cn("flex h-7 w-7 items-center justify-center rounded-pill transition-colors", view === "grid" ? "bg-surface-3 text-fg" : "text-fg-subtle hover:text-fg")}
        >
          <Grid3x3 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("list")}
          aria-pressed={view === "list"}
          aria-label="List view"
          className={cn("flex h-7 w-7 items-center justify-center rounded-pill transition-colors", view === "list" ? "bg-surface-3 text-fg" : "text-fg-subtle hover:text-fg")}
        >
          <List className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
