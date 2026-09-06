import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { NAV, type NavLeaf } from "../layout/sidebarNav.js";
import { Logo } from "../ui/Logo.js";
import { cn } from "../../lib/cn.js";
import { MODERN_MOTION } from "../../lib/modernMotion.js";

/** Career Hub's groups collapse into their leaves here — Modern's rail is a
 * flat scannable list rather than the classic accordion, but it still points
 * at exactly the same routes from the same NAV config. */
function flattenSection(section: (typeof NAV)[number]): NavLeaf[] {
  return [...(section.items ?? []), ...(section.groups ?? []).flatMap((group) => group.items)];
}

function ModernNavItem({ item, onNavigate }: { item: NavLeaf; onNavigate?: () => void }) {
  const Icon: LucideIcon | undefined = item.icon;

  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} className="group relative block">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="modern-sidebar-active"
              transition={MODERN_MOTION.spring.soft}
              className="absolute inset-0 rounded-[var(--radius-sm)] border border-accent/25 bg-accent/10"
            />
          )}
          <span
            className={cn(
              "relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13.5px] transition-colors",
              isActive ? "font-medium text-fg" : "text-fg-muted group-hover:bg-fg/[0.04] group-hover:text-fg",
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:-translate-y-px",
                  isActive ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted",
                )}
              />
            ) : (
              <span className={cn("ml-1.5 h-1 w-1 shrink-0 rounded-full", isActive ? "bg-accent" : "bg-fg-subtle")} />
            )}
            <span className="truncate">{item.label}</span>
          </span>
        </>
      )}
    </NavLink>
  );
}

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo />
      </div>

      <nav className="sidebar-scroll flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV.map((section) => (
          <div key={section.heading}>
            <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-subtle">{section.heading}</p>
            <div className="space-y-0.5">
              {flattenSection(section).map((item) => (
                <ModernNavItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 p-3">
        <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, rgb(var(--accent) / 0.35), transparent 70%)" }}
          />
          <p className="relative text-[13px] font-semibold leading-tight text-fg">
            A more
            <br />
            confident you.
          </p>
          <p className="relative mt-1.5 text-[11.5px] leading-snug text-fg-muted">AI-powered tools for a brighter career.</p>
          <NavLink
            to="/app/career-fit"
            onClick={onNavigate}
            className="group relative mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-accent"
          >
            Keep going
            <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
          </NavLink>
        </div>
      </div>
    </>
  );
}

export function ModernSidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 backdrop-blur-xl md:flex">
        <SidebarContents />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MODERN_MOTION.duration.fast }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-black/55"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={MODERN_MOTION.spring.snappy}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col border-r border-line bg-surface"
            >
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="absolute right-3 top-5 rounded-full p-1.5 text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContents onNavigate={onCloseMobile} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
