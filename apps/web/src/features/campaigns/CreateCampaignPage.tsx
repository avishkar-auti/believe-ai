import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check, Plus, Trash2 } from "lucide-react";
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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Create campaign</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Select your audience, choose a template, and launch responsibly.</p>
      </div>

      <StepIndicator step={step} maxStepReached={maxStepReached} onSelect={goToStep} />

      <Card>
        <CardBody className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <Input placeholder="Campaign name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Subject line" required value={subject} onChange={(e) => setSubject(e.target.value)} />
              <label className="block text-sm text-ink-600 dark:text-ink-300">
                Daily sending limit
                <Input
                  type="number"
                  min={1}
                  max={2000}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="mt-1"
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium text-ink-900 dark:text-white">Audience ({selectedIds.size} selected)</h2>
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                  {allSelected ? "Deselect all" : "Select all"}
                </Button>
              </div>
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {contacts.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-ink-50 dark:hover:bg-ink-800">
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleOne(c.id)} />
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
              <h2 className="mb-3 font-medium text-ink-900 dark:text-white">Initial email template</h2>
              <select
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800"
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
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
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
                  <input type="checkbox" checked={stopOnReply} onChange={(e) => setStopOnReply(e.target.checked)} />
                  Stop the sequence once a recipient replies
                </label>
              )}

              {followUps.map((followUp, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-ink-100 p-3 dark:border-ink-800">
                  <span className="text-sm font-medium text-ink-500">Day {followUp.delayDays}</span>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={followUp.delayDays}
                    onChange={(e) => updateFollowUp(index, { delayDays: Number(e.target.value) })}
                    className="w-20"
                  />
                  <select
                    className="h-10 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800"
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

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 1}>
          Back
        </Button>

        {step < 5 ? (
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button type="button" disabled={createMutation.isPending} onClick={() => handleSubmit(false)}>
              Save as draft
            </Button>
            <Button type="button" variant="secondary" disabled={createMutation.isPending} onClick={() => handleSubmit(true)}>
              Save and launch
            </Button>
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
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                isActive
                  ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                  : isDone
                    ? "bg-brand-500 text-white"
                    : "bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500",
                isReachable && !isActive && "cursor-pointer",
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
            {i < STEPS.length - 1 && <span className="mx-3 h-px w-6 bg-ink-200 dark:bg-ink-700 sm:w-10" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}
