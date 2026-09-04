import { forwardRef, useRef, useState, type PointerEvent } from "react";
import { Github, Globe, Linkedin, RotateCw, Twitter } from "lucide-react";
import { animate, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { SocialLinkKey } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";
import type { IdentityCardProfile } from "./IdentityCard.js";

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

// LinkedIn/GitHub lead the back face as prominent chips; everything else
// follows as smaller pills.
const BACK_ORDER: SocialLinkKey[] = ["linkedin", "github", "portfolio", "twitter", "leetcode", "kaggle", "medium"];

export const HolographicIdentityCard = forwardRef<HTMLDivElement, { profile: IdentityCardProfile; className?: string }>(
  function HolographicIdentityCard({ profile, className }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isFlipped, setIsFlipped] = useState(false);

    // Normalized pointer position within the card, 0..1 on each axis. Centered
    // (0.5, 0.5) is the resting/neutral position.
    const pointerX = useMotionValue(0.5);
    const pointerY = useMotionValue(0.5);
    const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };

    const tiltRotateX = useSpring(useTransform(pointerY, [0, 1], [10, -10]), springConfig);
    const tiltRotateY = useSpring(useTransform(pointerX, [0, 1], [-10, 10]), springConfig);

    // The 180° click-flip shares the same Y axis as the pointer tilt, so the
    // two rotations are summed rather than nested in separate transform layers.
    const flipRotate = useMotionValue(0);
    const combinedRotateY = useTransform([tiltRotateY, flipRotate], (latest) => {
      const [t, f] = latest as number[];
      return (t ?? 0) + (f ?? 0);
    });

    const xPct = useTransform(pointerX, [0, 1], [0, 100]);
    const yPct = useTransform(pointerY, [0, 1], [0, 100]);
    const glareOpacity = useMotionValue(0);
    const foilOpacity = useTransform(glareOpacity, [0, 1], [0, 0.35]);
    const glareBackground = useMotionTemplate`radial-gradient(circle at ${xPct}% ${yPct}%, rgba(255,255,255,0.9), transparent 55%)`;
    const foilBackgroundPosition = useMotionTemplate`${xPct}% ${yPct}%`;

    function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      pointerX.set((e.clientX - rect.left) / rect.width);
      pointerY.set((e.clientY - rect.top) / rect.height);
    }

    function handlePointerEnter() {
      animate(glareOpacity, 1, { duration: 0.3 });
    }

    function handlePointerLeave() {
      pointerX.set(0.5);
      pointerY.set(0.5);
      animate(glareOpacity, 0, { duration: 0.5 });
    }

    function handleClick() {
      const next = !isFlipped;
      setIsFlipped(next);
      animate(flipRotate, next ? 180 : 0, { type: "spring", stiffness: 300, damping: 30 });
    }

    const initials = profile.name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const summary = profile.headline || profile.bio;
    const avatarUrl = resolveProfileImageUrl(profile.avatar);

    const links = (Object.entries(profile.socialLinks) as [SocialLinkKey, string][])
      .filter(([, url]) => url)
      .sort((a, b) => BACK_ORDER.indexOf(a[0]) - BACK_ORDER.indexOf(b[0]));
    const primaryLinks = links.filter(([key]) => key === "linkedin" || key === "github");
    const otherLinks = links.filter(([key]) => key !== "linkedin" && key !== "github");

    return (
      <div style={{ perspective: 1500 }} className={cn("w-full max-w-sm", className)}>
        <motion.div
          ref={wrapperRef}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
          style={{ rotateX: tiltRotateX, rotateY: combinedRotateY, transformStyle: "preserve-3d" }}
          className="relative aspect-[5/7] w-full cursor-pointer select-none"
        >
          {/* FRONT — ref forwarded here so PNG export captures the card at rest */}
          <div
            ref={ref}
            className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0d1a] via-[#14152c] to-[#1c1030] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.65)] [backface-visibility:hidden]"
          >
            <div className="relative flex h-full flex-col items-center justify-between p-6 text-center">
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-white/20 shadow-lg sm:h-32 sm:w-32">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-fuchsia-600 text-3xl font-semibold text-white">
                      {initials || "?"}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">{profile.name}</h3>
                {summary && <p className="mt-2 line-clamp-2 text-sm leading-5 text-ink-200">{summary}</p>}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
                <RotateCw className="h-3 w-3" />
                tap to flip
              </div>
            </div>

            <motion.div
              aria-hidden="true"
              style={{ background: glareBackground, opacity: glareOpacity }}
              className="pointer-events-none absolute inset-0 mix-blend-overlay"
            />
            <motion.div
              aria-hidden="true"
              style={{ backgroundPosition: foilBackgroundPosition, opacity: foilOpacity }}
              className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(115deg,#ff5ecb_0%,#ffd45e_10%,#5eff8f_20%,#5ec8ff_30%,#c05eff_40%,#ff5ecb_50%)] [background-size:220%_220%] mix-blend-color-dodge"
            />
          </div>

          {/* BACK */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0d1a] via-[#14152c] to-[#1c1030] p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto">
                <div>
                  <h4 className="text-sm font-semibold text-white">{profile.name}</h4>
                  {profile.bio && <p className="mt-2 text-xs leading-5 text-ink-300">{profile.bio}</p>}
                </div>

                {primaryLinks.length > 0 && (
                  <div className="space-y-2">
                    {primaryLinks.map(([key, url]) => {
                      const Icon = SOCIAL_ICONS[key] ?? Globe;
                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.12]"
                        >
                          <Icon className="h-4 w-4" />
                          {SOCIAL_LABELS[key]}
                        </a>
                      );
                    })}
                  </div>
                )}

                {otherLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {otherLinks.map(([key, url]) => {
                      const Icon = SOCIAL_ICONS[key] ?? Globe;
                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-ink-200 transition hover:bg-white/[0.08]"
                        >
                          <Icon className="h-3 w-3" />
                          {SOCIAL_LABELS[key]}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="h-px w-full bg-white/10" />
                <p className="mt-4 text-center text-xs font-semibold tracking-wide text-ink-400">believe.ai</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  },
);
