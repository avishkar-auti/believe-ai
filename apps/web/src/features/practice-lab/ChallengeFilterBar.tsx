import { Search } from "lucide-react";
import type { ChallengeDifficulty, ChallengeStatus, ChallengeTrack, ChallengeType } from "@believe-ai/shared";
import { Tabs } from "../../components/ui/Tabs.js";
import { Select } from "../../components/ui/Select.js";
import type { ChallengeFilters } from "./practiceApi.js";

const TRACK_TABS = [
  { value: "", label: "All" },
  { value: "python-for-ai", label: "Python for AI" },
  { value: "rag", label: "RAG" },
  { value: "agents", label: "Agents" },
];

const DIFFICULTY_OPTIONS: { value: ChallengeDifficulty | ""; label: string }[] = [
  { value: "", label: "All difficulty" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const TYPE_OPTIONS: { value: ChallengeType | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "coding", label: "Coding" },
  { value: "debugging", label: "Debugging" },
  { value: "system-design", label: "System design" },
  { value: "prompt-engineering", label: "Prompt engineering" },
];

const STATUS_OPTIONS: { value: ChallengeStatus | ""; label: string }[] = [
  { value: "", label: "All challenges" },
  { value: "unsolved", label: "Unsolved" },
  { value: "attempted", label: "Attempted" },
  { value: "solved", label: "Solved" },
];

export function ChallengeFilterBar({
  filters,
  onChange,
}: {
  filters: ChallengeFilters;
  onChange: (filters: ChallengeFilters) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          ariaLabel="Filter by track"
          items={TRACK_TABS}
          value={filters.track ?? ""}
          onChange={(v) => onChange({ ...filters, track: (v || undefined) as ChallengeTrack | undefined })}
        />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={filters.q ?? ""}
            onChange={(e) => onChange({ ...filters, q: e.target.value || undefined })}
            placeholder="Search challenges…"
            aria-label="Search challenges"
            className="h-9 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filter by difficulty"
          className="!h-9 w-auto text-sm"
          value={filters.difficulty ?? ""}
          onChange={(e) => onChange({ ...filters, difficulty: (e.target.value || undefined) as ChallengeDifficulty | undefined })}
        >
          {DIFFICULTY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by challenge type"
          className="!h-9 w-auto text-sm"
          value={filters.challengeType ?? ""}
          onChange={(e) => onChange({ ...filters, challengeType: (e.target.value || undefined) as ChallengeType | undefined })}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by status"
          className="!h-9 w-auto text-sm"
          value={filters.status ?? ""}
          onChange={(e) => onChange({ ...filters, status: (e.target.value || undefined) as ChallengeStatus | undefined })}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
