import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu as MenuIcon, X } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Logo } from "../../components/ui/Logo.js";
import { cn } from "../../lib/cn.js";
import { isDropdown, LANDING_NAV, type LandingNavEntry } from "./landingNavigation.js";

function NavEntryLink({ entry, onClick }: { entry: LandingNavEntry; onClick?: () => void }) {
  if (isDropdown(entry)) return null;
  if (entry.to.startsWith("/#")) {
    return (
      <a
        href={entry.to.slice(1)}
        onClick={onClick}
        className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
      >
        {entry.label}
      </a>
    );
  }
  return (
    <Link to={entry.to} onClick={onClick} className="text-sm font-medium text-fg-muted transition-colors hover:text-fg">
      {entry.label}
    </Link>
  );
}

function NavDropdown({ entry, open, onToggle, onClose }: { entry: LandingNavEntry; open: boolean; onToggle: () => void; onClose: () => void }) {
  if (!isDropdown(entry)) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-1 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
      >
        {entry.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.985 }}
            transition={{ duration: 0.18 }}
            style={{ transformOrigin: "top" }}
            className="absolute left-1/2 top-full mt-3 w-52 -translate-x-1/2 rounded-panel border border-line bg-surface p-1.5 shadow-lift"
          >
            {entry.links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className="block rounded-control px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-fg/[0.05] hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    function onDown(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpenIndex(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openIndex]);

  return (
    <header className="sticky top-0 z-40 px-4 pt-5 sm:px-6">
      <div
        ref={navRef}
        className={cn(
          "mx-auto flex max-w-content items-center justify-between rounded-panel border px-5 backdrop-blur-md transition-all duration-200",
          scrolled ? "border-line bg-surface/95 py-2.5 shadow-card" : "border-transparent bg-surface/80 py-3.5",
        )}
      >
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex">
          {LANDING_NAV.map((entry, i) =>
            isDropdown(entry) ? (
              <NavDropdown
                key={entry.label}
                entry={entry}
                open={openIndex === i}
                onToggle={() => setOpenIndex((v) => (v === i ? null : i))}
                onClose={() => setOpenIndex(null)}
              />
            ) : (
              <NavEntryLink key={entry.label} entry={entry} />
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden lg:block">
            <Button size="sm" variant="secondary">
              Log in
            </Button>
          </Link>
          <Link to="/signup" className="hidden sm:block">
            <Button size="sm">Sign up</Button>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-fg/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 mt-4 max-h-[85vh] overflow-y-auto rounded-panel border border-line bg-surface p-4 shadow-lift"
            >
              <div className="mb-3 flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-pill text-fg-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                {LANDING_NAV.map((entry) =>
                  isDropdown(entry) ? (
                    <MobileNavGroup key={entry.label} entry={entry} onNavigate={() => setMobileOpen(false)} />
                  ) : (
                    <NavEntryLink key={entry.label} entry={entry} onClick={() => setMobileOpen(false)} />
                  ),
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileNavGroup({ entry, onNavigate }: { entry: LandingNavEntry; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  if (!isDropdown(entry)) return null;
  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-control px-3 py-2.5 text-sm font-medium text-fg"
      >
        {entry.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 py-1 pl-3">
              {entry.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onNavigate}
                  className="block rounded-control px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-fg/[0.05] hover:text-fg"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
