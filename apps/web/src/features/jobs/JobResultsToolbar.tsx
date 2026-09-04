import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Tabs, type TabItem } from "../../components/ui/Tabs.js";
import { cn } from "../../lib/cn.js";

export type JobResultsTab = "all" | "best-match" | "saved";
export type JobViewMode = "list" | "grid";

export function JobResultsToolbar({
  total,
  isLoading,
  activeTab,
  onTabChange,
  bestMatchEnabled,
  viewMode,
  onViewModeChange,
  selectedFilterCount,
  onOpenMobileFilters,
}: {
  total: number;
  isLoading: boolean;
  activeTab: JobResultsTab;
  onTabChange: (tab: JobResultsTab) => void;
  bestMatchEnabled: boolean;
  viewMode: JobViewMode;
  onViewModeChange: (v: JobViewMode) => void;
  selectedFilterCount: number;
  onOpenMobileFilters: () => void;
}) {
  const tabs: TabItem[] = [
    { value: "all", label: "All jobs" },
    { value: "best-match", label: "Best match" },
    { value: "saved", label: "Saved" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Jobs for you</h2>
          <p className="text-caption text-fg-subtle">{isLoading ? "Loading…" : `${total} opportunit${total === 1 ? "y" : "ies"}`}</p>
        </div>
        <div className="hidden items-center gap-1 rounded-control border border-line bg-surface p-0.5 sm:flex">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
            className={cn("rounded-[7px] p-1.5 transition-colors", viewMode === "list" ? "bg-accent-soft text-accent" : "text-fg-subtle hover:text-fg")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
            className={cn("rounded-[7px] p-1.5 transition-colors", viewMode === "grid" ? "bg-accent-soft text-accent" : "text-fg-subtle hover:text-fg")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Tabs
          items={activeTab === "best-match" || bestMatchEnabled ? tabs : tabs.filter((t) => t.value !== "best-match")}
          value={activeTab}
          onChange={(v) => onTabChange(v as JobResultsTab)}
          ariaLabel="Job results view"
        />
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="flex shrink-0 items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-caption font-medium text-fg lg:hidden"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          {selectedFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-pill bg-accent-soft px-1 text-[10px] font-bold text-accent">
              {selectedFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
