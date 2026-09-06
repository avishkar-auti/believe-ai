import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/cn.js";
import { fadeReveal } from "../../lib/modernMotion.js";

/**
 * The one surface primitive for Modern. Everything on a Modern page is one
 * of these — depth comes from surface luminance and border contrast rather
 * than drop shadows, which read as muddy smudges on a near-black canvas.
 *
 * All colours resolve from the shared semantic tokens (--surface, --line,
 * --accent), so a single card definition covers Modern Light and Modern Dark
 * without a second set of classes.
 */
interface ModernCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  /** Lifts on hover and takes a pointer cursor — for cards that navigate. */
  interactive?: boolean;
  /** Pointer-tracked light. Reserve it for one or two hero surfaces a page;
   * on every card it becomes noise. */
  spotlight?: boolean;
  /** Opts into a parent's stagger sequence instead of animating on its own. */
  reveal?: boolean;
  children?: ReactNode;
}

export function ModernCard({ interactive, spotlight, reveal, className, children, ...props }: ModernCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!spotlight || prefersReducedMotion) return;
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Written as CSS variables rather than React state so a pointer move
    // never triggers a re-render.
    el.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  }

  return (
    <motion.div
      ref={innerRef}
      variants={reveal ? fadeReveal : undefined}
      onPointerMove={handlePointerMove}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface",
        "transition-[transform,border-color,background-color] duration-[var(--modern-surface-transition)]",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {spotlight && !prefersReducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [background:radial-gradient(420px_circle_at_var(--mouse-x)_var(--mouse-y),rgb(var(--accent)/0.10),transparent_40%)] group-hover:opacity-100"
        />
      )}
      {children}
    </motion.div>
  );
}

/** Section heading used above a group of cards. */
export function ModernSectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">{children}</h2>
      {action}
    </div>
  );
}
