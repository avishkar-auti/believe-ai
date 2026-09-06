import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UNLIMITED, type UpdateUserContextInput, type User } from "@believe-ai/shared";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Button } from "../../components/ui/Button.js";
import { Badge } from "../../components/ui/Badge.js";
import { Toggle } from "../../components/ui/Toggle.js";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { apiClient } from "../../lib/apiClient.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { AppearanceSettings } from "./AppearanceSettings.js";
import { fetchBelieveProfile, updateBelieveProfile } from "./believeProfileApi.js";
import { fetchUsage } from "./usageApi.js";

const PROFILE_FIELDS: { key: keyof UpdateUserContextInput; label: string; placeholder: string }[] = [
  { key: "aboutMe", label: "About me", placeholder: "Who you are, in a sentence or two." },
  { key: "companyInfo", label: "Company", placeholder: "What your company does." },
  { key: "servicesOrProducts", label: "What you offer", placeholder: "Services or products you're reaching out about." },
  { key: "skillsAndExperience", label: "Skills & experience", placeholder: "Relevant background for outreach." },
  { key: "achievements", label: "Achievements", placeholder: "Notable wins worth referencing." },
  { key: "targetAudience", label: "Who you want to reach", placeholder: "Your typical recipient." },
];

export function ProfileSettingsPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", company: "", jobTitle: "", phone: "", timezone: "UTC" });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        company: user.company ?? "",
        jobTitle: user.jobTitle ?? "",
        phone: user.phone ?? "",
        timezone: user.timezone,
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<User>("/auth/me", {
        name: form.name,
        company: form.company || null,
        jobTitle: form.jobTitle || null,
        phone: form.phone || null,
        timezone: form.timezone,
      });
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Account"
        description="Your profile fills the sender variables in every template — edit here and every template, preview and scheduled follow-up updates with it."
        actions={
          <Link to="/app/profile" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
            Edit your public profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <AppearanceSettings />

      <Card>
        <CardHeader>
          <h2 className="text-h3 text-fg">Basic information</h2>
        </CardHeader>
        <CardBody>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="block text-sm text-fg-muted">
              Name
              <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="block text-sm text-fg-muted">
              Job title
              <Input
                className="mt-1"
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-fg-muted">
              Company
              <Input
                className="mt-1"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-fg-muted">
              Phone
              <Input
                className="mt-1"
                placeholder="Optional"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <span className="mt-1 block text-caption text-fg-subtle">Used by the {"{{phone}}"} variable. Never shown on your public profile.</span>
            </label>
            <label className="block text-sm text-fg-muted">
              Timezone
              <Input
                className="mt-1"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
              {updateMutation.isSuccess && <p className="text-sm text-positive">Saved.</p>}
            </div>
          </form>
        </CardBody>
      </Card>

      <BelieveProfileCard />
      <AiRecommendationsCard user={user} />
      <RecruiterModeCard user={user} />
      <PlanUsageCard />
    </div>
  );
}

function AiRecommendationsCard({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await apiClient.patch<User>("/auth/me", { aiRecommendationsEnabled: next });
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium text-fg">AI recommendations</h2>
          <p className="text-sm text-fg-muted">Get smarter suggestions and insights across the workspace.</p>
        </div>
        <Toggle
          checked={user?.aiRecommendationsEnabled ?? true}
          onChange={(v) => toggleMutation.mutate(v)}
          label="AI recommendations"
        />
      </CardBody>
    </Card>
  );
}

function RecruiterModeCard({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();
  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  const toggleMutation = useMutation({
    mutationFn: async (nextRole: "user" | "recruiter") => {
      const res = await apiClient.patch<User>("/auth/me", { role: nextRole });
      return res.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium text-fg">Recruiter mode</h2>
          <p className="text-sm text-fg-muted">Post and manage job listings on the Job Board.</p>
        </div>
        <Button
          variant={isRecruiter ? "secondary" : "primary"}
          disabled={toggleMutation.isPending || user?.role === "admin"}
          onClick={() => toggleMutation.mutate(isRecruiter ? "user" : "recruiter")}
        >
          {isRecruiter ? "Turn off" : "Turn on"}
        </Button>
      </CardBody>
    </Card>
  );
}

function PlanUsageCard() {
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: fetchUsage });

  if (!usage) return null;

  const rows = [
    { label: "Contacts", used: usage.contacts, limit: usage.limits.maxContacts },
    { label: "Campaigns", used: usage.campaigns, limit: usage.limits.maxCampaigns },
    { label: "Emails sent today", used: usage.emailsSentToday, limit: usage.limits.maxDailyEmails },
  ];

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium text-fg">Plan &amp; usage</h2>
          <Badge tone="info">{usage.plan}</Badge>
        </div>

        <div className="space-y-4">
          {rows.map(({ label, used, limit }) => {
            const unlimited = limit === UNLIMITED;
            const percent = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
            const atLimit = !unlimited && used >= limit;

            return (
              <div key={label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-fg">{label}</span>
                  <span className={atLimit ? "font-medium text-critical" : "text-fg-muted"}>
                    {used.toLocaleString()} / {unlimited ? "unlimited" : limit.toLocaleString()}
                  </span>
                </div>
                {!unlimited && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-surface-2">
                    <div
                      className={atLimit ? "h-full bg-critical" : "h-full bg-accent"}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function BelieveProfileCard() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["believeProfile"], queryFn: fetchBelieveProfile });
  const [form, setForm] = useState<UpdateUserContextInput>({});

  useEffect(() => {
    if (profile) {
      setForm({
        aboutMe: profile.aboutMe,
        companyInfo: profile.companyInfo,
        servicesOrProducts: profile.servicesOrProducts,
        skillsAndExperience: profile.skillsAndExperience,
        achievements: profile.achievements,
        targetAudience: profile.targetAudience,
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => updateBelieveProfile(form),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["believeProfile"] }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-h3 text-fg">Believe Profile</h2>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          Used automatically by the AI Writer and personalization so your emails reference your real situation.
        </p>
      </CardHeader>
      <CardBody>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          {PROFILE_FIELDS.map(({ key, label, placeholder }) => (
            <label key={key} className="block text-sm text-fg-muted">
              {label}
              <Textarea
                className="mt-1"
                rows={2}
                placeholder={placeholder}
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save profile"}
          </Button>
          {updateMutation.isSuccess && <p className="text-sm text-positive">Saved.</p>}
        </form>
      </CardBody>
    </Card>
  );
}
