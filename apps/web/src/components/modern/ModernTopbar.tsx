import { LogOut, Menu as MenuIcon, Search, Settings, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { NotificationBell } from "../../features/notifications/NotificationBell.js";
import { OPEN_COMMAND_PALETTE_EVENT } from "../../features/search/CommandPalette.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";
import { AppearanceToggle } from "../layout/AppearanceToggle.js";
import { Menu } from "../ui/Menu.js";
import { MODERN_MOTION } from "../../lib/modernMotion.js";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Mac reports "MacIntel"; everything else gets the Ctrl hint. */
const shortcutLabel = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

export function ModernTopbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const avatarUrl = resolveProfileImageUrl(user?.avatar);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MODERN_MOTION.duration.medium, ease: MODERN_MOTION.ease.smooth }}
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/70 px-4 backdrop-blur-xl sm:px-6"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-fg/[0.06] hover:text-fg md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT))}
          className="group flex min-w-0 max-w-md flex-1 items-center gap-2.5 rounded-[var(--radius-md)] border border-line bg-surface/70 px-3.5 py-2 text-[13px] text-fg-subtle transition-colors duration-150 hover:border-line-strong hover:text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Search className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-[1.03]" />
          <span className="hidden truncate sm:inline">Search jobs, notes, or ask Believe.ai…</span>
          <span className="truncate sm:hidden">Search…</span>
          <kbd className="ml-auto hidden shrink-0 rounded-[var(--radius-xs)] border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] text-fg-subtle sm:inline">
            {shortcutLabel}
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <AppearanceToggle />
        <NotificationBell />
        {user && (
          <Menu
            trigger={
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] py-1 pl-1 pr-2 transition-colors hover:bg-fg/[0.06]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-accent-hover text-[11px] font-semibold text-accent-fg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(user.name || user.email) || "?"
                  )}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-[13px] font-medium leading-tight text-fg">{user.name || user.email}</span>
                  {user.headline && <span className="block truncate text-[11px] leading-tight text-fg-subtle">{user.headline}</span>}
                </span>
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
