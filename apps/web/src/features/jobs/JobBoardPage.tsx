import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, ChevronLeft, ChevronRight, ExternalLink, Heart, Plus, Sparkles, Trash2 } from "lucide-react";
import type {
  CreateJobInput,
  EmploymentType,
  ExperienceLevel,
  Job,
  JobSearchFilters,
  JobSource,
  WorkMode,
} from "@believe-ai/shared";
import { DATE_POSTED_OPTIONS, EXPERIENCE_LEVELS, WORK_MODES } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { cn } from "../../lib/cn.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { createJob, deleteJob, draftJobPost, fetchJobFilterOptions, searchJobs, toggleSaveJob } from "./jobsApi.js";

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  fresher: "Fresher",
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
};

const SOURCE_LABELS: Record<JobSource, string> = {
  internal: "believe.ai",
  jsearch: "External",
};

function formatSalary(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min != null) return `${min.toLocaleString()}+`;
  return `Up to ${max!.toLocaleString()}`;
}

export function JobBoardPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [qInput, setQInput] = useState("");
  const [salaryMinInput, setSalaryMinInput] = useState("");
  const [filters, setFilters] = useState<JobSearchFilters>({});
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  // Debounce the keyword box so every keystroke doesn't fire a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setFilters((f) => ({ ...f, q: qInput || undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  // Same debounce for the salary floor input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      const n = Number(salaryMinInput);
      setFilters((f) => ({ ...f, salaryMin: salaryMinInput && !Number.isNaN(n) ? n : undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [salaryMinInput]);

  const { data: filterOptions } = useQuery({ queryKey: ["jobFilters"], queryFn: fetchJobFilterOptions });
  const { data, isLoading } = useQuery({
    queryKey: ["jobs", filters, page],
    queryFn: () => searchJobs(filters, page),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const saveMutation = useMutation({
    mutationFn: toggleSaveJob,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  function setFilter<K extends keyof JobSearchFilters>(key: K, value: JobSearchFilters[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  }

  function resetFilters() {
    setPage(1);
    setQInput("");
    setSalaryMinInput("");
    setFilters({});
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
            <Briefcase className="h-5 w-5 text-brand-500" /> Job Board
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Internal postings plus external listings, in one place.</p>
        </div>
        {isRecruiter && (
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Post a job"}
          </Button>
        )}
      </div>

      {showForm && <PostJobForm onDone={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="h-fit lg:col-span-4">
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Filters</h2>
              <button type="button" onClick={resetFilters} className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400">
                Reset
              </button>
            </div>

            <Input placeholder="Title, company, or skill…" value={qInput} onChange={(e) => setQInput(e.target.value)} />

            <button
              type="button"
              onClick={() => setFilter("savedOnly", true)}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-pill border px-3 py-2 text-xs font-medium transition-colors",
                filters.savedOnly
                  ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                  : "border-ink-200 text-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-400",
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", filters.savedOnly && "fill-current")} /> Saved only
            </button>

            {filterOptions && filterOptions.locations.length > 0 && (
              <FilterSelect
                label="Location"
                value={filters.location ?? ""}
                options={filterOptions.locations}
                onChange={(v) => setFilter("location", v || undefined)}
              />
            )}

            {filterOptions && filterOptions.companies.length > 0 && (
              <FilterSelect
                label="Company"
                value={filters.company ?? ""}
                options={filterOptions.companies}
                onChange={(v) => setFilter("company", v || undefined)}
              />
            )}

            <ChipGroup
              label="Employment type"
              value={filters.employmentType}
              options={Object.entries(EMPLOYMENT_LABELS) as [EmploymentType, string][]}
              onSelect={(v) => setFilter("employmentType", v)}
            />

            <ChipGroup
              label="Work mode"
              value={filters.workMode}
              options={WORK_MODES.map((m) => [m, WORK_MODE_LABELS[m]] as [WorkMode, string])}
              onSelect={(v) => setFilter("workMode", v)}
            />

            <ChipGroup
              label="Experience level"
              value={filters.experienceLevel}
              options={EXPERIENCE_LEVELS.map((l) => [l, EXPERIENCE_LABELS[l]] as [ExperienceLevel, string])}
              onSelect={(v) => setFilter("experienceLevel", v)}
            />

            <ChipGroup
              label="Job source"
              value={filters.source}
              options={(Object.entries(SOURCE_LABELS) as [JobSource, string][])}
              onSelect={(v) => setFilter("source", v)}
            />

            <label className="block space-y-1.5 text-xs font-medium text-ink-500 dark:text-ink-400">
              Minimum salary
              <Input
                type="number"
                min={0}
                placeholder="e.g. 50000"
                value={salaryMinInput}
                onChange={(e) => setSalaryMinInput(e.target.value)}
              />
            </label>

            <label className="block space-y-1.5 text-xs font-medium text-ink-500 dark:text-ink-400">
              Date posted
              <select
                className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                value={filters.datePosted ?? "any"}
                onChange={(e) => setFilter("datePosted", e.target.value === "any" ? undefined : (e.target.value as JobSearchFilters["datePosted"]))}
              >
                {DATE_POSTED_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {filterOptions && filterOptions.skills.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.skills.slice(0, 16).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setFilter("skill", skill)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                        filters.skill === skill
                          ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                          : "border-ink-200 text-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-400",
                      )}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between text-xs text-ink-400">
            <span>{isLoading ? "Loading…" : `${data?.total ?? 0} matching role${data?.total === 1 ? "" : "s"}`}</span>
            {data && data.totalPages > 1 && (
              <span>
                Page {data.page} of {data.totalPages}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-6 w-6 text-ink-400" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No jobs found" description="Try widening your search or clearing a filter." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.items.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  canManage={isRecruiter && job.postedBy === user?.id}
                  onDelete={() => deleteMutation.mutate(job.id)}
                  deleting={deleteMutation.isPending}
                  onToggleSave={() => saveMutation.mutate(job)}
                  saving={saveMutation.isPending}
                />
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1.5 text-xs font-medium text-ink-500 dark:text-ink-400">
      {label}
      <select
        className="h-9 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-800 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChipGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T | undefined;
  options: [T, string][];
  onSelect: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={cn(
              "rounded-pill border px-2.5 py-1 text-xs font-medium transition-colors",
              value === v
                ? "border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900"
                : "border-ink-200 text-ink-500 hover:text-ink-800 dark:border-ink-700 dark:text-ink-400",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function JobCard({
  job,
  canManage,
  onDelete,
  deleting,
  onToggleSave,
  saving,
}: {
  job: Job;
  canManage: boolean;
  onDelete: () => void;
  deleting: boolean;
  onToggleSave: () => void;
  saving: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={job.source === "internal" ? "info" : "neutral"}>{job.source === "internal" ? "believe.ai" : "external"}</Badge>
            {job.workMode && <Badge tone="neutral">{WORK_MODE_LABELS[job.workMode]}</Badge>}
            {job.experienceLevel && <Badge tone="neutral">{EXPERIENCE_LABELS[job.experienceLevel]}</Badge>}
            {job.employmentType && <Badge tone="neutral">{EMPLOYMENT_LABELS[job.employmentType]}</Badge>}
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            disabled={saving}
            title={job.isSaved ? "Unsave" : "Save"}
            className={cn("shrink-0 transition-colors", job.isSaved ? "text-red-500" : "text-ink-300 hover:text-red-500")}
          >
            <Heart className={cn("h-4.5 w-4.5", job.isSaved && "fill-current")} />
          </button>
        </div>

        <h3 className="mt-2 font-medium text-ink-900 dark:text-white">{job.title}</h3>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {job.company}
          {job.location ? ` · ${job.location}` : ""}
        </p>
        {formatSalary(job.salaryMin, job.salaryMax) && (
          <p className="mt-1 text-xs font-medium text-ink-600 dark:text-ink-300">{formatSalary(job.salaryMin, job.salaryMax)}</p>
        )}

        <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-600 dark:text-ink-300">{job.description}</p>

        {job.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 6).map((s) => (
              <Badge key={s} tone="neutral">
                {s}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-3 dark:border-ink-800">
          {job.applyUrl && (
            <a href={job.applyUrl} target="_blank" rel="noreferrer" className="flex-1">
              <Button size="sm" className="w-full">
                Apply <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
          {job.recruiterLinkedIn && (
            <a href={job.recruiterLinkedIn} target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm">
                Recruiter
              </Button>
            </a>
          )}
          {canManage && (
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function PostJobForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateJobInput>({
    title: "",
    company: "",
    location: "",
    description: "",
    skills: [],
    employmentType: "full_time",
    workMode: null,
    experienceLevel: null,
    salaryMin: null,
    salaryMax: null,
    recruiterLinkedIn: "",
    applyUrl: "",
  });
  const [skillsText, setSkillsText] = useState("");
  const [brief, setBrief] = useState("");

  const draftMutation = useMutation({
    mutationFn: () => draftJobPost(form.title || "New role", form.company || "Our company", brief),
    onSuccess: (draft) => {
      setForm((f) => ({ ...f, description: draft.description, employmentType: draft.employmentType }));
      setSkillsText(draft.skills.join(", "));
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createJob({
        ...form,
        location: form.location || null,
        recruiterLinkedIn: form.recruiterLinkedIn || null,
        applyUrl: form.applyUrl || null,
        skills: skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobFilters"] });
      onDone();
    },
  });

  return (
    <Card>
      <CardHeader>
        <span className="text-sm font-medium text-ink-900 dark:text-white">New job posting</span>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Job title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
          <Input
            placeholder="Location (optional)"
            value={form.location ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
          <select
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-white"
            value={form.employmentType ?? "full_time"}
            onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as EmploymentType }))}
          >
            {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-white"
            value={form.workMode ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, workMode: (e.target.value || null) as WorkMode | null }))}
          >
            <option value="">Work mode (optional)</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABELS[m]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-white"
            value={form.experienceLevel ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, experienceLevel: (e.target.value || null) as ExperienceLevel | null }))}
          >
            <option value="">Experience level (optional)</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {EXPERIENCE_LABELS[l]}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={0}
            placeholder="Min salary (optional)"
            value={form.salaryMin ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value ? Number(e.target.value) : null }))}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max salary (optional)"
            value={form.salaryMax ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value ? Number(e.target.value) : null }))}
          />
          <Input
            placeholder="Recruiter LinkedIn URL (optional)"
            value={form.recruiterLinkedIn ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, recruiterLinkedIn: e.target.value }))}
          />
        </div>

        <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-ink-200">
            <Sparkles className="h-4 w-4 text-brand-500" /> Draft with AI
          </div>
          <Textarea
            rows={2}
            placeholder="Rough notes — responsibilities, must-haves, anything you'd tell a recruiter…"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => draftMutation.mutate()}
            disabled={!brief.trim() || draftMutation.isPending}
          >
            {draftMutation.isPending ? "Drafting…" : "Generate draft"}
          </Button>
        </div>

        <Textarea
          rows={6}
          placeholder="Full description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <Input placeholder="Skills, comma separated" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
        <Input
          placeholder="Apply URL (optional)"
          value={form.applyUrl ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))}
        />

        <Button
          onClick={() => createMutation.mutate()}
          disabled={!form.title || !form.company || !form.description || createMutation.isPending}
        >
          {createMutation.isPending ? "Posting…" : "Publish posting"}
        </Button>
      </CardBody>
    </Card>
  );
}
