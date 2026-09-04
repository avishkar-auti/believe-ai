import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { JobSearchFilters } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Drawer } from "../../components/ui/Drawer.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { fetchResumes } from "../resumes/resumeApi.js";
import { fetchJobFilterOptions, fetchJobMatch, fetchJobMatchForJob, searchJobs, toggleSaveJob } from "./jobsApi.js";
import { JobSearchHeader } from "./JobSearchHeader.js";
import { ResumeMatchBanner } from "./ResumeMatchBanner.js";
import { JobFilters } from "./JobFilters.js";
import { MobileFilterDrawer } from "./MobileFilterDrawer.js";
import { JobResultsToolbar, type JobResultsTab, type JobViewMode } from "./JobResultsToolbar.js";
import { JobList } from "./JobList.js";
import { JobGrid } from "./JobGrid.js";
import { JobCardSkeleton } from "./JobCardSkeleton.js";
import { JobDetailsPanel } from "./JobDetailsPanel.js";
import { JobLibraryEmptyState } from "./JobLibraryEmptyState.js";
import { JobLibraryErrorState } from "./JobLibraryErrorState.js";

export function JobBoardPage() {
  const queryClient = useQueryClient();

  const [qInput, setQInput] = useState("");
  const [salaryMinInput, setSalaryMinInput] = useState("");
  const [filters, setFilters] = useState<JobSearchFilters>({});
  const [page, setPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [resumeId, setResumeId] = useState("");
  const [activeTab, setActiveTab] = useState<JobResultsTab>("all");
  const [viewMode, setViewMode] = useState<JobViewMode>("list");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  // Debounce the keyword box and salary floor so every keystroke doesn't fire a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setFilters((f) => ({ ...f, q: qInput || undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      const n = Number(salaryMinInput);
      setFilters((f) => ({ ...f, salaryMin: salaryMinInput && !Number.isNaN(n) ? n : undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [salaryMinInput]);

  const { data: filterOptions } = useQuery({ queryKey: ["jobFilters"], queryFn: fetchJobFilterOptions });
  const { data: resumes } = useQuery({ queryKey: ["resumes"], queryFn: fetchResumes });
  const selectedResumeId = resumeId || resumes?.find((r) => r.isPrimary)?.id || "";

  // "Saved" is a real filter the backend already supports (savedOnly); "Best
  // match" reuses the normal search but reorders the current page by each
  // job's real, already-computed match score — see matchQueries below.
  const effectiveFilters = useMemo<JobSearchFilters>(
    () => ({ ...filters, savedOnly: activeTab === "saved" ? true : filters.savedOnly }),
    [filters, activeTab],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs", effectiveFilters, page],
    queryFn: () => searchJobs(effectiveFilters, page),
  });

  // Auto-select a job for the desktop details panel whenever results change
  // and the current selection isn't (or is no longer) part of them.
  useEffect(() => {
    if (!data) return;
    if (!data.items.some((j) => j.id === selectedJobId)) setSelectedJobId(data.items[0]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the result set itself changes
  }, [data]);

  const matchQueries = useQueries({
    queries: (activeTab === "best-match" && selectedResumeId ? (data?.items ?? []) : []).map((job) => ({
      queryKey: ["jobMatch", job.id, selectedResumeId],
      queryFn: () => (job.source === "internal" ? fetchJobMatch(job.id, selectedResumeId) : fetchJobMatchForJob(job, selectedResumeId)),
    })),
  });

  const displayedItems = useMemo(() => {
    const items = data?.items ?? [];
    if (activeTab !== "best-match" || !selectedResumeId) return items;
    return items
      .map((job, i) => ({ job, percent: matchQueries[i]?.data?.matchPercent ?? -1 }))
      .sort((a, b) => b.percent - a.percent)
      .map((s) => s.job);
  }, [data, activeTab, selectedResumeId, matchQueries]);

  const selectedJob = displayedItems.find((j) => j.id === selectedJobId);

  const saveMutation = useMutation({
    mutationFn: toggleSaveJob,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  function setFilter<K extends keyof JobSearchFilters>(key: K, value: JobSearchFilters[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  }
  function setCountry(v: string) {
    setPage(1);
    setFilters((f) => ({ ...f, country: v || undefined, state: undefined, city: undefined }));
  }
  function setLocationState(v: string) {
    setPage(1);
    setFilters((f) => ({ ...f, state: v || undefined, city: undefined }));
  }
  function setCity(v: string) {
    setPage(1);
    setFilters((f) => ({ ...f, city: v || undefined }));
  }
  function resetFilters() {
    setPage(1);
    setQInput("");
    setSalaryMinInput("");
    setFilters({});
  }
  function selectJob(id: string) {
    setSelectedJobId(id);
    setMobileDetailsOpen(true);
  }

  const filterProps = {
    qInput,
    onQInputChange: setQInput,
    salaryMinInput,
    onSalaryMinInputChange: setSalaryMinInput,
    filters,
    filterOptions,
    onSetFilter: setFilter,
    onSetCountry: setCountry,
    onSetState: setLocationState,
    onSetCity: setCity,
    onReset: resetFilters,
  };

  const selectedFilterCount = [
    filters.country,
    filters.state,
    filters.city,
    filters.company,
    filters.employmentType,
    filters.workMode,
    filters.experienceLevel,
    filters.skill,
    filters.source,
    filters.salaryMin,
    filters.datePosted && filters.datePosted !== "any" ? filters.datePosted : undefined,
  ].filter(Boolean).length;

  const hasFilters = selectedFilterCount > 0 || Boolean(filters.q);

  return (
    <div className="space-y-6">
      <JobSearchHeader
        qInput={qInput}
        onQInputChange={setQInput}
        onViewSaved={() => {
          setActiveTab("saved");
          setPage(1);
        }}
      />

      <ResumeMatchBanner resumes={resumes} resumeId={selectedResumeId} onSelectResume={setResumeId} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr_380px]">
        <div className="hidden lg:block">
          <Card className="sticky top-6">
            <CardBody>
              <JobFilters {...filterProps} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <JobResultsToolbar
            // data.total only counts internal (paginated) listings — a keyword search also
            // merges in live external results that aren't reflected there, so never show a
            // total smaller than what's actually rendered below.
            total={Math.max(data?.total ?? 0, displayedItems.length)}
            isLoading={isLoading}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setPage(1);
            }}
            bestMatchEnabled={Boolean(selectedResumeId)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedFilterCount={selectedFilterCount}
            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          />

          {isError ? (
            <JobLibraryErrorState onRetry={() => void refetch()} />
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <JobLibraryEmptyState hasFilters={hasFilters} onClearFilters={resetFilters} />
          ) : viewMode === "grid" ? (
            <JobGrid
              jobs={displayedItems}
              selectedJobId={selectedJobId}
              resumeId={selectedResumeId}
              onSelect={selectJob}
              onToggleSave={(job) => saveMutation.mutate(job)}
              savingId={saveMutation.isPending ? saveMutation.variables?.id : undefined}
            />
          ) : (
            <JobList
              jobs={displayedItems}
              selectedJobId={selectedJobId}
              resumeId={selectedResumeId}
              onSelect={selectJob}
              onToggleSave={(job) => saveMutation.mutate(job)}
              savingId={saveMutation.isPending ? saveMutation.variables?.id : undefined}
            />
          )}

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="flex items-center px-2 text-caption text-fg-subtle">
                Page {data.page} of {data.totalPages}
              </span>
              <Button type="button" variant="ghost" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <Card className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <CardBody>
              {selectedJob ? (
                <JobDetailsPanel
                  job={selectedJob}
                  resumeId={selectedResumeId}
                  onToggleSave={() => saveMutation.mutate(selectedJob)}
                  saving={saveMutation.isPending && saveMutation.variables?.id === selectedJob.id}
                />
              ) : (
                <EmptyState title="Select a role" description="Choose a job from the list to see full details and your fit." />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        // Same fix as the toolbar's total above — data.total alone undercounts
        // (or, with an empty internal DB, always reads 0) since it ignores the
        // live external results merged into the actual result list.
        resultCount={Math.max(data?.total ?? 0, displayedItems.length)}
        {...filterProps}
      />

      <Drawer
        open={mobileDetailsOpen && Boolean(selectedJob)}
        onClose={() => setMobileDetailsOpen(false)}
        title={selectedJob?.title ?? "Job details"}
        subtitle={selectedJob?.company}
        className="lg:hidden"
      >
        {selectedJob && (
          <JobDetailsPanel
            job={selectedJob}
            resumeId={selectedResumeId}
            onToggleSave={() => saveMutation.mutate(selectedJob)}
            saving={saveMutation.isPending && saveMutation.variables?.id === selectedJob.id}
          />
        )}
      </Drawer>
    </div>
  );
}
