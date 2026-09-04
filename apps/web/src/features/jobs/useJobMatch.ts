import { useQuery } from "@tanstack/react-query";
import type { Job } from "@believe-ai/shared";
import { fetchJobMatch, fetchJobMatchForJob } from "./jobsApi.js";

/** Real match scoring needs a resume to compare against — with none selected
 * there's nothing to fetch, so the query stays disabled and callers render
 * the "select a resume" state locally instead of firing a request that can
 * only ever come back empty. */
export function useJobMatch(job: Job | undefined, resumeId: string | undefined) {
  return useQuery({
    queryKey: ["jobMatch", job?.id, resumeId],
    queryFn: () => (job?.source === "internal" ? fetchJobMatch(job.id, resumeId) : fetchJobMatchForJob(job as Job, resumeId)),
    enabled: Boolean(job && resumeId),
  });
}
