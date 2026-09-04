import { NavLink } from "react-router-dom";
import { cn } from "../../../lib/cn.js";
import type { NavLeaf } from "../sidebarNav.js";

/** A Career Hub group's child link — a small dot instead of a full icon,
 * per the redesign's parent/child hierarchy (only visible when the sidebar
 * itself is expanded; collapsed mode hides children entirely). */
export function SidebarSubItem({ item, onNavigate }: { item: NavLeaf; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className="group relative flex items-center gap-2.5 rounded-control py-1.5 pl-9 pr-3 text-[13px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-150",
              isActive ? "bg-accent" : "bg-fg-subtle group-hover:bg-fg-muted",
            )}
          />
          <span
            className={cn(
              "min-w-0 flex-1 truncate transition-colors duration-150",
              isActive ? "font-semibold text-accent" : "text-fg-muted group-hover:text-fg",
            )}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}
