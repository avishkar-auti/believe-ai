import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { FeedbackWidget } from "../../features/feedback/FeedbackWidget.js";
import { NAV } from "./sidebarNav.js";
import { SidebarHeader, SidebarExpandButton } from "./sidebar/SidebarHeader.js";
import { SidebarSearch } from "./sidebar/SidebarSearch.js";
import { SidebarSection } from "./sidebar/SidebarSection.js";
import { SidebarGroup } from "./sidebar/SidebarGroup.js";
import { SidebarPlanCard } from "./sidebar/SidebarPlanCard.js";
import { SidebarProfile } from "./sidebar/SidebarProfile.js";

const COLLAPSE_STORAGE_KEY = "believe-ai:sidebar-collapsed";
// How close to an edge counts as "there" — avoids the fade flickering on
// sub-pixel scroll-position rounding right at the top/bottom.
const EDGE_FADE_THRESHOLD_PX = 2;

function readStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
}

/** Shared nav body — same section/group components render inside the full
 * desktop rail, the compact rail, and the mobile drawer, per the redesign's
 * "one config, one set of components" principle (no triplicated markup).
 *
 * Only this region scrolls (header/footer are fixed siblings in Sidebar
 * itself) — see the aside's own overflow-hidden below. The top/bottom fade
 * is genuinely content-aware (tracks real scroll position via a ref, not a
 * CSS trick that risks showing when there's nothing to scroll to) but stays
 * deliberately simple: a scroll-event listener plus a resize observer for
 * viewport/collapse-driven layout changes — no scroll library, no JS
 * scrollbar reimplementation, the actual scrolling stays 100% native. */
function SidebarBody({
  collapsed,
  onExpandSidebar,
  onNavigate,
}: {
  collapsed: boolean;
  onExpandSidebar: () => void;
  onNavigate?: () => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateFade = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > EDGE_FADE_THRESHOLD_PX);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - EDGE_FADE_THRESHOLD_PX);
  }, []);

  useEffect(() => {
    updateFade();
    const el = navRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateFade, collapsed]);

  return (
    <div className="relative min-h-0 flex-1">
      <nav
        ref={navRef}
        onScroll={updateFade}
        className={cn(
          "sidebar-scroll h-full space-y-5 overflow-y-auto overflow-x-hidden py-2",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {NAV.map((section) =>
          section.groups ? (
            <div key={section.heading} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                  {section.heading}
                </p>
              )}
              <div className={collapsed ? "flex flex-col items-center gap-1" : "space-y-1"}>
                {section.groups.map((group) => (
                  <SidebarGroup
                    key={group.label}
                    group={group}
                    collapsed={collapsed}
                    onExpandSidebar={onExpandSidebar}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ) : (
            <SidebarSection key={section.heading} section={section} collapsed={collapsed} onNavigate={onNavigate} />
          ),
        )}
      </nav>

      {/* Content-aware edge fades — only appear when there's genuinely more
          to scroll to in that direction, never a static decoration. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-surface to-transparent transition-opacity duration-150",
          canScrollUp ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-surface to-transparent transition-opacity duration-150",
          canScrollDown ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("shrink-0 space-y-3 border-t border-line p-3", collapsed && "flex flex-col items-center px-2")}>
      <SidebarPlanCard collapsed={collapsed} />
      {!collapsed && (
        <div className="flex items-center justify-between px-1">
          <FeedbackWidget />
        </div>
      )}
      <SidebarProfile collapsed={collapsed} />
    </div>
  );
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  function expandSidebar() {
    if (!collapsed) return;
    setCollapsed(false);
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, "false");
  }

  return (
    <>
      {/* Desktop — always mounted, hidden below md. Width itself animates
          between full (288px) and compact (72px); DashboardLayout's flex
          layout reflows main content automatically, no offset math needed.
          overflow-hidden on the aside itself is deliberate: only
          SidebarBody's own <nav> ever scrolls, never the whole rail. */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-line bg-surface transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-[72px]" : "w-72",
        )}
      >
        <SidebarHeader collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        {collapsed && <SidebarExpandButton onExpand={toggleCollapsed} />}
        <SidebarSearch collapsed={collapsed} />
        <SidebarBody collapsed={collapsed} onExpandSidebar={expandSidebar} />
        <SidebarFooter collapsed={collapsed} />
      </aside>

      {/* Mobile — a slide-in drawer, only ever rendered while open. Never
          shows the compact rail — full nav content, always expanded groups
          layout, matching the desktop expanded presentation. Same
          scroll-only-the-nav architecture as desktop; touch users scroll
          directly, so the already-thin scrollbar reads as even less
          necessary there, not a separate treatment. */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-fg/40"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-hidden border-r border-line bg-surface"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <div className="flex shrink-0 items-center justify-between pr-3">
                <SidebarHeader collapsed={false} />
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-pill text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarSearch collapsed={false} />
              <SidebarBody collapsed={false} onExpandSidebar={() => {}} onNavigate={onCloseMobile} />
              <SidebarFooter collapsed={false} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
