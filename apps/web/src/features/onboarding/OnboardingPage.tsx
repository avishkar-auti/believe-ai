import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import type { ApiSuccessResponse, User } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { apiClient } from "../../lib/apiClient.js";
import { updateBelieveProfile } from "../settings/believeProfileApi.js";
import { cn } from "../../lib/cn.js";

const GOALS = [
  { value: "find a job", label: "Find a job" },
  { value: "generate leads", label: "Generate leads" },
  { value: "recruit candidates", label: "Recruit candidates" },
  { value: "find clients", label: "Find clients" },
  { value: "build my network", label: "Network" },
  { value: "promote my business", label: "Promote my business" },
  { value: "reach the right people", label: "Something else" },
];

const TOTAL_STEPS = 4;

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [about, setAbout] = useState("");

  const finishMutation = useMutation({
    mutationFn: async () => {
      // Persist the profile fields first; onboardingCompleted last, so a
      // failure part-way through doesn't mark onboarding done with nothing saved.
      if (goal || about) {
        await updateBelieveProfile({
          aboutMe: [goal && `I'm using believe.ai to ${goal}.`, about].filter(Boolean).join(" ") || null,
        });
      }
      await apiClient.patch<ApiSuccessResponse<User>>("/auth/me", {
        ...(name ? { name } : {}),
        ...(company ? { company } : {}),
        onboardingCompleted: true,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["believeProfile"] });
      navigate("/app", { replace: true });
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10 dark:bg-ink-900">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">believe.ai</span>
        </div>

        <div className="mb-5 flex items-center gap-2" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-brand-500" : "bg-ink-200 dark:bg-ink-700",
              )}
            />
          ))}
        </div>

        <Card>
          <CardBody className="space-y-5">
            {step === 0 && (
              <>
                <div>
                  <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Welcome to believe.ai</h1>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    Four quick questions so your AI-written emails sound like you from the very first send.
                  </p>
                </div>
                <Button className="w-full" onClick={() => setStep(1)}>
                  Get started
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <h1 className="text-xl font-semibold text-ink-900 dark:text-white">
                    What are you trying to achieve?
                  </h1>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">This shapes how the AI writes for you.</p>
                </div>
                <div role="radiogroup" aria-label="Your goal" className="space-y-2">
                  {GOALS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={goal === option.value}
                      onClick={() => setGoal(option.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                        goal === option.value
                          ? "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-200"
                          : "border-ink-200 text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800",
                      )}
                    >
                      {option.label}
                      {goal === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
                <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!goal} />
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Tell us about yourself</h1>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    Used as context for every AI email — you can change all of this later in Settings.
                  </p>
                </div>
                <label className="block text-sm text-ink-600 dark:text-ink-300">
                  Your name
                  <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam Believer" />
                </label>
                <label className="block text-sm text-ink-600 dark:text-ink-300">
                  Company <span className="text-ink-400">(optional)</span>
                  <Input className="mt-1" value={company} onChange={(e) => setCompany(e.target.value)} />
                </label>
                <label className="block text-sm text-ink-600 dark:text-ink-300">
                  A sentence about you
                  <Textarea
                    className="mt-1"
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="A backend engineer with 3 years of Node.js experience."
                  />
                </label>
                <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
              </>
            )}

            {step === 3 && (
              <>
                <div className="text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-brand-500" />
                  <h1 className="mt-3 text-xl font-semibold text-ink-900 dark:text-white">
                    You're ready to believe in your next opportunity.
                  </h1>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                    Next: connect an email provider and import your audience — then your first campaign is minutes away.
                  </p>
                </div>
                {finishMutation.isError && (
                  <p className="text-center text-sm text-red-600">
                    Couldn't save your details. Try again, or skip for now.
                  </p>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep(2)} disabled={busy}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => finishMutation.mutate()} disabled={busy}>
                    {finishMutation.isPending ? "Saving…" : "Go to dashboard"}
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        <button
          type="button"
          onClick={() => skipMutation.mutate()}
          disabled={busy}
          className="mx-auto mt-4 block text-sm text-ink-400 hover:text-ink-600 disabled:opacity-60 dark:hover:text-ink-200"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" className="flex-1" onClick={onBack}>
        Back
      </Button>
      <Button className="flex-1" onClick={onNext} disabled={nextDisabled}>
        Continue
      </Button>
    </div>
  );
}
