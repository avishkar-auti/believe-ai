import { NavLink, Outlet } from "react-router-dom";
import { Sparkles, User } from "lucide-react";
import { cn } from "../../lib/cn.js";

// Just the two sections that actually exist today. Adding a new section
// later (Notifications, AI Memory, Security, ...) is a one-line addition
// here — deliberately not scaffolding stub pages for features that don't
// exist yet.
const NAV_ITEMS = [
  { to: "/app/settings/profile", label: "Profile", icon: User },
  { to: "/app/settings/public-profile", label: "Public Profile", icon: Sparkles },
];

export function SettingsLayout() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-500/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300"
                  : "text-ink-500 hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
