import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import believeIcon from "../../../../assets/brand/believe-icon.png";

const COSMIC_BG = "radial-gradient(ellipse at 50% 30%, #0B0918 0%, #05050B 55%, #030306 100%)";

/** Shared dark-cosmic chrome for both loading and empty states on the
 * public profile route — this replaces the old plain white spinner/error
 * page for every card style, not just the 3D one; it's a nicer default
 * regardless of which style a profile that fails to load would have used,
 * and there's no way to know that style anyway (the fetch never resolved). */
function CosmicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: COSMIC_BG }}>
      {children}
    </div>
  );
}

export function GalaxyLoadingState() {
  return (
    <CosmicShell>
      <motion.img
        src={believeIcon}
        alt=""
        className="h-10 w-10"
        animate={{ opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </CosmicShell>
  );
}

/** Covers both "private" and "not found" with one honest, generic message
 * — the backend deliberately can't distinguish them (same 404 either way),
 * since telling a stranger "this exists but is private" leaks more than a
 * flat "not available" does. See the plan's note on this. */
export function ProfileNotAvailable() {
  return (
    <CosmicShell>
      <div className="text-center">
        <img src={believeIcon} alt="" className="mx-auto h-9 w-9 opacity-70" />
        <h1 className="mt-5 text-lg font-semibold text-white">This identity isn&rsquo;t available</h1>
        <p className="mt-1.5 text-sm text-white/50">It may be private, or the link may be incorrect.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-pill border border-white/[0.08] bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-lg transition-all duration-150 hover:-translate-y-0.5 hover:border-white/[0.16]"
        >
          Create your believe.ai identity →
        </Link>
      </div>
    </CosmicShell>
  );
}
