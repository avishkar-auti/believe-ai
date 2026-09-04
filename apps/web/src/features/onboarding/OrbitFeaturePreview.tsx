import { motion } from "framer-motion";
import { Briefcase, MessagesSquare, Send, Target, BookOpen, type LucideIcon } from "lucide-react";
import believeIcon from "../../assets/brand/believe-icon.png";

interface OrbitNode {
  label: string;
  Icon: LucideIcon;
}

const NODES: OrbitNode[] = [
  { label: "Career Fit", Icon: Target },
  { label: "Learning", Icon: BookOpen },
  { label: "Interview Prep", Icon: MessagesSquare },
  { label: "Job Board", Icon: Briefcase },
  { label: "AI Outreach", Icon: Send },
];

const BOX = 320;
const CENTER = BOX / 2;
const RADIUS = 125;

function nodePosition(index: number) {
  const angle = ((-90 + index * (360 / NODES.length)) * Math.PI) / 180;
  const x = CENTER + RADIUS * Math.cos(angle);
  const y = CENTER + RADIUS * Math.sin(angle);
  return { left: `${(x / BOX) * 100}%`, top: `${(y / BOX) * 100}%` };
}

/** The believe.ai mark at the center of a five-node product-area orbit,
 * connected by faint radial lines — a calm, subtle "workspace hub" visual
 * for the onboarding welcome screen, not a literal product screenshot. */
export function OrbitFeaturePreview() {
  return (
    <div className="relative mx-auto" style={{ width: BOX, height: BOX, maxWidth: "100%", aspectRatio: "1 / 1" }}>
      <svg viewBox={`0 0 ${BOX} ${BOX}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {NODES.map((node, i) => {
          const pos = nodePosition(i);
          const x = (parseFloat(pos.left) / 100) * BOX;
          const y = (parseFloat(pos.top) / 100) * BOX;
          return (
            <motion.line
              key={node.label}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="rgb(var(--line-strong))"
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.06, ease: "easeOut" }}
            />
          );
        })}
      </svg>

      <motion.img
        src={believeIcon}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_8px_16px_rgb(var(--accent)/0.35)]"
      />

      {NODES.map((node, i) => (
        <motion.div
          key={node.label}
          style={nodePosition(i)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
          transition={{
            opacity: { duration: 0.4, delay: 0.45 + i * 0.07 },
            scale: { duration: 0.4, delay: 0.45 + i * 0.07 },
            y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: 1 },
          }}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-accent shadow-card">
            <node.Icon className="h-4 w-4" />
          </span>
          <span className="whitespace-nowrap text-[10px] font-medium text-fg-subtle">{node.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
