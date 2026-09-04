import { forwardRef } from "react";
import { Github, Globe, Linkedin, Twitter } from "lucide-react";
import type { CardTheme, SocialLinkKey } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";

export interface IdentityCardProfile {
  name: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  socialLinks: Partial<Record<SocialLinkKey, string>>;
}

const SOCIAL_LABELS: Record<SocialLinkKey, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  leetcode: "LeetCode",
  portfolio: "Portfolio",
  twitter: "X",
  kaggle: "Kaggle",
  medium: "Medium",
};

// lucide doesn't ship LeetCode/Kaggle/Medium marks — Globe is an honest
// generic fallback rather than a wrong icon.
const SOCIAL_ICONS: Partial<Record<SocialLinkKey, typeof Github>> = {
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
};

const THEME_CLASSES: Record<CardTheme, { card: string; name: string; headline: string; bio: string; chip: string; avatarRing: string }> = {
  minimal: {
    card: "border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900",
    name: "text-ink-900 dark:text-white",
    headline: "text-ink-500 dark:text-ink-400",
    bio: "text-ink-600 dark:text-ink-300",
    chip: "border-ink-200 bg-ink-50 text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300",
    avatarRing: "ring-ink-100 dark:ring-ink-700",
  },
  aurora: {
    card: "border border-violet-500/15 bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:border-violet-500/25 dark:from-[#160f2e] dark:via-[#0d0a17] dark:to-[#1a0f2e]",
    name: "text-ink-900 dark:text-white",
    headline: "text-violet-600 dark:text-violet-300",
    bio: "text-ink-600 dark:text-ink-300",
    chip: "border-violet-500/20 bg-violet-500/[0.07] text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200",
    avatarRing: "ring-violet-200 dark:ring-violet-500/30",
  },
  midnight: {
    card: "border border-white/10 bg-gradient-to-br from-[#0b0d1a] to-[#161a2e] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
    name: "text-white",
    headline: "text-brand-300",
    bio: "text-ink-300",
    chip: "border-white/10 bg-white/[0.06] text-ink-100",
    avatarRing: "ring-white/15",
  },
  // IdentityCard never renders with this theme in practice — the holographic
  // style is a separate component (HolographicIdentityCard). This entry only
  // exists so THEME_CLASSES satisfies Record<CardTheme, ...>.
  holographic: {
    card: "border border-white/10 bg-gradient-to-br from-[#0b0d1a] to-[#161a2e] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
    name: "text-white",
    headline: "text-brand-300",
    bio: "text-ink-300",
    chip: "border-white/10 bg-white/[0.06] text-ink-100",
    avatarRing: "ring-white/15",
  },
};

export const IdentityCard = forwardRef<HTMLDivElement, { profile: IdentityCardProfile; theme: CardTheme; className?: string }>(
  function IdentityCard({ profile, theme, className }, ref) {
    const t = THEME_CLASSES[theme];
    const links = (Object.entries(profile.socialLinks) as [SocialLinkKey, string][]).filter(([, url]) => url);
    const initials = profile.name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const avatarUrl = resolveProfileImageUrl(profile.avatar);

    return (
      <div
        ref={ref}
        className={cn("relative w-full max-w-sm overflow-hidden rounded-3xl p-7 text-center transition-all duration-300", t.card, className)}
      >
        {theme !== "minimal" && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl",
              theme === "aurora" ? "bg-violet-500/20" : "bg-brand-500/15",
            )}
          />
        )}

        <div className="relative flex flex-col items-center">
          <div className={cn("flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-4", t.avatarRing)}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-semibold text-white">
                {initials || "?"}
              </span>
            )}
          </div>

          <h3 className={cn("mt-4 text-lg font-bold", t.name)}>{profile.name}</h3>
          {profile.headline && <p className={cn("mt-0.5 text-sm font-medium", t.headline)}>{profile.headline}</p>}
          {profile.bio && <p className={cn("mt-3 text-sm leading-5", t.bio)}>{profile.bio}</p>}

          {links.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {links.map(([key]) => {
                const Icon = SOCIAL_ICONS[key] ?? Globe;
                return (
                  <span key={key} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", t.chip)}>
                    <Icon className="h-3 w-3" />
                    {SOCIAL_LABELS[key]}
                  </span>
                );
              })}
            </div>
          )}

          <div className={cn("mt-6 h-px w-full", theme === "midnight" ? "bg-white/10" : "bg-ink-200/70 dark:bg-ink-700")} />
          <p className={cn("mt-4 text-xs font-semibold tracking-wide", theme === "midnight" ? "text-ink-400" : "text-ink-400 dark:text-ink-500")}>
            believe.ai
          </p>
        </div>
      </div>
    );
  },
);
