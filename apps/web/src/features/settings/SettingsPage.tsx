import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UNLIMITED, type ApiSuccessResponse, type UpdateUserContextInput, type User } from "@believe-ai/shared";
import { Sparkles } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Button } from "../../components/ui/Button.js";
import { Badge } from "../../components/ui/Badge.js";
import { apiClient } from "../../lib/apiClient.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
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

export function SettingsPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", company: "", jobTitle: "", timezone: "UTC" });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        company: user.company ?? "",
        jobTitle: user.jobTitle ?? "",
        timezone: user.timezone,
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<ApiSuccessResponse<User>>("/auth/me", {
        name: form.name,
        company: form.company || null,
        jobTitle: form.jobTitle || null,
        timezone: form.timezone,
      });
      return res.data.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Settings</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Your default sender information for outreach.</p>
      </div>

      <Card>
        <CardBody>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm text-ink-600 dark:text-ink-300">
              Name
              <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="block text-sm text-ink-600 dark:text-ink-300">
              Company
              <Input
                className="mt-1"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-ink-600 dark:text-ink-300">
              Job title
              <Input
                className="mt-1"
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-ink-600 dark:text-ink-300">
              Timezone
              <Input
                className="mt-1"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              />
            </label>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
            {updateMutation.isSuccess && <p className="text-sm text-lime-600">Saved.</p>}
          </form>
        </CardBody>
      </Card>

      <BelieveProfileCard />
      <RecruiterModeCard user={user} />
      <PlanUsageCard />
    </div>
  );
}

function RecruiterModeCard({ user }: { user: User | undefined }) {
  const queryClient = useQueryClient();
  const isRecruiter = user?.role === "recruiter" || user?.role === "admin";

  const toggleMutation = useMutation({
    mutationFn: async (nextRole: "user" | "recruiter") => {
      const res = await apiClient.patch<ApiSuccessResponse<User>>("/auth/me", { role: nextRole });
      return res.data.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-medium text-ink-900 dark:text-white">Recruiter mode</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Post and manage job listings on the Job Board.
          </p>
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
          <h2 className="font-medium text-ink-900 dark:text-white">Plan &amp; usage</h2>
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
                  <span className="text-ink-700 dark:text-ink-200">{label}</span>
                  <span className={atLimit ? "font-medium text-red-600" : "text-ink-500 dark:text-ink-400"}>
                    {used.toLocaleString()} / {unlimited ? "unlimited" : limit.toLocaleString()}
                  </span>
                </div>
                {!unlimited && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <div
                      className={atLimit ? "h-full bg-red-500" : "h-full bg-brand-500"}
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
      <CardBody>
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <h2 className="font-medium text-ink-900 dark:text-white">Believe Profile</h2>
        </div>
        <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
          Used automatically by the AI Writer and personalization so your emails reference your real situation.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
        >
          {PROFILE_FIELDS.map(({ key, label, placeholder }) => (
            <label key={key} className="block text-sm text-ink-600 dark:text-ink-300">
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
          {updateMutation.isSuccess && <p className="text-sm text-lime-600">Saved.</p>}
        </form>
      </CardBody>
    </Card>
  );
}
