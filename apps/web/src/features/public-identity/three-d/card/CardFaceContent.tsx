import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Github, Globe, Linkedin, MapPin, RotateCw, Twitter } from "lucide-react";
import type { PublicProfile, SocialLinkKey } from "@believe-ai/shared";
import { resolveProfileImageUrl } from "../../../../lib/profileImage.js";
import { cn } from "../../../../lib/cn.js";
import believeIcon from "../../../../assets/brand/believe-icon.png";
import { PALETTE } from "../palette.js";

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

const BACK_ORDER: SocialLinkKey[] = ["linkedin", "github", "portfolio", "twitter", "leetcode", "kaggle", "medium"];

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CARD_SIZE = "flex h-[500px] w-[340px] flex-col overflow-hidden rounded-[26px] p-6 text-white sm:h-[540px] sm:w-[370px]";

const CHAKRA_RING_GRADIENT = `conic-gradient(from 0deg, ${PALETTE.red.core}, ${PALETTE.violet.crossover}, ${PALETTE.blue.core}, ${PALETTE.violet.crossover}, ${PALETTE.red.core})`;

/** Barely-there geometric seal — a nod to the brief's "shinobi-style
 * circular seal" motif without risking literal characters I can't be sure
 * are correct. Pure decoration: opacity stays low enough that it reads as
 * texture, not content. */
function SealMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="48" cy="48" r="3" fill="currentColor" />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = 48 + Math.cos(angle) * 34;
        const y1 = 48 + Math.sin(angle) * 34;
        const x2 = 48 + Math.cos(angle) * 44;
        const y2 = 48 + Math.sin(angle) * 44;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" />;
      })}
    </svg>
  );
}

/** The face content is genuinely just DOM — rendered onto the 3D card via
 * drei's <Html transform>, not baked into a texture, so the text stays
 * crisp at any viewing distance/angle. Mirrors HolographicIdentityCard's
 * content exactly (same profile fields, same optional-field rule) — this
 * is that same information, presented on a real 3D face instead of a
 * CSS-flipped div. */
export function CardFrontContent({ profile, showHint }: { profile: PublicProfile; showHint: boolean }) {
  const avatarUrl = resolveProfileImageUrl(profile.avatar);

  return (
    <div className={cn(CARD_SIZE, "relative")}>
      <SealMotif className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 text-white opacity-[0.06]" />

      <img src={believeIcon} alt="" className="h-5 w-5 opacity-70" />

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <div
            className="absolute -inset-[3px] rounded-full opacity-80 blur-[2px] animate-[spin_7s_linear_infinite]"
            style={{ background: CHAKRA_RING_GRADIENT }}
          />
          <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-black/40">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7C4DFF] to-[#C042FF] text-3xl font-semibold">
                {initialsOf(profile.name) || "?"}
              </span>
            )}
          </div>
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight">{profile.name}</h1>
        {profile.headline && (
          <p
            className="mt-1 bg-gradient-to-r from-[#A78BFA] to-[#7DB4FF] bg-clip-text text-sm font-medium text-transparent"
          >
            {profile.headline}
          </p>
        )}
        {profile.location && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-white/50">
            <MapPin className="h-3 w-3" />
            {profile.location}
          </p>
        )}
        {profile.bio && <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/60">{profile.bio}</p>}
      </div>

      <div
        className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/45 [animation:hint-in_650ms_cubic-bezier(0.16,1,0.3,1)_1.3s_both] transition-opacity duration-500"
        style={{ opacity: showHint ? 0.5 : 0.12 }}
      >
        <RotateCw className="h-3 w-3" />
        <span className="hidden sm:inline">Drag to explore</span>
        <span className="sm:hidden">Swipe to explore</span>
      </div>
      <style>{"@keyframes hint-in { from { transform: translateY(6px); } to { transform: translateY(0); } }"}</style>
    </div>
  );
}

export function CardBackContent({ profile, publicUrl }: { profile: PublicProfile; publicUrl: string }) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCanvasRef.current) {
      void QRCode.toCanvas(qrCanvasRef.current, publicUrl, { width: 96, margin: 1, color: { dark: "#e9e5ff", light: "#00000000" } });
    }
  }, [publicUrl]);

  const links = (Object.entries(profile.socialLinks) as [SocialLinkKey, string][])
    .filter(([, url]) => url)
    .sort((a, b) => BACK_ORDER.indexOf(a[0]) - BACK_ORDER.indexOf(b[0]));
  const primaryLinks = links.filter(([key]) => key === "linkedin" || key === "github");
  const otherLinks = links.filter(([key]) => key !== "linkedin" && key !== "github");

  return (
    <div className={cn(CARD_SIZE, "relative")}>
      <SealMotif className="pointer-events-none absolute -left-5 -top-5 h-24 w-24 text-white opacity-[0.05]" />

      <img src={believeIcon} alt="" className="h-5 w-5 opacity-70" />

      <div className="mt-4 flex-1 space-y-4 overflow-hidden">
        <div>
          <h2 className="text-base font-semibold">{profile.name}</h2>
          {profile.headline && <p className="mt-0.5 text-xs text-white/60">{profile.headline}</p>}
          {profile.bio && <p className="mt-2 line-clamp-4 text-xs leading-5 text-white/70">{profile.bio}</p>}
        </div>

        {primaryLinks.length > 0 && (
          <div className="space-y-1.5">
            {primaryLinks.map(([key, url]) => {
              const Icon = SOCIAL_ICONS[key] ?? Globe;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.12]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {SOCIAL_LABELS[key]}
                </a>
              );
            })}
          </div>
        )}

        {otherLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {otherLinks.map(([key, url]) => {
              const Icon = SOCIAL_ICONS[key] ?? Globe;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/[0.08]"
                >
                  <Icon className="h-3 w-3" />
                  {SOCIAL_LABELS[key]}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <p className="min-w-0 truncate text-[11px] text-white/50">believe.ai/u/{profile.username}</p>
        <canvas ref={qrCanvasRef} className="h-10 w-10 shrink-0 rounded" />
      </div>
    </div>
  );
}
