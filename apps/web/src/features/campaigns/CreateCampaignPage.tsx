import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { CampaignFollowUp } from "@believe-ai/shared";
import { ApiError } from "../../lib/apiClient.js";
import { fetchTemplates } from "../templates/templatesApi.js";
import { fetchContacts } from "../contacts/contactsApi.js";
import { fetchResumes } from "../resumes/resumeApi.js";
import { createCampaign, fetchCampaigns, launchCampaign } from "./campaignsApi.js";
import { CampaignActionBar } from "./CampaignActionBar.js";
import { CampaignContentStep } from "./CampaignContentStep.js";
import { CampaignDetailsStep } from "./CampaignDetailsStep.js";
import { CampaignFollowUpsStep } from "./CampaignFollowUpsStep.js";
import { CampaignHeader } from "./CampaignHeader.js";
import { CampaignRecipientsStep } from "./CampaignRecipientsStep.js";
import { CampaignReviewStep } from "./CampaignReviewStep.js";
import { CampaignStepper } from "./CampaignStepper.js";
import { CampaignSummary } from "./CampaignSummary.js";
import { LaunchConfirmationModal } from "./LaunchConfirmationModal.js";

export function CreateCampaignPage() {
  const navigate = useNavigate();
  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });
  const { data: campaigns } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const { data: resumes } = useQuery({ queryKey: ["resumes"], queryFn: fetchResumes });

  const [step, setStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [dailyLimit, setDailyLimit] = useState(200);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<CampaignFollowUp[]>([]);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);

  const { data: contactsPage, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", "for-campaign", contactSearch],
    queryFn: () => fetchContacts({ search: contactSearch || undefined, page: 1, limit: 100 }),
  });

  const contacts = contactsPage?.items ?? [];
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
  const selectedRecipients = contacts.filter((c) => selectedIds.has(c.id));
  const templateName = templates?.find((t) => t.id === templateId)?.name;
  const attachedResume = resumes?.find((r) => r.id === resumeId);

  function addFollowUp() {
    setFollowUps((prev) => [...prev, { templateId: "", delayDays: prev.length === 0 ? 3 : 4, subjectOverride: null }]);
  }
  function updateFollowUp(index: number, patch: Partial<CampaignFollowUp>) {
    setFollowUps((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }
  function removeFollowUp(index: number) {
    setFollowUps((prev) => prev.filter((_, i) => i !== index));
  }
  function toggleAll() {
    setSelectedIds((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        for (const c of contacts) next.delete(c.id);
        return next;
      }
      const next = new Set(prev);
      for (const c of contacts) next.add(c.id);
      return next;
    });
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Couldn't create the campaign. Check the form and try again."),
  });

  const launchMutation = useMutation({
    mutationFn: launchCampaign,
    onError: (err) =>
      setError(
        err instanceof ApiError
          ? `The campaign was created as a draft, but launching it failed: ${err.message}`
          : "The campaign was created as a draft, but launching it failed — open it from Campaigns to try again.",
      ),
  });

  function validateStep(s: number): string | null {
    if (s === 1 && (!name.trim() || !subject.trim())) return "Give your campaign a name and a subject line.";
    if (s === 2 && selectedIds.size === 0) return "Select at least one contact for your audience.";
    if (s === 3 && !templateId) return "Select a template for the initial email.";
    if (s === 4 && followUps.some((f) => !f.templateId)) return "Select a template for every follow-up step, or remove the empty ones.";
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

  function buildInput() {
    return {
      name,
      subject,
      templateId,
      resumeId: resumeId || null,
      audienceContactIds: [...selectedIds],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dailyLimit,
      personalizationEnabled: true,
      trackingEnabled: true,
      followUps,
      stopOnReply,
    };
  }

  function handleSaveDraft() {
    const validationError = validateStep(1) || validateStep(2) || validateStep(3) || validateStep(4);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    createMutation.mutate(buildInput(), { onSuccess: (campaign) => navigate(`/app/campaigns/${campaign.id}`) });
  }

  async function handleConfirmLaunch() {
    setError(null);
    const campaign = await createMutation.mutateAsync(buildInput());
    await launchMutation.mutateAsync(campaign.id);
    navigate(`/app/campaigns/${campaign.id}`);
  }

  const submitting = createMutation.isPending || launchMutation.isPending;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <CampaignHeader onSaveDraft={handleSaveDraft} savingDraft={createMutation.isPending} />
      <CampaignStepper step={step} maxStepReached={maxStepReached} onSelect={goToStep} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-panel border border-line bg-surface p-5">
            {step === 1 && (
              <CampaignDetailsStep name={name} onNameChange={setName} subject={subject} onSubjectChange={setSubject} dailyLimit={dailyLimit} onDailyLimitChange={setDailyLimit} />
            )}
            {step === 2 && (
              <CampaignRecipientsStep
                contacts={contacts}
                contactsLoading={contactsLoading}
                selectedIds={selectedIds}
                onToggle={toggleOne}
                onToggleAll={toggleAll}
                allSelected={allSelected}
                search={contactSearch}
                onSearchChange={setContactSearch}
              />
            )}
            {step === 3 && (
              <CampaignContentStep
                subject={subject}
                templateId={templateId}
                onTemplateChange={setTemplateId}
                resumeId={resumeId}
                onResumeChange={setResumeId}
                templates={templates}
                resumes={resumes}
                campaigns={campaigns}
                recipients={selectedRecipients}
              />
            )}
            {step === 4 && (
              <CampaignFollowUpsStep
                followUps={followUps}
                templates={templates}
                onAdd={addFollowUp}
                onUpdate={updateFollowUp}
                onRemove={removeFollowUp}
                stopOnReply={stopOnReply}
                onStopOnReplyChange={setStopOnReply}
              />
            )}
            {step === 5 && (
              <CampaignReviewStep
                name={name}
                subject={subject}
                dailyLimit={dailyLimit}
                templateId={templateId}
                templates={templates}
                resumeId={resumeId}
                resumes={resumes}
                followUps={followUps}
                stopOnReply={stopOnReply}
                recipients={selectedRecipients}
              />
            )}
          </div>

          {error && <p className="text-sm text-critical">{error}</p>}

          <CampaignActionBar
            step={step}
            onBack={handleBack}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            onLaunch={() => setLaunchModalOpen(true)}
            submitting={submitting}
          />
        </div>

        <div className="lg:sticky lg:top-5 lg:self-start">
          <CampaignSummary
            name={name}
            audienceCount={selectedIds.size}
            templateName={templateName}
            resumeName={attachedResume ? (attachedResume.targetRole ?? attachedResume.fileName) : null}
            followUps={followUps}
            templates={templates}
            dailyLimit={dailyLimit}
          />
        </div>
      </div>

      <LaunchConfirmationModal
        open={launchModalOpen}
        onClose={() => setLaunchModalOpen(false)}
        onConfirm={() => {
          setLaunchModalOpen(false);
          void handleConfirmLaunch();
        }}
        launching={submitting}
        recipientCount={selectedIds.size}
        templateName={templateName}
        followUpCount={followUps.length}
        dailyLimit={dailyLimit}
      />
    </div>
  );
}
