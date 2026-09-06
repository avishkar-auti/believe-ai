import { forwardRef, useRef, type PointerEvent } from "react";
import { Building2, ExternalLink, Github, Linkedin, MapPin } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { SocialLinkKey } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { resolveProfileImageUrl } from "../../lib/profileImage.js";

export interface ModernIdentityCardProfile {
  name: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  socialLinks: Partial<Record<SocialLinkKey, string>>;
  skills: string[];
}

const MAX_VISIBLE_SKILLS = 4;

/** "https://www.linkedin.com/in/user/" -> "linkedin.com/in/user" — a display
 * nicety only; the real href keeps the original URL untouched. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
}

export const ModernIdentityCard = forwardRef<HTMLDivElement, { profile: ModernIdentityCardProfile; className?: string }>(
  function ModernIdentityCard({ profile, className }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    // Normalized pointer position, -0.5..0.5 on each axis — 0,0 is centered/resting.
    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const springConfig = { stiffness: 150, damping: 22, mass: 0.6 };
    const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [2, -2]), springConfig);
    const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-3, 3]), springConfig);

    function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
      if (prefersReducedMotion) return;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
      pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
    }

    function handlePointerLeave() {
      pointerX.set(0);
      pointerY.set(0);
    }

    const avatarUrl = resolveProfileImageUrl(profile.avatar);
    const initials = profile.name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const linkedin = profile.socialLinks.linkedin;
    const github = profile.socialLinks.github;
    const hasSocialHeader = Boolean(linkedin || github);

    const visibleSkills = profile.skills.slice(0, MAX_VISIBLE_SKILLS);
    const overflowSkillCount = profile.skills.length - visibleSkills.length;

    const statCells = [
      profile.skills.length > 0 ? { label: "SKILLS", value: String(profile.skills.length) } : null,
      profile.headline ? { label: "CORE FOCUS", value: profile.headline } : null,
    ].filter((c): c is { label: string; value: string } => c !== null);

    const hasInfoPanel = Boolean(profile.company || profile.location);

    return (
      <div style={{ perspective: 1400 }} className={cn("relative w-full max-w-[440px]", className)}>
        {/* Decorative offset copies — desktop only, purely visual. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden -rotate-6 translate-x-[-8%] translate-y-[3%] rounded-[30px] border border-[rgba(0,174,239,0.15)] bg-[#081219] opacity-20 lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden rotate-6 translate-x-[8%] translate-y-[4%] rounded-[30px] border border-[rgba(0,174,239,0.15)] bg-[#081219] opacity-15 lg:block"
        />

        <motion.div
          ref={wrapperRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          initial={{ opacity: 0, y: 22, scale: 0.975 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={prefersReducedMotion ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative overflow-hidden rounded-[30px] border border-[rgba(0,174,239,0.4)] bg-[linear-gradient(155deg,rgba(11,25,33,0.99),rgba(5,12,17,0.99))] p-7 shadow-[0_35px_90px_rgba(0,0,0,0.55),0_0_60px_rgba(0,174,239,0.035)]"
        >
          <div ref={ref} className="relative">
            {hasSocialHeader && (
              <>
                <div className="flex flex-col gap-2 pb-2">
                  {linkedin && (
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex min-w-0 items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#0A9BD8]">
                        <Linkedin className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="truncate font-mono text-[12px] font-medium text-white/48">{displayUrl(linkedin)}</span>
                    </a>
                  )}
                  {github && (
                    <a
                      href={github}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex min-w-0 items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-white/10 bg-white/[0.06]">
                        <Github className="h-3.5 w-3.5 text-[#F4F6F8]" />
                      </span>
                      <span className="truncate font-mono text-[12px] font-medium text-white/43 transition-colors hover:text-white/75">
                        {displayUrl(github)}
                      </span>
                    </a>
                  )}
                </div>
                <div className="h-px w-full bg-white/[0.055]" />
              </>
            )}

            <div className={cn("flex flex-col items-center text-center", hasSocialHeader ? "pt-6" : "pt-1")}>
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#00AEEF] shadow-[0_0_0_4px_rgba(0,174,239,0.07),0_8px_25px_rgba(0,0,0,0.35)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`${profile.name}'s profile picture`} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-semibold text-white">
                    {initials || "?"}
                  </span>
                )}
              </div>

              <h3 className="mt-3.5 text-[25px] font-bold tracking-[-0.025em] text-[#F5F7F9]">{profile.name}</h3>
              {profile.company && <p className="mt-0.5 font-mono text-[14px] font-semibold text-[#00AEEF]">@{profile.company}</p>}
              {profile.bio && <p className="mx-auto mt-3 line-clamp-3 max-w-[330px] text-[13.5px] leading-[1.55] text-white/45">{profile.bio}</p>}

              {statCells.length > 0 && (
                <div className={cn("mt-5 grid w-full gap-2.5", statCells.length === 2 ? "grid-cols-2" : "mx-auto max-w-[60%] grid-cols-1")}>
                  {statCells.map((cell) => (
                    <div key={cell.label} className="rounded-[17px] border border-white/[0.06] bg-white/[0.018] px-3 py-3.5 text-center">
                      <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.08em] text-white/30">{cell.label}</p>
                      <p className="mt-1 truncate text-[13px] font-[650] text-[#00AEEF]">{cell.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {hasInfoPanel && (
                <div className="mt-3 flex w-full flex-col gap-2 rounded-[17px] border border-white/[0.03] bg-black/24 p-4">
                  {profile.company && (
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                      <span className="truncate font-mono text-[11.5px] text-white/48">{profile.company}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                      <span className="truncate font-mono text-[11.5px] text-white/48">{profile.location}</span>
                    </div>
                  )}
                </div>
              )}

              {visibleSkills.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                  {visibleSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-[7px] border border-[rgba(0,174,239,0.18)] bg-[rgba(0,174,239,0.06)] px-2 py-1 font-mono text-[10px] font-semibold text-[rgba(65,200,250,0.8)] transition-all duration-150 hover:-translate-y-px hover:border-[rgba(0,174,239,0.34)] hover:bg-[rgba(0,174,239,0.1)]"
                    >
                      {skill}
                    </span>
                  ))}
                  {overflowSkillCount > 0 && (
                    <span className="rounded-[7px] border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] font-semibold text-white/40">
                      +{overflowSkillCount}
                    </span>
                  )}
                </div>
              )}

              {hasSocialHeader && (
                <div className="mt-5 flex w-full flex-col gap-2.5">
                  {linkedin && (
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex h-[52px] w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-[#00AEEF] to-[#0098DD] text-[13.5px] font-[650] text-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,174,239,0.2)] active:scale-[.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Connect on LinkedIn
                      <ExternalLink className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-px group-hover:-translate-y-px" />
                    </a>
                  )}
                  {github && (
                    <a
                      href={github}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex h-[50px] w-full items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.025] text-[13.5px] font-medium text-white/85 transition-all duration-150 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.055] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-[.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
                    >
                      <Github className="h-4 w-4" />
                      View GitHub
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  },
);
