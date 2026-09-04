import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import type { Resume } from "@believe-ai/shared";
import type { InterviewDifficulty, InterviewType } from "./interviewApi.js";

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "system_design", label: "System Design" },
  { value: "coding", label: "Coding" },
];

const DIFFICULTIES: { value: InterviewDifficulty | ""; label: string }[] = [
  { value: "", label: "Any difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function InterviewConfigBar({
  targetRole,
  onTargetRoleChange,
  resumes,
  resumeId,
  onResumeIdChange,
  interviewType,
  onInterviewTypeChange,
  difficulty,
  onDifficultyChange,
  onGenerate,
  generating,
}: {
  targetRole: string;
  onTargetRoleChange: (v: string) => void;
  resumes: Resume[] | undefined;
  resumeId: string;
  onResumeIdChange: (v: string) => void;
  interviewType: InterviewType;
  onInterviewTypeChange: (v: InterviewType) => void;
  difficulty: InterviewDifficulty | "";
  onDifficultyChange: (v: InterviewDifficulty | "") => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  const hasResume = Boolean(resumeId);

  return (
    <div className="rounded-panel border border-line bg-surface p-3">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <Input
          placeholder="Target role (optional) — e.g. Senior Backend Engineer"
          value={targetRole}
          onChange={(e) => onTargetRoleChange(e.target.value)}
          className="lg:flex-1"
        />
        {resumes && resumes.length > 1 && (
          <Select className="lg:w-48" value={resumeId} onChange={(e) => onResumeIdChange(e.target.value)}>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {(r.targetRole ?? r.fileName) + (r.isPrimary ? " (Primary)" : "")}
              </option>
            ))}
          </Select>
        )}
        <Select
          className="lg:w-40"
          value={interviewType}
          onChange={(e) => onInterviewTypeChange(e.target.value as InterviewType)}
        >
          {INTERVIEW_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Select
          className="lg:w-36"
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value as InterviewDifficulty | "")}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
        <Button onClick={onGenerate} disabled={generating || !hasResume} className="shrink-0">
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating…" : "Generate interview"}
        </Button>
      </div>
      {!hasResume && (
        <p className="mt-2.5 text-caption text-fg-muted">
          You'll need a resume first —{" "}
          <Link to="/app/resume" className="font-medium text-accent hover:underline">
            upload one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
