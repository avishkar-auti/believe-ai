import { motion } from "framer-motion";
import type { Node, NodeProps } from "@xyflow/react";
import type { DesignScreenSummary } from "@believe-ai/shared";
import { CARD_W, CARD_H, NATIVE_W } from "./canvasLayout.js";
import { DesignRenderer } from "./DesignRenderer.js";

const LABEL_H = 28;
const THUMB_H = CARD_H - LABEL_H;

export type ScreenFlowNode = Node<{ screen: DesignScreenSummary }, "screenNode">;

/** Mirrors how the real Stitch canvas presents a screen: no card chrome
 * wrapping the content (no border/header bar) — just the rendered screen
 * itself, floating on the canvas with a shadow, with a small label above it.
 * Reuses DesignRenderer completely unmodified inside a fixed-size, clipped,
 * scaled wrapper — the thumbnail and the side panel's full preview are
 * guaranteed to render identically since it's the same component. */
export function ScreenNode({ data, selected }: NodeProps<ScreenFlowNode>) {
  const { screen } = data;
  const nativeWidth = NATIVE_W[screen.platform];
  const scale = CARD_W / nativeWidth;

  return (
    <div style={{ width: CARD_W }}>
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5" style={{ height: LABEL_H - 8 }}>
        <span className="truncate text-xs font-medium text-ink-300">{screen.title}</span>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-ink-500">{screen.platform}</span>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className={`overflow-hidden rounded-xl bg-white shadow-lift transition-shadow dark:bg-ink-800 ${
          selected ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-transparent" : ""
        }`}
        style={{ height: THUMB_H }}
      >
        <div className="pointer-events-none" style={{ width: nativeWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <DesignRenderer node={screen.dsl} />
        </div>
      </motion.div>
    </div>
  );
}
