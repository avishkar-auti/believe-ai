import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "../../components/ui/Logo.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const STATEMENT_WORDS = ["Learn.", "Build.", "Prepare.", "Connect.", "Grow."];

/** The auth pages' brand-story column — same headline language and word-by-
 * word accent treatment as the landing hero, so signing up/in feels like a
 * continuation of the same product, not a generic template. */
export function AuthHeroPanel({
  heading,
  showStatement = true,
  paragraph,
  children,
}: {
  heading: ReactNode;
  showStatement?: boolean;
  paragraph: string;
  children?: ReactNode;
}) {
  return (
    <motion.div initial="hidden" animate="show" variants={container} className="max-w-md">
      <motion.div variants={item}>
        <Logo size="lg" />
      </motion.div>

      <motion.h1
        variants={item}
        className="mt-6 text-[34px] font-semibold leading-[1.08] tracking-tight text-fg sm:text-[42px]"
      >
        {heading}
      </motion.h1>

      {showStatement && (
        <motion.p variants={item} className="mt-3 text-[20px] font-semibold leading-tight tracking-tight sm:text-[24px]">
          {STATEMENT_WORDS.map((word, i) => (
            <span key={word} className={i % 2 === 0 ? "text-accent" : "text-fg"}>
              {word}{" "}
            </span>
          ))}
        </motion.p>
      )}

      <motion.p variants={item} className="mt-4 text-[15px] leading-relaxed text-fg-muted">
        {paragraph}
      </motion.p>

      {children && (
        <motion.div variants={item} className="mt-8">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
