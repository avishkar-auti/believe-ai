import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { CategoryCardShell } from "./CategoryCardShell.js";

// A simple 5-axis radar (skills/experience/fit/demand/growth), values 0-1.
const AXES = 5;
const VALUES = [0.9, 0.75, 0.95, 0.8, 0.7];
const RADIUS = 32;
const CENTER = { x: 40, y: 36 };

function axisPoint(i: number, value: number) {
  const angle = (Math.PI * 2 * i) / AXES - Math.PI / 2;
  return { x: CENTER.x + Math.cos(angle) * RADIUS * value, y: CENTER.y + Math.sin(angle) * RADIUS * value };
}

const polygonPoints = VALUES.map((v, i) => axisPoint(i, v))
  .map((p) => `${p.x},${p.y}`)
  .join(" ");
const outlinePoints = VALUES.map((_, i) => axisPoint(i, 1))
  .map((p) => `${p.x},${p.y}`)
  .join(" ");

export function CareerIntelligenceCard() {
  return (
    <CategoryCardShell
      icon={Target}
      title="Career Intelligence"
      tools={["Career Fit", "Job Board", "Job Intelligence", "Ask My Resume", "Learning Roadmap"]}
      cta="Explore career tools"
    >
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 80 72" className="h-16 w-16 shrink-0">
          <polygon points={outlinePoints} fill="none" stroke="currentColor" strokeWidth="1" className="text-surface-3" />
          <motion.polygon
            points={polygonPoints}
            fill="currentColor"
            className="text-accent"
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 0.18, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          />
          <motion.polygon
            points={polygonPoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-accent"
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}
          />
        </svg>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-fg">Product Manager</p>
          <p className="text-[11px] font-medium text-positive">89% match</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {["Growth", "Remote", "In demand"].map((tag) => (
              <span key={tag} className="rounded-pill bg-surface-2 px-1.5 py-0.5 text-[9px] text-fg-subtle">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CategoryCardShell>
  );
}
