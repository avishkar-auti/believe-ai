import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../../lib/cn.js";

/** The panel an AI result renders into once it's ready — distinguished from
 * AiProposal (campaigns/components/AiProposal.tsx) by having no apply/dismiss
 * actions: this is a finished read, not a suggestion awaiting a decision.
 * `active` breathes the ai-edge glow (the Believe Intelligence Layer) while
 * this panel's content is actively being generated — never as idle decoration. */
export function AiPanel({
  title,
  children,
  className,
  active = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <div className={cn("ai-edge rounded-card surface-2 surface-edge p-6", active && "ai-edge-active", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className={cn("h-4 w-4 text-accent", active && "animate-pulse")} />
        <p className="text-h3 text-fg">{title}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
