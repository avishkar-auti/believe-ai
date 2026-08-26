import { useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Plus, Trash2, X, Clock, Users, Mail, ArrowRight, Calendar, LogIn } from "lucide-react";
import type { MockInterviewRoom } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { cn } from "../../lib/cn.js";
import { cancelRoom, fetchMyRooms, scheduleRoom } from "./interviewRoomApi.js";

const DURATIONS = [15, 30, 45, 60];
const TARGET_SIZES = [3, 4, 5, 6];

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function RoomListPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const defaultTime = new Date(Date.now() + 30 * 60_000);
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTimeInputValue(defaultTime));
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [targetSize, setTargetSize] = useState(4);
  const [emailInput, setEmailInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [topic, setTopic] = useState("");

  // Refetches periodically so `joinable` (and the Join button it gates)
  // flips on by itself once the window opens, in step with the live countdown.
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["mock-interview-rooms"],
    queryFn: fetchMyRooms,
    refetchInterval: 30_000,
  });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      scheduleRoom({
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        targetSize,
        inviteEmails,
        topic: topic.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mock-interview-rooms"] });
      setInviteEmails([]);
      setEmailInput("");
      setTopic("");
      setShowForm(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRoom,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["mock-interview-rooms"] }),
  });

  const maxInvites = targetSize - 1;

  function addEmail() {
    const email = emailInput.trim();
    if (!email || inviteEmails.includes(email) || inviteEmails.length >= maxInvites) return;
    setInviteEmails((prev) => [...prev, email]);
    setEmailInput("");
  }

  function handleEmailKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  }

  function removeEmail(email: string) {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
            <Video className="h-5 w-5 text-brand-500" /> Group Practice Room
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Schedule a peer practice room for 3–6 people — the join link opens 10 minutes early.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Schedule"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-sm text-ink-600 dark:text-ink-300">
                Date &amp; time
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </label>
              <label className="block text-sm text-ink-600 dark:text-ink-300">
                Duration
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} minutes
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-ink-600 dark:text-ink-300">
                Group size
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-white"
                  value={targetSize}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    setTargetSize(size);
                    setInviteEmails((prev) => prev.slice(0, size - 1));
                  }}
                >
                  {TARGET_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} people
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <label className="block text-sm text-ink-600 dark:text-ink-300">
                Invite by email — up to {maxInvites} ({inviteEmails.length}/{maxInvites})
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="name@example.com"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  disabled={inviteEmails.length >= maxInvites}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addEmail}
                  disabled={!emailInput.trim() || inviteEmails.length >= maxInvites}
                >
                  Add
                </Button>
              </div>
              {inviteEmails.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {inviteEmails.map((email) => (
                    <span
                      key={email}
                      className="flex items-center gap-1 rounded-pill bg-ink-100 px-2.5 py-1 text-xs text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                    >
                      {email}
                      <button type="button" onClick={() => removeEmail(email)} aria-label={`Remove ${email}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <label className="block text-sm text-ink-600 dark:text-ink-300">
              Topic (optional) — helps tailor AI-generated questions
              <Input
                className="mt-1"
                placeholder="e.g. System design, behavioral, frontend"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>

            <Button onClick={() => scheduleMutation.mutate()} disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending ? "Scheduling…" : "Schedule room"}
            </Button>
            {scheduleMutation.isError && <p className="text-sm text-red-600">Couldn't schedule — try a different time.</p>}
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-400" />
        </div>
      ) : !rooms || rooms.length === 0 ? (
        <EmptyState title="No rooms scheduled" description="Schedule your first practice room above." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onCancel={() => cancelMutation.mutate(room.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/** "Live now" once the join window is open, otherwise a live countdown to
 * the scheduled start (ticks every second) — shown in the viewer's own
 * local time zone, same as the date/time text below it. */
function RoomStatusPill({ scheduledAt, joinable }: { scheduledAt: string; joinable: boolean }) {
  const { label, elapsed } = useCountdown(scheduledAt);

  if (joinable) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-500/25 bg-lime-500/10 px-3.5 py-1.5 text-sm text-lime-600 dark:text-lime-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-500" />
        Live now
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-3.5 py-1.5 text-sm text-ink-500 dark:text-ink-400">
      <Clock className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
      {elapsed ? (
        <span className="font-semibold text-violet-600 dark:text-violet-300">Starting…</span>
      ) : (
        <>
          Starts in <span className="font-semibold text-violet-600 dark:text-violet-300">{label}</span>
        </>
      )}
    </span>
  );
}

function StatChip({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </span>
  );
}

function RoomCard({ room, onCancel }: { room: MockInterviewRoom; onCancel: () => void }) {
  const isScheduled = room.status === "scheduled";
  const isCompleted = room.status === "completed";
  const isCancelled = room.status === "cancelled";
  const date = new Date(room.scheduledAt);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border p-5 transition-all duration-300",
        "border-violet-500/15 bg-white shadow-[0_1px_2px_rgba(14,15,20,0.04),0_16px_40px_-24px_rgba(139,92,246,0.35)]",
        "dark:border-violet-500/20 dark:bg-[#0d0a17] dark:shadow-[0_0_0_1px_rgba(139,92,246,0.06),0_20px_60px_-24px_rgba(139,92,246,0.35)]",
        isCancelled
          ? "opacity-60"
          : "hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_1px_2px_rgba(14,15,20,0.04),0_20px_50px_-20px_rgba(139,92,246,0.5)] dark:hover:border-violet-400/40 dark:hover:shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_26px_70px_-20px_rgba(139,92,246,0.55)]",
      )}
    >
      {/* Ambient glow, dark mode only — a soft violet bloom in the corner. */}
      <div className="pointer-events-none absolute -right-10 -top-10 hidden h-40 w-40 rounded-full bg-violet-600/20 blur-3xl dark:block" />

      {isScheduled && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel room"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-300 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 group-hover:opacity-100 dark:text-ink-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-[0_8px_24px_-6px_rgba(139,92,246,0.65),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110">
          <Video className="h-6 w-6 text-white" />
        </div>
        {isScheduled ? (
          <RoomStatusPill scheduledAt={room.scheduledAt} joinable={room.joinable} />
        ) : (
          <Badge tone={isCompleted ? "info" : "neutral"}>{room.status}</Badge>
        )}
      </div>

      <div className="relative mt-5">
        <h3 className="text-xl font-bold leading-snug text-ink-900 dark:text-white">{room.topic || "Practice session"}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="text-ink-200 dark:text-ink-700">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="relative my-4 h-px bg-violet-500/10 dark:bg-white/5" />

      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2">
        <StatChip icon={Clock} label={`${room.durationMinutes} min`} />
        <StatChip icon={Users} label={`${room.participants.length}/${room.maxParticipants}`} />
        {room.inviteEmails.length > 0 && (
          <span title={room.inviteEmails.join(", ")}>
            <StatChip icon={Mail} label={`${room.inviteEmails.length} invited`} />
          </span>
        )}
      </div>

      <div className="relative mt-5">
        {isScheduled && (
          <Link to={`/app/interview-room/${room.code}`} className="group/btn block">
            <button
              type="button"
              disabled={!room.joinable}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(139,92,246,0.55)] transition-all duration-200 hover:shadow-[0_12px_32px_-6px_rgba(139,92,246,0.75)] hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:from-ink-300 disabled:to-ink-300 disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100 dark:disabled:from-ink-700 dark:disabled:to-ink-700"
            >
              <LogIn className="h-4 w-4" />
              Join room
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </button>
          </Link>
        )}
        {isCompleted && (
          <Link to={`/app/interview-room/${room.code}/summary`} className="group/btn block">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] py-3.5 text-sm font-semibold text-ink-700 transition-all duration-200 hover:border-violet-400/40 hover:bg-violet-500/10 dark:text-ink-200"
            >
              View summary
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
