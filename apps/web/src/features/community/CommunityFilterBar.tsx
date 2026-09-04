import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { EASE, MOTION } from "../../lib/motion.js";

export type CommunityTab = "latest" | "top" | "mine";

const TABS: { id: CommunityTab; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "top", label: "Most upvoted" },
  { id: "mine", label: "My posts" },
];

export function CommunityFilterBar({
  tab,
  onTabChange,
  search,
  onSearchChange,
}: {
  tab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "text-fg" : "text-fg-subtle hover:text-fg",
            )}
          >
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId="community-tab-indicator"
                className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent"
                transition={{ duration: MOTION.normal, ease: EASE }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="relative sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search community…"
          aria-label="Search community posts"
          className="h-9 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
        />
      </div>
    </div>
  );
}
