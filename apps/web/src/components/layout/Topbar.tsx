import { LogOut, Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { NotificationBell } from "../../features/notifications/NotificationBell.js";
import { OPEN_COMMAND_PALETTE_EVENT } from "../../features/search/CommandPalette.js";
import { ThemeToggle } from "./ThemeToggle.js";
import { Button } from "../ui/Button.js";

/** Mac reports "MacIntel"; everything else gets the Ctrl hint. */
const shortcutLabel =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

export function Topbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-ink-100 bg-white/85 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/85 sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT))}
          className="flex min-w-0 items-center gap-2 rounded-pill bg-ink-50 px-4 py-2 text-sm text-ink-400 transition-all duration-150 hover:scale-[1.02] hover:bg-ink-100 hover:text-ink-600 active:scale-[0.98] dark:bg-ink-800 dark:hover:bg-ink-700 dark:hover:text-ink-200"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="ml-4 hidden rounded-pill bg-white px-1.5 py-0.5 font-sans text-xs text-ink-400 sm:inline dark:bg-ink-900">
            {shortcutLabel}
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        {user && (
          <span className="hidden text-sm text-ink-600 dark:text-ink-300 sm:inline">{user.name || user.email}</span>
        )}
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </motion.header>
  );
}
