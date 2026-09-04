import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ApiSuccessResponse, User } from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";
import { updateBelieveProfile } from "../settings/believeProfileApi.js";
import { OnboardingShell } from "./OnboardingShell.js";
import { WelcomeStep } from "./WelcomeStep.js";
import { AboutYouStep } from "./AboutYouStep.js";
import { GoalStep } from "./GoalStep.js";
import { SetupWorkspaceStep } from "./SetupWorkspaceStep.js";
import { AllSetStep } from "./AllSetStep.js";
import type { ChecklistItem } from "./CompletionChecklist.js";

const TOTAL_STEPS = 5;

const stepVariants = {
  enter: { opacity: 0, x: 12 },
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const } },
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [about, setAbout] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState(true);

  function toggleFocusArea(area: string) {
    setFocusAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
  }

  const finishMutation = useMutation({
    mutationFn: async () => {
      // Persist the profile fields first; onboardingCompleted last, so a
      // failure part-way through doesn't mark onboarding done with nothing saved.
      const aboutMeParts = [
        goal && `I'm using believe.ai to ${goal}.`,
        about,
        focusAreas.length > 0 && `Focus areas: ${focusAreas.join(", ")}.`,
      ].filter(Boolean);
      if (aboutMeParts.length > 0) {
        await updateBelieveProfile({ aboutMe: aboutMeParts.join(" ") || null });
      }
      await apiClient.patch<ApiSuccessResponse<User>>("/auth/me", {
        ...(name ? { name } : {}),
        ...(company ? { company } : {}),
        aiRecommendationsEnabled: aiRecommendations,
        onboardingCompleted: true,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["believeProfile"] });
    },
  });

  /** Skip still marks onboarding complete — otherwise the user is trapped in the flow. */
  const skipMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch<ApiSuccessResponse<User>>("/auth/me", { onboardingCompleted: true });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/app", { replace: true });
    },
  });

  const busy = finishMutation.isPending || skipMutation.isPending;

  async function handleFinish(target: string) {
    await finishMutation.mutateAsync();
    navigate(target, { replace: true });
  }

  const checklist: ChecklistItem[] = [
    { label: "Profile created", done: true },
    { label: "Goal selected", done: !!goal },
    { label: "Workspace personalized", done: focusAreas.length > 0 || !!about },
    { label: "Recommendations enabled", done: aiRecommendations },
  ];

  return (
    <OnboardingShell step={step}>
      <AnimatePresence mode="wait">
        <motion.div key={step} variants={stepVariants} initial="enter" animate="center" exit="exit">
          {step === 0 && <WelcomeStep onStart={() => setStep(1)} onSkip={() => skipMutation.mutate()} />}

          {step === 1 && (
            <AboutYouStep
              name={name}
              company={company}
              about={about}
              onNameChange={setName}
              onCompanyChange={setCompany}
              onAboutChange={setAbout}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && <GoalStep goal={goal} onSelect={setGoal} onBack={() => setStep(1)} onNext={() => setStep(3)} />}

          {step === 3 && (
            <SetupWorkspaceStep
              focusAreas={focusAreas}
              onToggleFocusArea={toggleFocusArea}
              aiRecommendations={aiRecommendations}
              onToggleAi={setAiRecommendations}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <AllSetStep
              checklist={checklist}
              busy={busy}
              error={finishMutation.isError}
              onGoToDashboard={() => void handleFinish("/app")}
              onExploreWorkspace={() => void handleFinish("/app")}
              onTakeTour={() => void handleFinish("/app/how-to-use")}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {step > 0 && step < TOTAL_STEPS - 1 && (
        <button
          type="button"
          onClick={() => skipMutation.mutate()}
          disabled={busy}
          className="mx-auto mt-6 block text-sm text-fg-subtle transition-colors hover:text-fg disabled:opacity-60"
        >
          Skip for now
        </button>
      )}
    </OnboardingShell>
  );
}
