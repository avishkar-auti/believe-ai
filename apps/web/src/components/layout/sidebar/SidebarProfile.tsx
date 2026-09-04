import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider.js";
import { useCurrentUser } from "../../../hooks/useCurrentUser.js";
import { resolveProfileImageUrl } from "../../../lib/profileImage.js";
import { Avatar } from "../../ui/Avatar.js";
import { Menu } from "../../ui/Menu.js";
import { Tooltip } from "../../ui/Tooltip.js";

/** Real authenticated-user info (never hard-coded), wrapped in the same
 * dropdown Topbar's profile menu already offers — View profile / Settings /
 * Sign out — so there's exactly one real logout mechanism, not a second one. */
export function SidebarProfile({ collapsed }: { collapsed: boolean }) {
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const avatarUrl = resolveProfileImageUrl(user.avatar);
  const items = [
    { id: "profile", label: "View profile", icon: UserIcon, onSelect: () => navigate("/app/profile") },
    { id: "settings", label: "Settings", icon: Settings, onSelect: () => navigate("/app/settings/profile") },
    { id: "signout", label: "Sign out", icon: LogOut, danger: true, onSelect: () => void logout() },
  ];

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <Tooltip label={user.name || user.email} side="right">
          <Menu
            align="start"
            trigger={
              <button type="button" className="rounded-pill transition-opacity hover:opacity-80">
                <Avatar name={user.name} email={user.email} avatarUrl={avatarUrl} className="h-8 w-8" />
              </button>
            }
            items={items}
          />
        </Tooltip>
      </div>
    );
  }

  return (
    <Menu
      align="start"
      className="w-full"
      trigger={
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-control px-2 py-2 text-left transition-colors hover:bg-fg/[0.05]"
        >
          <Avatar name={user.name} email={user.email} avatarUrl={avatarUrl} className="h-8 w-8" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-fg">{user.name || "Your account"}</span>
            <span className="block truncate text-[11px] text-fg-subtle">{user.email}</span>
          </span>
        </button>
      }
      items={items}
    />
  );
}
