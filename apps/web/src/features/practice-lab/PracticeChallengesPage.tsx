import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import type { ChallengeTrack } from "@believe-ai/shared";
import { fetchChallenges, type ChallengeFilters } from "./practiceApi.js";
import { ChallengeFilterBar } from "./ChallengeFilterBar.js";
import { ChallengeGrid } from "./ChallengeGrid.js";

export function PracticeChallengesPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ChallengeFilters>(() => {
    const track = searchParams.get("track");
    return track ? { track: track as ChallengeTrack } : {};
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["practice-challenges", filters],
    queryFn: () => fetchChallenges(filters),
  });

  return (
    <div className="mx-auto max-w-content space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <h1 className="flex items-center gap-2.5 text-h1 text-fg">
          <Code2 className="h-6 w-6 text-accent" /> Challenges
        </h1>
        <p className="mt-1.5 text-label font-normal text-fg-muted">Solve practical AI engineering problems and build real skills.</p>
      </motion.div>

      <ChallengeFilterBar filters={filters} onChange={setFilters} />

      <ChallengeGrid isLoading={isLoading} isError={isError} onRetry={() => void refetch()} challenges={data?.items ?? []} />
    </div>
  );
}
