import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ModernSidebar } from "./ModernSidebar.js";
import { ModernTopbar } from "./ModernTopbar.js";
import { ModernBackground } from "./ModernBackground.js";
import { MODERN_MOTION } from "../../lib/modernMotion.js";

/**
 * The Modern presentation of the authenticated app. Deliberately only owns
 * chrome and container geometry — pages render through the same <Outlet />
 * as the classic shell, so no page knows or cares which experience is
 * active.
 *
 * Shell-level singletons (command palette, floating notes) stay mounted by
 * DashboardLayout above this, so switching experience never remounts them.
 */
export function ModernAppShell({
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
    <div className="flex min-h-screen">
      <ModernBackground />
      <ModernSidebar mobileOpen={mobileNavOpen} onCloseMobile={onCloseMobileNav} />
      <div className="relative z-0 flex min-w-0 flex-1 flex-col">
        <ModernTopbar onOpenMenu={onOpenMobileNav} />
        <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1180px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: MODERN_MOTION.duration.normal, ease: MODERN_MOTION.ease.smooth }}
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
