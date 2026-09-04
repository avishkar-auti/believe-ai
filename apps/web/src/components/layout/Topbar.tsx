import { LogOut, Menu as MenuIcon, Search, Settings, User as UserIcon, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { useTheme } from "../../app/providers/ThemeProvider.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { NotificationBell } from "../../features/notifications/NotificationBell.js";
import { OPEN_COMMAND_PALETTE_EVENT } from "../../features/search/CommandPalette.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";
import { ThemeToggle } from "./ThemeToggle.js";
import { Menu } from "../ui/Menu.js";
import { cn } from "../../lib/cn.js";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Mac reports "MacIntel"; everything else gets the Ctrl hint. */
const shortcutLabel =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

export function Topbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  const { liquid, setLiquid } = useTheme();
  const navigate = useNavigate();
  const avatarUrl = resolveProfileImageUrl(user?.avatar);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT))}
          className="flex min-w-0 items-center gap-2 rounded-pill bg-surface-2 px-4 py-2 text-sm text-fg-subtle transition-colors duration-150 hover:bg-surface-3 hover:text-fg-muted"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="ml-4 hidden rounded-pill bg-surface px-1.5 py-0.5 font-sans text-xs text-fg-subtle sm:inline">
            {shortcutLabel}
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLiquid(!liquid)}
          aria-pressed={liquid}
          aria-label={liquid ? "Turn off Liquid UI" : "Turn on Liquid UI"}
          title={liquid ? "Liquid UI on" : "Liquid UI off"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
            liquid ? "border-line bg-accent-soft text-accent" : "border-line text-fg-subtle hover:text-fg-muted",
          )}
        >
          <Waves className="h-4 w-4" />
        </button>
        <ThemeToggle />
        <NotificationBell />
        {user && (
          <Menu
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-pill py-1 pl-1 pr-2.5 transition-colors hover:bg-fg/[0.06]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-br from-accent to-accent-hover text-xs font-semibold text-accent-fg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(user.name || user.email) || "?"
                  )}
                </span>
                <span className="hidden text-sm text-fg-muted sm:inline">{user.name || user.email}</span>
              </button>
            }
            items={[
              { id: "profile", label: "View profile", icon: UserIcon, onSelect: () => navigate("/app/profile") },
              { id: "settings", label: "Settings", icon: Settings, onSelect: () => navigate("/app/settings/profile") },
              { id: "signout", label: "Sign out", icon: LogOut, danger: true, onSelect: () => void logout() },
            ]}
          />
        )}
      </div>
    </motion.header>
  );
}
