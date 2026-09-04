import { Briefcase, FileText, Map, MessagesSquare, Send, Target, type LucideIcon } from "lucide-react";

export interface EcosystemNodeData {
  key: string;
  label: string;
  desc: string;
  stat?: string;
  Icon: LucideIcon;
}

export const ECOSYSTEM_NODES: EcosystemNodeData[] = [
  { key: "resume", label: "Resume", desc: "Upload & optimize", Icon: FileText },
  { key: "careerFit", label: "Career Fit", desc: "See how you match", stat: "92%", Icon: Target },
  { key: "jobBoard", label: "Job Board", desc: "Find relevant roles", Icon: Briefcase },
  { key: "roadmap", label: "Learning Roadmap", desc: "Build skills", Icon: Map },
  { key: "interview", label: "Interview Prep", desc: "Practice with AI", Icon: MessagesSquare },
  { key: "outreach", label: "Outreach", desc: "Connect and start conversations", Icon: Send },
];

/** Shared timing so the traveling connector dot and each node's glow stay in
 * phase: the dot takes CONNECTOR_TRAVEL_DURATION to cross the line, pauses
 * PAUSE_DURATION, then loops — a node's glow fires when the dot would be
 * passing its position along that same timeline. */
export const CONNECTOR_TRAVEL_DURATION = 3.5;
export const CONNECTOR_PAUSE_DURATION = 0.6;
export const CONNECTOR_CYCLE_DURATION = CONNECTOR_TRAVEL_DURATION + CONNECTOR_PAUSE_DURATION;

export function nodeGlowDelay(index: number) {
  return (index / (ECOSYSTEM_NODES.length - 1)) * CONNECTOR_TRAVEL_DURATION;
}
