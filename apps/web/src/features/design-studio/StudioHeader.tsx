import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, LogOut, Search, Settings, Sparkles, User as UserIcon } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider.js";
import { AppearanceToggle } from "../../components/layout/AppearanceToggle.js";
import { Badge } from "../../components/ui/Badge.js";
import { Menu } from "../../components/ui/Menu.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";

function initialsOf(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const shortcutLabel = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

/** Design Studio's own compact header — the studio bypasses DashboardLayout
 * entirely (see the router comment in app/router/index.tsx), so it supplies
 * its own back-navigation, search, theme toggle and account menu rather
 * than inheriting Topbar.tsx's. */
export function StudioHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const avatarUrl = resolveProfileImageUrl(user?.avatar);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
          <Sparkles className="h-4 w-4 text-accent" />
          Believe <span className="text-fg-subtle">/</span> Design Studio
        </span>
        <Badge tone="accent">Beta</Badge>
      </div>

      <nav className="hidden items-center gap-6 text-sm font-medium text-fg-muted md:flex">
        <span className="border-b-2 border-accent pb-0.5 text-fg">Projects</span>
        <a href="#explore-ideas" className="pb-0.5 transition-colors hover:text-fg">
          Templates
        </a>
        <Link to="/app/community" className="pb-0.5 transition-colors hover:text-fg">
          Community
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search your designs"
          title={`Search (${shortcutLabel})`}
          className="flex h-9 w-9 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Search className="h-4 w-4" />
        </button>
        <Link
          to="/app/how-to-use"
          aria-label="Help"
          title="Help"
          className="flex h-9 w-9 items-center justify-center rounded-pill text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <HelpCircle className="h-4 w-4" />
        </Link>
        <AppearanceToggle />
        {user && (
          <Menu
            trigger={
              <button type="button" className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-br from-accent to-accent-hover text-xs font-semibold text-accent-fg">
                {avatarUrl ? <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : initialsOf(user.name || user.email) || "?"}
              </button>
            }
            items={[
              { id: "profile", label: "View profile", icon: UserIcon, onSelect: () => navigate("/app/profile") },
              { id: "settings", label: "Settings", icon: Settings, onSelect: () => navigate("/app/settings/profile") },
              { id: "signout", label: "Sign out", icon: LogOut, danger: true, onSelect: () => void logout() },
            ]}
          />
        )}
        <Link
          to="/app"
          className="ml-1 hidden items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-xs font-medium text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg lg:inline-flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Believe.ai
        </Link>
      </div>
    </header>
  );
}
