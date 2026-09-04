import { motion, useReducedMotion } from "framer-motion";
import believePlane from "../../assets/brand/believe-icon-plane-only.png";
import believeSparkle from "../../assets/brand/believe-icon-sparkle-only.png";

const EASE = [0.22, 1, 0.36, 1] as const;

// Positions/sizes are the two layers' exact crop coordinates within the
// original 443×443 icon canvas — reassembling them at these offsets
// reproduces the single believe-icon.png pixel-for-pixel, just staged as
// two independently-animatable layers instead of one flat image.
const CANVAS = 443;
const PLANE = { x0: 27, y0: 32, w: 407, h: 378 };
const SPARKLE = { x0: 9, y0: 268, w: 122, h: 126 };

/** The believe.ai brand mark's full entrance choreography — plane settles
 * in, sparkle twinkles on shortly after, wordmark (with its purple dot)
 * fades in alongside. For splash/onboarding-welcome moments specifically,
 * not the everyday nav logo (see Logo.tsx) — replaying a multi-stage
 * reveal every time someone glances at the sidebar would be the opposite
 * of "calm." Respects prefers-reduced-motion with an opacity-only fallback. */
export function LogoReveal({
  size = 96,
  showWordmark = true,
  layout = "stacked",
  wordmarkClassName = "text-2xl font-bold tracking-tight",
}: {
  size?: number;
  showWordmark?: boolean;
  layout?: "stacked" | "horizontal";
  wordmarkClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const scale = size / CANVAS;

  const planeInitial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.94, x: -6, y: 9, rotate: -2 };
  const planeAnimate = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 };

  const sparkleInitial = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -8 };
  const sparkleAnimate = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: [0.5, 1.12, 1], rotate: [-8, 0, 0] };

  const wordInitial = reduceMotion ? { opacity: 0 } : { opacity: 0, x: -6 };
  const wordAnimate = { opacity: 1, x: 0 };

  const dotAnimate = reduceMotion ? { scale: 1 } : { scale: [0, 1.15, 1] };

  return (
    <div className={layout === "stacked" ? "flex flex-col items-center gap-3" : "flex items-center gap-2"}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <motion.img
          src={believePlane}
          alt=""
          initial={planeInitial}
          animate={planeAnimate}
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute"
          style={{
            left: PLANE.x0 * scale,
            top: PLANE.y0 * scale,
            width: PLANE.w * scale,
            height: PLANE.h * scale,
          }}
        />
        <motion.img
          src={believeSparkle}
          alt=""
          initial={sparkleInitial}
          animate={sparkleAnimate}
          transition={{ duration: 0.3, delay: 0.3, ease: EASE, times: [0, 0.6, 1] }}
          className="absolute"
          style={{
            left: SPARKLE.x0 * scale,
            top: SPARKLE.y0 * scale,
            width: SPARKLE.w * scale,
            height: SPARKLE.h * scale,
          }}
        />
      </div>

      {showWordmark && (
        <motion.span
          initial={wordInitial}
          animate={wordAnimate}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
          className={wordmarkClassName}
        >
          <span className="text-fg">believe</span>
          <motion.span
            initial={{ scale: 0 }}
            animate={dotAnimate}
            transition={{ duration: 0.3, delay: 0.5, times: [0, 0.6, 1] }}
            className="inline-block text-accent"
          >
            .
          </motion.span>
          <span className="text-fg">ai</span>
        </motion.span>
      )}
    </div>
  );
}
