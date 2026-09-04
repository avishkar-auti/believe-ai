import type { NavSection } from "../sidebarNav.js";
import { SidebarItem } from "./SidebarItem.js";

/** A flat section (Workspace/Account) — heading + a list of top-level items.
 * Career Hub is rendered separately (see SidebarGroup.tsx) since it groups
 * items rather than listing them flat. */
export function SidebarSection({
  section,
  collapsed,
  onNavigate,
}: {
  section: NavSection;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  if (!section.items) return null;

  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
          {section.heading}
        </p>
      )}
      <div className={collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"}>
        {section.items.map((item) => (
          <SidebarItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
