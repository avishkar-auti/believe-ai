import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/cn.js";
import believeIcon from "../../../assets/brand/believe-icon.png";

/** Brand mark + collapse toggle. `onToggleCollapse` is omitted entirely on
 * mobile (there's nothing to collapse to in a drawer), rendering a close
 * button there instead — see Sidebar.tsx. */
export function SidebarHeader({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className={cn("flex h-14 shrink-0 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
      <Link to="/app" className="flex min-w-0 flex-1 items-center gap-2">
        <motion.img
          src={believeIcon}
          alt=""
          whileHover={{ y: -1, scale: 1.05 }}
          transition={{ duration: 0.18 }}
          className="h-7 w-7 shrink-0"
        />
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-fg">believe.ai</span>
        )}
      </Link>
      {!collapsed && onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Standalone expand button shown in place of the header once collapsed —
 * the header itself has no room left for a second control at 72px wide. */
export function SidebarExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex justify-center px-0 pb-1">
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand sidebar"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
