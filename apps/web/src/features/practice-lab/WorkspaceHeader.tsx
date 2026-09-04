import { Link } from "react-router-dom";
import { ArrowLeft, CircleCheck } from "lucide-react";
import type { ChallengeDetail } from "@believe-ai/shared";
import { Badge } from "../../components/ui/Badge.js";

const DIFFICULTY_TONE = { beginner: "info", intermediate: "neutral", advanced: "warning" } as const;
const TRACK_LABEL: Record<string, string> = { "python-for-ai": "Python for AI", rag: "RAG", agents: "Agents" };
const TYPE_LABEL: Record<string, string> = {
  coding: "Coding",
  debugging: "Debugging",
  "system-design": "System design",
  "prompt-engineering": "Prompt engineering",
};

export function WorkspaceHeader({ challenge }: { challenge: ChallengeDetail }) {
  return (
    <div className="border-b border-line pb-4">
      <Link
        to="/app/practice/challenges"
        className="mb-2 inline-flex items-center gap-1 text-caption font-medium text-fg-subtle transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Challenges
      </Link>
      <h1 className="text-h2 text-fg">{challenge.title}</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {challenge.status === "solved" && (
          <Badge tone="success" className="flex items-center gap-1">
            <CircleCheck className="h-3 w-3" /> Solved
          </Badge>
        )}
        <Badge tone={DIFFICULTY_TONE[challenge.difficulty]} className="capitalize">
          {challenge.difficulty}
        </Badge>
        <span className="text-caption text-fg-subtle">
          {TRACK_LABEL[challenge.track] ?? challenge.track} · {TYPE_LABEL[challenge.challengeType] ?? challenge.challengeType}
        </span>
      </div>
    </div>
  );
}
