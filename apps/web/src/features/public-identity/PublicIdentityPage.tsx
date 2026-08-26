import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Github, Globe, Linkedin, Twitter } from "lucide-react";
import type { SocialLinkKey } from "@believe-ai/shared";
import { Spinner } from "../../components/ui/Spinner.js";
import { IdentityCard } from "../settings/IdentityCard.js";
import { HolographicIdentityCard } from "../settings/HolographicIdentityCard.js";
import { fetchPublicProfile } from "./publicIdentityApi.js";

const SOCIAL_LABELS: Record<SocialLinkKey, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  leetcode: "LeetCode",
  portfolio: "Portfolio",
  twitter: "X",
  kaggle: "Kaggle",
  medium: "Medium",
};

const SOCIAL_ICONS: Partial<Record<SocialLinkKey, typeof Github>> = {
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
};

export function PublicIdentityPage() {
  const { username = "" } = useParams();
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: () => fetchPublicProfile(username),
    retry: false,
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-16 dark:bg-ink-950">
      {isLoading ? (
        <Spinner className="h-6 w-6 text-ink-400" />
      ) : isError || !profile ? (
        <div className="text-center">
          <p className="text-lg font-medium text-ink-800 dark:text-ink-100">This profile isn't available.</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">It may be private, or the link may be incorrect.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
            Go to believe.ai
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          {profile.cardTheme === "holographic" ? (
            <HolographicIdentityCard profile={profile} />
          ) : (
            <IdentityCard profile={profile} theme={profile.cardTheme} />
          )}

          {profile.cardTheme !== "holographic" && Object.entries(profile.socialLinks).filter(([, url]) => url).length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(Object.entries(profile.socialLinks) as [SocialLinkKey, string][])
                .filter(([, url]) => url)
                .map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key] ?? Globe;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
                    >
                      <Icon className="h-4 w-4" />
                      {SOCIAL_LABELS[key]}
                    </a>
                  );
                })}
            </div>
          )}

          <Link
            to="/signup"
            className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-2px_rgba(67,83,255,0.45)] transition-all duration-150 hover:scale-[1.02]"
          >
            Get your own believe.ai identity
          </Link>
        </div>
      )}
    </div>
  );
}
