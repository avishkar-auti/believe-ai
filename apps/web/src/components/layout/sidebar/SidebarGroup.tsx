import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../lib/cn.js";
import { MOTION, EASE } from "../../../lib/motion.js";
import type { NavGroup } from "../sidebarNav.js";
import { SidebarSubItem } from "./SidebarSubItem.js";
import { Tooltip } from "../../ui/Tooltip.js";

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
}

/** One Career Hub group (Resume & Career / Practice / Opportunities) — an
 * independently collapsible accordion. Defaults open when one of its own
 * children is the active route, otherwise closed, and the user can toggle
 * freely after that (not locked to the route). When the whole sidebar is
 * collapsed, renders as a single tooltipped icon that expands the sidebar
 * on click — per the brief's "prefer expanding over a flyout" guidance. */
export function SidebarGroup({
  group,
  collapsed,
  onExpandSidebar,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  onExpandSidebar: () => void;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = isGroupActive(group, pathname);
  const [open, setOpen] = useState(active);
  const Icon = group.icon;

  if (collapsed) {
    return (
      <Tooltip label={group.label} side="right">
        <button
          type="button"
          onClick={onExpandSidebar}
          aria-label={`Expand sidebar to ${group.label}`}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-control transition-colors duration-150",
            active ? "bg-accent-soft" : "hover:bg-fg/[0.05]",
          )}
        >
          {active && <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-accent" />}
          <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-fg-muted")} />
        </button>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "group flex h-10 w-full items-center gap-2.5 rounded-control px-3 text-sm font-medium transition-colors duration-150",
          active ? "text-accent" : "text-fg-muted hover:bg-fg/[0.05] hover:text-fg",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted")} />
        <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: MOTION.normal, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-1 pt-0.5">
              {group.items.map((item) => (
                <SidebarSubItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
