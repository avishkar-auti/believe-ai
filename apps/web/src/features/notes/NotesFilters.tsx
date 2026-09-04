import { Filter } from "lucide-react";
import { Menu, type MenuItemDef } from "../../components/ui/Menu.js";
import { cn } from "../../lib/cn.js";

export type DateFilter = "any" | "today" | "week" | "month";

export interface NotesFilterState {
  date: DateFilter;
  linkedOnly: boolean;
}

const DATE_LABEL: Record<DateFilter, string> = { any: "Any time", today: "Today", week: "This week", month: "This month" };

/** Tags/Pinned/Archived already have dedicated sidebar entries — this popover
 * covers what doesn't: a date range and "has linked context", kept compact
 * rather than exposing every possible filter on the page at once (§6). */
export function NotesFilters({ value, onChange }: { value: NotesFilterState; onChange: (next: NotesFilterState) => void }) {
  const active = value.date !== "any" || value.linkedOnly;

  const items: MenuItemDef[] = [
    ...(Object.keys(DATE_LABEL) as DateFilter[]).map((d) => ({
      id: `date-${d}`,
      label: DATE_LABEL[d] + (value.date === d ? " ✓" : ""),
      onSelect: () => onChange({ ...value, date: d }),
    })),
    { id: "linked", label: value.linkedOnly ? "Linked only ✓" : "Linked only", onSelect: () => onChange({ ...value, linkedOnly: !value.linkedOnly }) },
  ];

  return (
    <Menu
      align="start"
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption font-medium transition-colors",
            active ? "border-accent bg-accent-soft text-accent" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Filter className="h-3 w-3" /> Filter
        </button>
      }
      items={items}
    />
  );
}
