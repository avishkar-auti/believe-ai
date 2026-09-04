import { Outlet } from "react-router-dom";

// Public Profile was folded into /app/profile's Edit Profile drawer and
// sidebar, leaving Account as the only settings section today — so this is
// just a pass-through for now rather than a single-item side nav. Add the
// nav back the moment a second section (Notifications, Security, ...) exists.
export function SettingsLayout() {
  return <Outlet />;
}
