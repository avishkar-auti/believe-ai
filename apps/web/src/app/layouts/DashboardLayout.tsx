import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "../../components/layout/Sidebar.js";
import { Topbar } from "../../components/layout/Topbar.js";
import { CommandPalette } from "../../features/search/CommandPalette.js";
import { FloatingNotesLayer } from "../../features/floating-notes/FloatingNotesLayer.js";

export function DashboardLayout() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // A route change is the clearest signal navigation is "done" — close the
  // drawer so returning to the app on mobile doesn't leave it open over the page.
  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-900">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="relative z-0 flex flex-1 flex-col">
        {/* Ambient background — sits behind every page in the shell. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-[32rem] w-[32rem] rounded-full bg-brand-400/[0.14] blur-[100px] dark:bg-brand-500/[0.16]" />
          <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-lime-400/[0.12] blur-[100px] dark:bg-lime-500/[0.1]" />
          <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-amber-400/[0.1] blur-[100px] dark:bg-amber-500/[0.08]" />
        </div>

        <Topbar onOpenMenu={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      {/* Mounted once at the shell so Cmd/Ctrl+K works from any page. */}
      <CommandPalette />
      {/* Same reasoning — floated notes stay visible across every route. */}
      <FloatingNotesLayer />
    </div>
  );
}
