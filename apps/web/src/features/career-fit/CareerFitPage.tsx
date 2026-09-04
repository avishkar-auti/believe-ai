import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { deleteCareerFit, fetchCareerFits, generateCareerFit } from "./careerFitApi.js";
import { fetchResumes } from "../resumes/resumeApi.js";
import { CareerFitAnalyzer } from "./CareerFitAnalyzer.js";
import { CareerFitReport } from "./CareerFitReport.js";

export function CareerFitPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [targetRole, setTargetRole] = useState("");
  const [resumeId, setResumeId] = useState("");

  // Seeded once from a Job Board "Career Fit" deep-link (see features/jobs/CareerActions.tsx).
  useEffect(() => {
    const state = location.state as { targetRole?: string; resumeId?: string } | null;
    if (state?.targetRole) setTargetRole(state.targetRole);
    if (state?.resumeId) setResumeId(state.resumeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once from arrival state, not on every navigation
  }, []);

  const { data, isLoading } = useQuery({ queryKey: ["career-fit"], queryFn: fetchCareerFits });
  const { data: resumes } = useQuery({ queryKey: ["resumes"], queryFn: fetchResumes });
  const selectedResumeId = resumeId || resumes?.find((r) => r.isPrimary)?.id;

  const generateMutation = useMutation({
    mutationFn: () => generateCareerFit(targetRole || undefined, selectedResumeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["career-fit"] });
      setTargetRole("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCareerFit,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["career-fit"] }),
  });

  return (
    <div className="max-w-content space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <h1 className="flex items-center gap-2.5 text-h1 text-fg">
          <Target className="h-6 w-6 text-accent" /> Career Fit
        </h1>
        <p className="mt-1.5 text-label font-normal text-fg-muted">
          Understand how your experience aligns with your target role.
        </p>
      </motion.div>

      <CareerFitAnalyzer
        targetRole={targetRole}
        onTargetRoleChange={setTargetRole}
        resumes={resumes}
        selectedResumeId={selectedResumeId}
        onSelectResume={setResumeId}
        onAnalyze={() => generateMutation.mutate()}
        analyzing={generateMutation.isPending}
        error={generateMutation.isError}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-fg-subtle" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="No assessments yet"
          description="Generate your first career-fit assessment above."
        />
      ) : (
        <div className="space-y-5">
          {data.items.map((fit) => (
            <CareerFitReport
              key={fit.id}
              fit={fit}
              onDelete={() => deleteMutation.mutate(fit.id)}
              deleting={deleteMutation.isPending && deleteMutation.variables === fit.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
