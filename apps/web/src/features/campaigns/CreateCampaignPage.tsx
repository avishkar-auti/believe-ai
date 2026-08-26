import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, FileText, Plus, Rocket, Send, Smile, Sparkles, Trash2, Users } from "lucide-react";
import type { CampaignFollowUp } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Button } from "../../components/ui/Button.js";
import { cn } from "../../lib/cn.js";
import { fetchTemplates } from "../templates/templatesApi.js";
import { fetchContacts } from "../contacts/contactsApi.js";
import { createCampaign, launchCampaign } from "./campaignsApi.js";

const STEPS = [
  { id: 1, title: "Details" },
  { id: 2, title: "Recipients" },
  { id: 3, title: "Content" },
  { id: 4, title: "Follow-ups" },
  { id: 5, title: "Review" },
] as const;

const FOCUS_RING = "focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:focus:border-violet-400";

export function CreateCampaignPage() {
  const navigate = useNavigate();
  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });
  const { data: contactsPage } = useQuery({
    queryKey: ["contacts", "for-campaign"],
    queryFn: () => fetchContacts({ page: 1 }),
  });

  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [dailyLimit, setDailyLimit] = useState(200);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [launchNow, setLaunchNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<CampaignFollowUp[]>([]);
  const [stopOnReply, setStopOnReply] = useState(true);

  function addFollowUp() {
    setFollowUps((prev) => [
      ...prev,
      { templateId: "", delayDays: prev.length === 0 ? 3 : 4, subjectOverride: null },
    ]);
  }

  function updateFollowUp(index: number, patch: Partial<CampaignFollowUp>) {
    setFollowUps((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeFollowUp(index: number) {
    setFollowUps((prev) => prev.filter((_, i) => i !== index));
  }

  const contacts = contactsPage?.items ?? [];
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
  const templateName = templates?.find((t) => t.id === templateId)?.name;

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: async (campaign) => {
      if (launchNow) {
        try {
          await launchCampaign(campaign.id);
        } catch {
          // campaign was still created as a draft; surface the launch failure on the detail page instead
        }
      }
      navigate(`/app/campaigns/${campaign.id}`);
    },
    onError: () => setError("Couldn't create the campaign. Check the form and try again."),
  });

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(contacts.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Per-step gate before advancing — returns an error message, or null if the step is satisfied. */
  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!name.trim() || !subject.trim()) return "Give your campaign a name and a subject line.";
    }
    if (s === 2) {
      if (selectedIds.size === 0) return "Select at least one contact for your audience.";
    }
    if (s === 3) {
      if (!templateId) return "Select a template for the initial email.";
    }
    if (s === 4) {
      if (followUps.some((f) => !f.templateId)) return "Select a template for every follow-up step, or remove the empty ones.";
    }
    return null;
  }

  function goToStep(target: number) {
    if (target <= maxStepReached) {
      setError(null);
      setStep(target);
    }
  }

  function handleNext() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const next = Math.min(5, step + 1);
    setStep(next);
    setMaxStepReached((m) => Math.max(m, next));
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit(shouldLaunch: boolean) {
    const validationError = validateStep(1) || validateStep(2) || validateStep(3) || validateStep(4);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLaunchNow(shouldLaunch);
    createMutation.mutate({
      name,
      subject,
      templateId,
      audienceContactIds: [...selectedIds],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dailyLimit,
      personalizationEnabled: true,
      trackingEnabled: true,
      followUps,
      stopOnReply,
    });
  }

  return (
    <div className="mx-auto max-w-content space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200/80 pb-5 dark:border-ink-700">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-[0_8px_20px_-8px_rgba(139,92,246,0.7)]">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Outreach workspace</p>
            <h1 className="text-title font-bold text-ink-900 dark:text-white">Create campaign</h1>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />
          Draft first
          <span className="text-violet-300 dark:text-violet-600">•</span>
          Launch when ready
        </span>
      </div>

      <StepIndicator step={step} maxStepReached={maxStepReached} onSelect={goToStep} />

      <Card className="overflow-hidden rounded-panel transition duration-200 hover:shadow-lift">
        <CardBody className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <StepTitle icon={<Send className="h-4 w-4" />} title="Campaign details" description="Name this outreach and set the email your recipients will see first." />
              <label className="block">
                <FieldLabel>Campaign name</FieldLabel>
                <div className="relative">
                  <Input
                    placeholder="Enter campaign name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn("pr-10", FOCUS_RING)}
                  />
                  <Sparkles className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300 dark:text-violet-600" />
                </div>
              </label>
              <label className="block">
                <FieldLabel>Subject line</FieldLabel>
                <div className="relative">
                  <Input
                    placeholder="Enter subject line"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={cn("pr-10", FOCUS_RING)}
                  />
                  <Smile className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300 dark:text-violet-600" />
                </div>
              </label>
              <label className="block">
                <FieldLabel>Daily sending limit</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={2000}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className={FOCUS_RING}
                />
                <p className="mt-1.5 text-xs text-ink-400">Maximum number of emails to send per day. You can change this later.</p>
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepTitle icon={<Users className="h-4 w-4" />} title="Choose your audience" description="Select the contacts that should receive this campaign." />
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium text-ink-900 dark:text-white">Audience ({selectedIds.size} selected)</h2>
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                  {allSelected ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {contacts.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition duration-150 hover:-translate-y-0.5 hover:shadow-sm",
                      selectedIds.has(c.id)
                        ? "border-violet-200 bg-violet-50/70 dark:border-violet-500/40 dark:bg-violet-500/10"
                        : "border-transparent hover:border-ink-200 hover:bg-ink-50 dark:hover:border-ink-700 dark:hover:bg-ink-800",
                    )}
                  >
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleOne(c.id)} className="accent-violet-500" />
                    <span className="text-sm text-ink-800 dark:text-ink-100">
                      {c.firstName} {c.lastName} · {c.email}
                    </span>
                  </label>
                ))}
                {contacts.length === 0 && <p className="text-sm text-ink-500 dark:text-ink-400">No contacts yet — add some first.</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepTitle icon={<FileText className="h-4 w-4" />} title="Choose the opening message" description="Pick an approved email template as the first touchpoint." />
              <label className="block">
                <FieldLabel>Initial email template</FieldLabel>
                <select
                  className={cn(
                    "h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm dark:border-ink-700 dark:bg-ink-800",
                    FOCUS_RING,
                  )}
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="">Select a template…</option>
                  {templates?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <StepTitle icon={<Plus className="h-4 w-4" />} title="Plan follow-ups" description="Set the timing and content of each reminder in the sequence." />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-ink-900 dark:text-white">Follow-ups</h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    Sent automatically days after the previous step, unless the recipient replies or unsubscribes.
                  </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addFollowUp}>
                  <Plus className="h-4 w-4" /> Add step
                </Button>
              </div>

              {followUps.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <input type="checkbox" checked={stopOnReply} onChange={(e) => setStopOnReply(e.target.checked)} className="accent-violet-500" />
                  Stop the sequence once a recipient replies
                </label>
              )}

              {followUps.map((followUp, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border border-ink-100 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-card dark:border-ink-800 dark:hover:border-violet-500/40"
                >
                  <span className="text-sm font-medium text-ink-500">Day {followUp.delayDays}</span>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={followUp.delayDays}
                    onChange={(e) => updateFollowUp(index, { delayDays: Number(e.target.value) })}
                    className={cn("w-20", FOCUS_RING)}
                  />
                  <select
                    className={cn(
                      "h-10 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800",
                      FOCUS_RING,
                    )}
                    value={followUp.templateId}
                    onChange={(e) => updateFollowUp(index, { templateId: e.target.value })}
                  >
                    <option value="">Select a template…</option>
                    {templates?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFollowUp(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {followUps.length === 0 && (
                <p className="text-sm text-ink-500 dark:text-ink-400">No follow-ups — this campaign will send once, with no reminders.</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <StepTitle icon={<Rocket className="h-4 w-4" />} title="Review before launch" description="Confirm audience, message, pacing, and follow-up timing." />
              <h2 className="font-medium text-ink-900 dark:text-white">Review</h2>
              <dl className="space-y-2 text-sm">
                <ReviewRow label="Name" value={name} />
                <ReviewRow label="Subject" value={subject} />
                <ReviewRow label="Daily limit" value={String(dailyLimit)} />
                <ReviewRow label="Audience" value={`${selectedIds.size} contact${selectedIds.size === 1 ? "" : "s"}`} />
                <ReviewRow label="Template" value={templateName ?? "—"} />
                <ReviewRow
                  label="Follow-ups"
                  value={followUps.length === 0 ? "None" : `${followUps.length} step${followUps.length === 1 ? "" : "s"}`}
                />
              </dl>
            </div>
          )}
        </CardBody>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white/70 p-3 shadow-sm dark:border-ink-800 dark:bg-ink-800/70">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-pill px-5 py-2.5 text-sm font-medium text-ink-600 transition-all duration-150 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-ink-300 dark:hover:bg-ink-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-pill bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(139,92,246,0.55)] transition-all duration-150 hover:scale-[1.02] hover:shadow-[0_10px_26px_-6px_rgba(139,92,246,0.7)] active:scale-[0.97]"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-2 rounded-pill border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 transition-all duration-150 hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-500/30 dark:bg-transparent dark:text-violet-300 dark:hover:bg-violet-500/10"
            >
              Save as draft
            </button>
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-2 rounded-pill bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(139,92,246,0.55)] transition-all duration-150 hover:scale-[1.02] hover:shadow-[0_10px_26px_-6px_rgba(139,92,246,0.7)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <Rocket className="h-4 w-4" /> Save and launch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-2 last:border-0 dark:border-ink-800">
      <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-900 dark:text-white">{value}</dd>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700 dark:text-ink-200">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
      {children}
    </span>
  );
}

function StepTitle({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="relative mb-5 flex items-start gap-3 border-b border-ink-100 pb-4 dark:border-ink-800">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-sm leading-5 text-ink-500 dark:text-ink-400">{description}</p>
      </div>
      <Sparkles className="pointer-events-none absolute right-0 top-0 hidden h-5 w-5 text-violet-200 dark:text-violet-500/20 sm:block" />
    </div>
  );
}

function StepIndicator({
  step,
  maxStepReached,
  onSelect,
}: {
  step: number;
  maxStepReached: number;
  onSelect: (s: number) => void;
}) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const isDone = s.id < step;
        const isActive = s.id === step;
        const isReachable = s.id <= maxStepReached;

        return (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              disabled={!isReachable}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-[0_8px_18px_-6px_rgba(139,92,246,0.7)] ring-4 ring-violet-500/15"
                  : isDone
                    ? "bg-violet-500 text-white shadow-[0_6px_14px_-6px_rgba(139,92,246,0.6)]"
                    : "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500",
                isReachable && !isActive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-card",
                !isReachable && "cursor-not-allowed",
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : s.id}
            </button>
            <span
              className={cn(
                "ml-2 hidden text-sm font-medium sm:inline",
                isActive ? "text-ink-900 dark:text-white" : "text-ink-400",
              )}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <span className={cn("mx-3 h-px w-6 transition-colors dark:bg-ink-700 sm:w-10", s.id < step ? "bg-violet-300" : "bg-ink-200")} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
