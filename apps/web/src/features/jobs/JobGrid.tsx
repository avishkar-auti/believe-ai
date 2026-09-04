import { motion } from "framer-motion";
import type { Job } from "@believe-ai/shared";
import { JobCard } from "./JobCard.js";

export function JobGrid({
  jobs,
  selectedJobId,
  resumeId,
  onSelect,
  onToggleSave,
  savingId,
}: {
  jobs: Job[];
  selectedJobId: string | undefined;
  resumeId: string | undefined;
  onSelect: (id: string) => void;
  onToggleSave: (job: Job) => void;
  savingId: string | undefined;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job, i) => (
        <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.02 }}>
          <JobCard
            job={job}
            selected={job.id === selectedJobId}
            resumeId={resumeId}
            onSelect={() => onSelect(job.id)}
            onToggleSave={() => onToggleSave(job)}
            saving={savingId === job.id}
          />
        </motion.div>
      ))}
    </div>
  );
}
