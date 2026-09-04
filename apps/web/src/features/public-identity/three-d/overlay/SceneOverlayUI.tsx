import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { animate, createTimeline } from "animejs";
import { Check, Copy } from "lucide-react";
import believeIcon from "../../../../assets/brand/believe-icon.png";

/** Minimal chrome around the scene — the galaxy and card are the product.
 * Each element gets its own staggered Anime.js reveal (brand mark, copy
 * button, CTA) instead of one blanket Framer Motion fade, so the overlay
 * choreography actually matches the brief's phased entrance rather than
 * popping in as a single block. Copy-link keeps the same clipboard pattern
 * ShareProfileModal.tsx already uses (write, flash "Copied" for 2s, fail
 * quietly if the clipboard API is unavailable). Ref accesses below are
 * non-null-asserted deliberately: every call site runs post-mount (a
 * useEffect body, or a DOM event handler that can only fire once the
 * element exists), so `.current` is always populated in practice. */
export function SceneOverlayUI({ username, reducedMotion }: { username: string; reducedMotion: boolean }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/u/${username}`;

  const brandRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const copyIconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      const timeline = createTimeline({ defaults: { ease: "outQuad" } }).add(
        [brandRef.current!, copyRef.current!, ctaRef.current!],
        { opacity: [0, 1], duration: 250 },
      );
      return () => {
        timeline.revert();
      };
    }
    const timeline = createTimeline({ defaults: { ease: "outExpo" } })
      .add(brandRef.current!, { opacity: [0, 0.75], translateX: [-8, 0], duration: 500 }, 1100)
      .add(copyRef.current!, { opacity: [0, 1], translateY: [-6, 0], duration: 450 }, 1150)
      .add(ctaRef.current!, { opacity: [0, 1], translateY: [10, 0], duration: 500 }, 1300);
    return () => {
      timeline.revert();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!copyIconRef.current) return;
    animate(copyIconRef.current, { scale: [0.85, 1], opacity: [0, 1], duration: 200, ease: "outQuad" });
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied/unavailable — fail quietly.
    }
  }

  function handleCtaEnter() {
    animate(ctaRef.current!, { translateY: -2, duration: 200, ease: "outQuad" });
    animate(arrowRef.current!, { translateX: 3, duration: 200, ease: "outQuad" });
  }
  function handleCtaLeave() {
    animate(ctaRef.current!, { translateY: 0, duration: 200, ease: "outQuad" });
    animate(arrowRef.current!, { translateX: 0, duration: 200, ease: "outQuad" });
  }
  function handleCopyEnter() {
    animate(copyRef.current!, { scale: 1.04, duration: 150, ease: "outQuad" });
  }
  function handleCopyLeave() {
    animate(copyRef.current!, { scale: 1, duration: 150, ease: "outQuad" });
  }
  function handleCopyDown() {
    animate(copyRef.current!, { scale: 0.96, duration: 90, ease: "outQuad" });
  }
  function handleCopyUp() {
    animate(copyRef.current!, { scale: 1.04, duration: 120, ease: "outQuad" });
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        ref={brandRef}
        className="pointer-events-auto absolute left-4 top-4 flex items-center gap-2 opacity-0 sm:left-6 sm:top-6"
      >
        <img src={believeIcon} alt="" className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-tight text-white">believe.ai</span>
      </div>

      <button
        ref={copyRef}
        type="button"
        onClick={() => void handleCopy()}
        onMouseEnter={handleCopyEnter}
        onMouseLeave={handleCopyLeave}
        onMouseDown={handleCopyDown}
        onMouseUp={handleCopyUp}
        className="pointer-events-auto absolute right-4 top-4 flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 opacity-0 backdrop-blur-md sm:right-6 sm:top-6"
      >
        <span ref={copyIconRef} className="inline-flex items-center gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </span>
      </button>

      <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2">
        <Link
          ref={ctaRef}
          to="/signup"
          onMouseEnter={handleCtaEnter}
          onMouseLeave={handleCtaLeave}
          className="inline-flex items-center gap-1.5 rounded-pill border border-white/[0.08] bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/90 opacity-0 backdrop-blur-lg"
        >
          Create your own believe.ai identity
          <span ref={arrowRef} className="inline-block">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
