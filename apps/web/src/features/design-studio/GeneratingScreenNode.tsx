import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Node, NodeProps } from "@xyflow/react";
import { RotateCw } from "lucide-react";
import type { DesignPlatform } from "@believe-ai/shared";
import { CARD_H, CARD_W, DEVICE_LABEL } from "./canvasLayout.js";
import { GENERATION_STAGES } from "./studioConfig.js";

const LABEL_H = 26;
const THUMB_H = CARD_H - LABEL_H;

export type GeneratingFlowNode = Node<
  {
    platform: DesignPlatform;
    label: string;
    failed?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onDismiss?: () => void;
  },
  "generatingNode"
>;

/** Placeholder that occupies the screen's final footprint while generation runs.
 * Structure is revealed progressively (frame → shell → regions → components) so
 * the canvas reads as "being constructed" without animating real DOM per node.
 * On failure the frame stays put with a retry affordance — the rest of the canvas
 * is untouched. */
export function GeneratingScreenNode({ data }: NodeProps<GeneratingFlowNode>) {
  const { platform, label, failed, error, onRetry, onDismiss } = data;
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (failed) return;
    const id = setInterval(() => setStage((s) => Math.min(s + 1, GENERATION_STAGES.length - 1)), 2600);
    return () => clearInterval(id);
  }, [failed]);

  return (
    <div className="relative" style={{ width: CARD_W }}>
      <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5" style={{ height: LABEL_H - 6 }}>
        <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-fg-muted">
          {!failed && (
            <motion.span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-[10px] font-medium text-fg-subtle">{DEVICE_LABEL[platform]}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className="relative overflow-hidden rounded-xl border border-line bg-surface-2 shadow-card"
        style={{ height: THUMB_H }}
      >
        {/* Restrained accent light sweep — no rainbow AI gradient. */}
        {!failed && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-accent-soft to-transparent"
            animate={{ x: ["-60%", "160%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-xs font-semibold text-fg">Couldn't finish this design</p>
            <p className="text-[11px] leading-relaxed text-fg-subtle">{error ?? "Your existing canvas is unchanged."}</p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-fg transition-colors duration-150 hover:bg-accent-hover"
              >
                <RotateCw className="h-3 w-3" /> Try again
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-pill px-2.5 py-1.5 text-[11px] font-medium text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex h-full flex-col gap-2 p-3">
            <Skeleton delay={0} className="h-4 w-full" />
            <div className="flex flex-1 gap-2">
              <Skeleton delay={0.35} className="h-full w-1/4" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton delay={0.7} className="h-1/3 w-full" />
                <div className="flex flex-1 gap-2">
                  <Skeleton delay={1.05} className="h-full flex-1" />
                  <Skeleton delay={1.25} className="h-full flex-1" />
                </div>
              </div>
            </div>
            <p className="absolute bottom-2 left-3 text-[10px] font-medium text-fg-subtle">{GENERATION_STAGES[stage]}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Skeleton({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className={`rounded-md bg-surface-4/80 ${className}`}
    />
  );
}
