import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Building2, ExternalLink, MapPin, Trash2, Users } from "lucide-react";
import type { CompanyIntel, ConfidenceLevel } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { analyzeJobUrl, deleteJobIntel, fetchJobIntelList } from "./jobIntelApi.js";
import { OutreachDraftPanel } from "./OutreachDraftPanel.js";
import { JobLeadPanel } from "./JobLeadPanel.js";

export function JobIntelPage() {
  const queryClient = useQueryClient();
  const [jobUrl, setJobUrl] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["jobIntel"], queryFn: fetchJobIntelList });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeJobUrl(jobUrl),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobIntel"] });
      setJobUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobIntel,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["jobIntel"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
          <Briefcase className="h-5 w-5 text-brand-500" /> Job Outreach
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Paste a job posting URL to extract the role, required skills, and real company intel.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="https://company.com/careers/senior-engineer"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => analyzeMutation.mutate()} disabled={!jobUrl.trim() || analyzeMutation.isPending}>
            {analyzeMutation.isPending ? "Analyzing…" : "Analyze job"}
          </Button>
        </CardBody>
        {analyzeMutation.isError && (
          <CardBody className="pt-0">
            <p className="text-sm text-red-600">
              {(analyzeMutation.error as { message?: string })?.message ||
                "Couldn't analyze that link — check the URL and try again."}
            </p>
          </CardBody>
        )}
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-400" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No jobs analyzed yet" description="Paste a job posting URL above to get started." />
      ) : (
        <div className="space-y-4">
          {data.items.map((job) => (
            <Card key={job.id}>
              <CardHeader className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink-900 dark:text-white">{job.roleTitle}</p>
                    {job.parsingConfidence === "low" && <Badge tone="warning">Low-confidence parse</Badge>}
                  </div>
                  <p className="mt-0.5 flex items-center gap-3 text-sm text-ink-500 dark:text-ink-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={job.jobUrl} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm">
                      Posting <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(job.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                  <Badge tone="neutral">{job.experienceLevel}</Badge>
                  {job.hiringTeamNames.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {job.hiringTeamNames.join(", ")} team
                    </span>
                  )}
                </div>

                {job.skills.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">Skills detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((s) => (
                        <Badge key={s} tone="info">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <CompanyIntelPanel intel={job.companyIntel} />

                <JobLeadPanel jobIntelId={job.id} />

                <OutreachDraftPanel jobIntelId={job.id} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfidenceDot({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      title={level === "high" ? "Grounded in a real public source" : "Low confidence — not enough public data"}
      className={`inline-block h-1.5 w-1.5 rounded-full ${level === "high" ? "bg-lime-500" : "bg-ink-300 dark:bg-ink-600"}`}
    />
  );
}

function CompanyIntelPanel({ intel }: { intel: CompanyIntel }) {
  const hasAnyData = intel.employeeCount != null || intel.techStack.length > 0 || intel.funding || intel.hiringTrend;

  return (
    <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Company intel</p>
      {!hasAnyData ? (
        <p className="text-xs text-ink-400">
          Not enough public data to say anything reliable about this company yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
              <ConfidenceDot level={intel.confidence.employeeCount} /> Employees
            </div>
            <p className="font-medium text-ink-900 dark:text-white">{intel.employeeCount ?? "Unknown"}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
              <ConfidenceDot level={intel.confidence.funding} /> Funding
            </div>
            <p className="font-medium text-ink-900 dark:text-white">{intel.funding ?? "Unknown"}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
              <ConfidenceDot level={intel.confidence.hiringTrend} /> Hiring trend
            </div>
            <p className="font-medium capitalize text-ink-900 dark:text-white">{intel.hiringTrend ?? "Unknown"}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
              <ConfidenceDot level={intel.confidence.techStack} /> Tech stack
            </div>
            {intel.techStack.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {intel.techStack.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="font-medium text-ink-900 dark:text-white">Unknown</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
