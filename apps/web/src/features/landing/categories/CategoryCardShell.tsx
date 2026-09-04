import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Shared chrome for the 6 product-category cards — icon/title/tool-list/CTA
 * stay consistent; each card fills the middle with its own unique mini
 * visualization (never identical internally, per the brief). CTA stays
 * visible by default and only gains emphasis on hover, rather than being
 * hover-only (no interaction should require hover to discover). */
export function CategoryCardShell({
  icon: Icon,
  title,
  tools,
  cta,
  children,
}: {
  icon: LucideIcon;
  title: string;
  tools: string[];
  cta: string;
  children: ReactNode;
}) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group flex h-full flex-col rounded-panel border border-line bg-surface p-6 transition-colors duration-150 hover:border-accent/30"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-fg-subtle">{tools.join(" · ")}</p>

      <div className="mt-4 flex-1">{children}</div>

      <button
        type="button"
        className="mt-4 flex items-center gap-1 text-[13px] font-medium text-accent"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>
    </motion.article>
  );
}
