import { GraduationCap, Search, Code2, UserSearch, Rocket, Briefcase, Palette } from "lucide-react";
import { cn } from "../../lib/cn.js";

const PERSONAS = [
  { label: "Students", icon: GraduationCap },
  { label: "Job Seekers", icon: Search },
  { label: "Developers", icon: Code2 },
  { label: "Recruiters", icon: UserSearch },
  { label: "Founders", icon: Rocket },
  { label: "Freelancers", icon: Briefcase },
  { label: "Creators", icon: Palette },
];

/** Who Believe.ai is for — hover-only in this pass (no click-through use-case
 * switching yet; that's the later persona-tabs section). */
export function PersonaRail() {
  return (
    <div className="px-4 sm:px-6">
      <div className="mx-auto max-w-content overflow-x-auto">
        <div
          className={cn(
            "flex min-w-max items-center justify-center gap-1 rounded-panel border border-line bg-surface-2/60 p-1.5",
            "sm:min-w-0 sm:flex-wrap",
          )}
        >
          {PERSONAS.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="group flex shrink-0 items-center gap-1.5 rounded-control px-3.5 py-2 text-[13px] font-medium text-fg-muted transition-colors duration-150 hover:bg-accent-soft hover:text-accent"
            >
              <Icon className="h-3.5 w-3.5 text-fg-subtle transition-colors duration-150 group-hover:text-accent" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
