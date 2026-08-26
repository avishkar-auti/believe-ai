import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Node, NodeProps } from "@xyflow/react";
import type { DesignPlatform } from "@believe-ai/shared";
import { CARD_H, CARD_W } from "./canvasLayout.js";

const LABEL_H = 28;
const THUMB_H = CARD_H - LABEL_H;

export type GeneratingFlowNode = Node<{ platform: DesignPlatform }, "generatingNode">;

/** Shown in place of a ScreenNode while a screen is being generated — mirrors the
 * observed Stitch sequence: a brief "Thinking…" pause, then "Generating Screen…"
 * with a glow blooming behind a borderless shimmering placeholder, matching
 * ScreenNode's label-above/no-chrome presentation so the swap to real content
 * doesn't jump. */
export function GeneratingScreenNode({ data }: NodeProps<GeneratingFlowNode>) {
  const { platform } = data;
  const [phase, setPhase] = useState<"thinking" | "generating">("thinking");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("generating"), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative" style={{ width: CARD_W }}>
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5" style={{ height: LABEL_H - 8 }}>
        <span className="flex items-center gap-1.5 truncate text-xs font-medium text-ink-300">
          <motion.span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
          {phase === "thinking" ? "Thinking…" : "Generating Screen…"}
        </span>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-ink-500">{platform}</span>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-full bg-gradient-to-br from-brand-500/40 via-fuchsia-500/30 to-transparent blur-2xl"
        animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="relative animate-shimmer overflow-hidden rounded-xl bg-gradient-to-tr from-ink-800 via-ink-600 to-ink-800 bg-[length:200%_100%] shadow-lift"
        style={{ height: THUMB_H }}
      />
    </div>
  );
}
