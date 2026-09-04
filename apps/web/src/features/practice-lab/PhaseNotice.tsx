import { Info } from "lucide-react";

export function PhaseNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-control border border-caution/30 bg-caution/10 px-4 py-3 text-sm text-fg">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-caution" />
      <span>
        AI Practice Lab is in early access. Coding and debugging challenges run for real in an isolated sandbox — system-design and
        prompt-engineering challenges are still preview-only, saved but not executed.
      </span>
    </div>
  );
}
