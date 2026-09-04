import { motion } from "framer-motion";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Copy, MoreHorizontal, Play, Smartphone, Sparkles, Trash2, Wand2 } from "lucide-react";
import type { DesignScreenSummary } from "@believe-ai/shared";
import { CARD_W, CARD_H, DEVICE_LABEL, NATIVE_W } from "./canvasLayout.js";
import { DesignRenderer } from "./DesignRenderer.js";
import { cn } from "../../lib/cn.js";

const LABEL_H = 26;
const THUMB_H = CARD_H - LABEL_H;

export interface ScreenNodeActions {
  onEdit: (id: string) => void;
  onVariation: (id: string) => void;
  onMobile: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onMore: (id: string, anchor: { x: number; y: number }) => void;
}

export type ScreenFlowNode = Node<{ screen: DesignScreenSummary; actions: ScreenNodeActions }, "screenNode">;

/** A screen on the canvas: the rendered design itself with its label outside the
 * frame, and a floating toolbar that only materialises on hover/selection. Every
 * toolbar action maps to a real API call. */
export function ScreenNode({ data, selected }: NodeProps<ScreenFlowNode>) {
  const { screen, actions } = data;
  const nativeWidth = NATIVE_W[screen.platform];
  const scale = CARD_W / nativeWidth;

  return (
    <div className="group relative" style={{ width: CARD_W }}>
      {/* Invisible connection points keep prototype flow edges attachable
          without adding visual noise to the frame. */}
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />

      <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5" style={{ height: LABEL_H - 6 }}>
        <span className={cn("truncate text-xs font-medium", selected ? "text-fg" : "text-fg-muted")}>{screen.title}</span>
        <span className="shrink-0 text-[10px] font-medium text-fg-subtle">{DEVICE_LABEL[screen.platform]}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className={cn(
          "overflow-hidden rounded-xl bg-white shadow-card transition-shadow duration-200 group-hover:shadow-lift",
          selected && "outline outline-[1.5px] outline-offset-2 outline-accent",
        )}
        style={{ height: THUMB_H }}
      >
        <div
          className="pointer-events-none"
          style={{ width: nativeWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <DesignRenderer node={screen.dsl} />
        </div>
      </motion.div>

      <div
        className={cn(
          "absolute -bottom-11 left-1/2 z-10 -translate-x-1/2 translate-y-1 scale-[0.97] opacity-0 transition-all duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
          "group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 focus-within:translate-y-0 focus-within:scale-100 focus-within:opacity-100",
          selected && "translate-y-0 scale-100 opacity-100",
        )}
      >
        <div className="flex items-center gap-0.5 rounded-pill border border-line bg-surface-3/95 p-1 shadow-lift backdrop-blur-[var(--liquid-blur-md)]">
          <ToolbarButton label="Refine with AI" onClick={() => actions.onEdit(screen.id)}>
            <Wand2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Create variation" onClick={() => actions.onVariation(screen.id)}>
            <Sparkles className="h-3.5 w-3.5" />
          </ToolbarButton>
          {screen.platform === "web" && (
            <ToolbarButton label="Generate mobile version" onClick={() => actions.onMobile(screen.id)}>
              <Smartphone className="h-3.5 w-3.5" />
            </ToolbarButton>
          )}
          <ToolbarButton label="Preview" onClick={() => actions.onPreview(screen.id)}>
            <Play className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Duplicate as new generation" onClick={() => actions.onVariation(screen.id)}>
            <Copy className="h-3.5 w-3.5" />
          </ToolbarButton>
          <span className="mx-0.5 h-4 w-px bg-line" />
          <ToolbarButton label="Delete screen" onClick={() => actions.onDelete(screen.id)} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="More actions"
            onClick={(e) => actions.onMore(screen.id, { x: e.clientX, y: e.clientY })}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
  danger,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-pill text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg",
        danger && "hover:bg-critical/10 hover:text-critical",
      )}
    >
      {children}
    </button>
  );
}
