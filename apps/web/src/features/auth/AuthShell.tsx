import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AmbientBackground } from "../../components/layout/AmbientBackground.js";

/** Shared split-screen shell for /login and /signup — brand story on the
 * left, the form card next to it, and (desktop-only) a floating ecosystem
 * preview column when one is passed. Falls back to a clean two-column
 * layout when `preview` is omitted (sign-in embeds its snapshot in the hero
 * column instead).
 *
 * Hero, form, and preview are one tight, centered composition (fixed gaps,
 * no flex-grow spacers) rather than pinned to opposite edges of the
 * viewport — on a very wide screen, `justify-between` with a flex-growing
 * hero left the hero text stranded on the left with a huge dead gap before
 * the form, since the hero's own content never filled the space it grew
 * into. Centering the whole group instead keeps hero and form visually
 * connected at every width, with the extra space landing symmetrically on
 * both sides instead of pooling in the middle.
 *
 * Light-only by design (brief-mandated) — `theme-light` locally overrides
 * the semantic tokens regardless of the app-wide theme, so there's no
 * toggle here to switch it back to dark.
 *
 * The form's `lg:w-[440px]` is deliberate, not redundant with `max-w-[440px]`:
 * a flex item with `width: 100%` inside an auto-sized flex container (its
 * parent here is `lg:w-auto`) is a classic CSS circularity — the browser has
 * nothing concrete to resolve 100% against, so it collapsed to a fraction of
 * the intended width instead of the full 440px. A concrete pixel width at
 * the desktop breakpoint sidesteps that entirely. */
export function AuthShell({ hero, preview, children }: { hero: ReactNode; preview?: ReactNode; children: ReactNode }) {
  return (
    <div className="theme-light relative min-h-screen bg-surface px-4 py-10 sm:px-6 lg:py-12">
      <AmbientBackground />

      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-pill border border-line bg-surface/80 px-3 py-1.5 text-xs font-medium text-fg-subtle backdrop-blur transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>
      </div>

      <div className="mx-auto mt-14 flex min-h-[calc(100vh-9rem)] max-w-6xl flex-col items-center justify-center gap-12 sm:mt-16 lg:flex-row lg:gap-16">
        <div className="w-full lg:w-auto lg:shrink-0">{hero}</div>

        <div className="flex w-full flex-col items-center gap-10 lg:w-auto lg:flex-row lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[440px] lg:w-[440px] lg:shrink-0"
          >
            {children}
          </motion.div>

          {preview && <div className="hidden w-64 shrink-0 flex-col gap-3 xl:flex">{preview}</div>}
        </div>
      </div>
    </div>
  );
}
