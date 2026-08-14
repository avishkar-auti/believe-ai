import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "../../components/layout/Sidebar.js";
import { Topbar } from "../../components/layout/Topbar.js";
import { CommandPalette } from "../../features/search/CommandPalette.js";

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
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
    </div>
  );
}
