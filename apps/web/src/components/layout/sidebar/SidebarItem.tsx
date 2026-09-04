import { NavLink } from "react-router-dom";
import { cn } from "../../../lib/cn.js";
import { Tooltip } from "../../ui/Tooltip.js";
import type { NavLeaf } from "../sidebarNav.js";

/** One top-level (Workspace/Account) nav link. Active state is a soft
 * lavender background + a 3px left indicator bar — replaces the old
 * saturated full pill, per the redesign's "elegant, not loud" direction. */
export function SidebarItem({ item, collapsed, onNavigate }: { item: NavLeaf; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon!;

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-control transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        collapsed ? "w-10 justify-center" : "px-3",
      )}
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "absolute inset-0 rounded-control transition-colors duration-150",
              isActive ? "bg-accent-soft" : "bg-transparent group-hover:bg-fg/[0.05]",
            )}
          />
          {isActive && <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent" />}
          <Icon
            className={cn(
              "relative z-10 h-4 w-4 shrink-0 transition-colors duration-150",
              isActive ? "text-accent" : "text-fg-muted group-hover:text-fg",
            )}
          />
          {!collapsed && (
            <span
              className={cn(
                "relative z-10 min-w-0 flex-1 truncate text-sm transition-colors duration-150",
                isActive ? "font-semibold text-accent" : "font-medium text-fg-muted group-hover:text-fg",
              )}
            >
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return collapsed ? (
    <Tooltip label={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
