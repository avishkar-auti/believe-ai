import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { fetchIntegrations, getConnectUrl } from "../integrations/integrationsApi.js";
import { Toggle } from "../../components/ui/Toggle.js";
import { FOCUS_AREAS } from "./onboardingData.js";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

/** Every action here is real, reused functionality — the same integrations
 * API the authenticated app already uses — not a placeholder mockup of
 * features that don't exist. Contacts CSV import is deliberately not
 * offered here — it stays a Contacts-page-only action. */
export function SetupWorkspaceStep({
  focusAreas,
  onToggleFocusArea,
  aiRecommendations,
  onToggleAi,
  onBack,
  onNext,
}: {
  focusAreas: string[];
  onToggleFocusArea: (area: string) => void;
  aiRecommendations: boolean;
  onToggleAi: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { data: integrations } = useQuery({ queryKey: ["integrations"], queryFn: fetchIntegrations });
  const gmailConnected = integrations?.find((i) => i.provider === "gmail");

  const connectMutation = useMutation({
    mutationFn: () => getConnectUrl("gmail"),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="mx-auto max-w-lg">
      <motion.div variants={item} className="text-center">
        <h1 className="text-[26px] font-semibold tracking-tight text-fg">Almost there! Let&rsquo;s set up a few things.</h1>
        <p className="mt-1.5 text-[14px] text-fg-subtle">You can change these anytime in settings.</p>
      </motion.div>

      <div className="mt-8 space-y-3">
        <motion.div variants={item} className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-fg">Connect email provider</p>
              <p className="truncate text-[12px] text-fg-subtle">
                {gmailConnected ? gmailConnected.email : "Sync your inbox and track conversations."}
              </p>
            </div>
          </div>
          {gmailConnected ? (
            <span className="shrink-0 rounded-pill bg-positive/10 px-3 py-1 text-[12px] font-medium text-positive">
              Connected
            </span>
          ) : (
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? "Connecting…" : "Connect"}
            </Button>
          )}
        </motion.div>

        <motion.div variants={item} className="rounded-card border border-line bg-surface p-4 shadow-card">
          <p className="text-[14px] font-medium text-fg">Select your focus areas</p>
          <p className="text-[12px] text-fg-subtle">We&rsquo;ll customize your dashboard for you.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => {
              const selected = focusAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggleFocusArea(area)}
                  className={`rounded-pill border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
                    selected
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line text-fg-subtle hover:border-line-strong"
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={item} className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-fg">Enable AI recommendations</p>
              <p className="truncate text-[12px] text-fg-subtle">Get smarter suggestions and insights.</p>
            </div>
          </div>
          <Toggle checked={aiRecommendations} onChange={onToggleAi} label="Enable AI recommendations" />
        </motion.div>
      </div>

      <motion.div variants={item} className="mt-8 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
