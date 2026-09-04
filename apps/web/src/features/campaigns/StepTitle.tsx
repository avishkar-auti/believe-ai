import type { ReactNode } from "react";

export function StepTitle({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-line pb-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">{icon}</span>
      <div>
        <h2 className="text-h3 text-fg">{title}</h2>
        <p className="mt-0.5 text-caption leading-relaxed text-fg-muted">{description}</p>
      </div>
    </div>
  );
}
