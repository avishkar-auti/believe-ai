import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bookmark, Map } from "lucide-react";
import type { ResourceView } from "@believe-ai/shared";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchResumes } from "../resumes/resumeApi.js";
import { deleteRoadmap, fetchRoadmaps, generateRoadmap } from "./roadmapApi.js";
import { RoadmapGenerator } from "./RoadmapGenerator.js";
import { RoadmapEmptyState } from "./RoadmapEmptyState.js";
import { RoadmapOverview } from "./RoadmapOverview.js";
import { JumpToModule } from "./JumpToModule.js";
import { RoadmapTimeline } from "./RoadmapTimeline.js";
import { ResourceFilter } from "./ResourceFilter.js";

export function RoadmapPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [goal, setGoal] = useState("");
  const [personalize, setPersonalize] = useState(true);
  const [resumeId, setResumeId] = useState("");
  const [resourceView, setResourceView] = useState<ResourceView>("both");

  // Seeded once from a Job Board "Learning Roadmap" deep-link (see features/jobs/CareerActions.tsx).
  useEffect(() => {
    const state = location.state as { goal?: string; resumeId?: string } | null;
    if (state?.goal) setGoal(state.goal);
    if (state?.resumeId) setResumeId(state.resumeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once from arrival state, not on every navigation
  }, []);

  const { data, isLoading } = useQuery({ queryKey: ["roadmaps"], queryFn: fetchRoadmaps });
  const { data: resumes } = useQuery({ queryKey: ["resumes"], queryFn: fetchResumes });
  const primaryResume = resumes?.find((r) => r.isPrimary);
  const selectedResume = resumes?.find((r) => r.id === resumeId) ?? primaryResume;

  const generateMutation = useMutation({
    mutationFn: () => generateRoadmap(goal, personalize, selectedResume?.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      setGoal("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoadmap,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
  });

  function focusGoalInput() {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="mx-auto max-w-content space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="flex items-center gap-2.5 text-h1 text-fg">
            <Map className="h-6 w-6 text-accent" /> Learning Roadmap
          </h1>
          <p className="mt-1.5 text-label font-normal text-fg-muted">Build a personalized path based on your goals and experience.</p>
        </div>
        {data && data.items.length > 0 && (
          <span className="flex items-center gap-1.5 text-caption font-medium text-fg-subtle">
            <Bookmark className="h-3.5 w-3.5" /> {data.items.length} saved {data.items.length === 1 ? "roadmap" : "roadmaps"}
          </span>
        )}
      </motion.div>

      <RoadmapGenerator
        ref={inputRef}
        goal={goal}
        onGoalChange={setGoal}
        onBuild={() => generateMutation.mutate()}
        building={generateMutation.isPending}
        error={generateMutation.isError}
        personalize={personalize}
        onPersonalizeChange={setPersonalize}
        resumes={resumes}
        selectedResumeId={selectedResume?.id}
        onSelectResume={setResumeId}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-fg-subtle" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <RoadmapEmptyState
          onUseTopic={(topic) => {
            setGoal(topic);
            focusGoalInput();
          }}
          onCreate={focusGoalInput}
        />
      ) : (
        <div className="space-y-10">
          <ResourceFilter value={resourceView} onChange={setResourceView} />

          {data.items.map((roadmap) => (
            <div key={roadmap.id} className="space-y-5">
              <RoadmapOverview
                roadmap={roadmap}
                onDelete={() => deleteMutation.mutate(roadmap.id)}
                deleting={deleteMutation.isPending && deleteMutation.variables === roadmap.id}
              />
              <JumpToModule stages={roadmap.stages} roadmapId={roadmap.id} />
              <RoadmapTimeline roadmapId={roadmap.id} stages={roadmap.stages} resourceView={resourceView} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
