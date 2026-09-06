import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "../../components/layout/Sidebar.js";
import { Topbar } from "../../components/layout/Topbar.js";
import { AmbientBackground } from "../../components/layout/AmbientBackground.js";
import { ModernAppShell } from "../../components/modern/ModernAppShell.js";
import { CommandPalette } from "../../features/search/CommandPalette.js";
import { FloatingNotesLayer } from "../../features/floating-notes/FloatingNotesLayer.js";
import { useTheme } from "../providers/ThemeProvider.js";

function ClassicAppShell({
  mobileNavOpen,
  onOpenMobileNav,
  onCloseMobileNav,
}: {
  mobileNavOpen: boolean;
  onOpenMobileNav: () => void;
  onCloseMobileNav: () => void;
}) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={onCloseMobileNav} />
      <div className="relative z-0 flex flex-1 flex-col">
        <AmbientBackground />

        <Topbar onOpenMenu={onOpenMobileNav} />
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
    </div>
  );
}

/**
 * Picks the presentation layer. Both shells render the same <Outlet />, so
 * every page below is untouched by this choice — only chrome, spacing and
 * motion differ.
 */
export function DashboardLayout() {
  const location = useLocation();
  const { experience } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // A route change is the clearest signal navigation is "done" — close the
  // drawer so returning to the app on mobile doesn't leave it open over the page.
  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  const shellProps = {
    mobileNavOpen,
    onOpenMobileNav: () => setMobileNavOpen(true),
    onCloseMobileNav: () => setMobileNavOpen(false),
  };

  return (
    <>
      {experience === "modern" ? <ModernAppShell {...shellProps} /> : <ClassicAppShell {...shellProps} />}
      {/* Mounted once outside the shell so Cmd/Ctrl+K works from any page and
          survives an experience switch without remounting. */}
      <CommandPalette />
      {/* Same reasoning — floated notes stay visible across every route. */}
      <FloatingNotesLayer />
    </>
  );
}
