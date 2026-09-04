import { cn } from "../../lib/cn.js";

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/** The one avatar pattern in the product — real image via `avatarUrl` (already
 * resolved through resolveProfileImageUrl by the caller) with an initials
 * fallback derived from name, then email. Default size matches Topbar's
 * original 28px trigger; pass className to override (e.g. Sidebar's 32px). */
export function Avatar({
  name,
  email,
  avatarUrl,
  className,
}: {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
}) {
  const label = name || email || "";
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-gradient-to-br from-accent to-accent-hover text-xs font-semibold text-accent-fg",
        className,
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={label} className="h-full w-full object-cover" />
      ) : (
        initialsOf(label)
      )}
    </span>
  );
}
