import { useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  Clock,
  LogIn,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import type { MockInterviewRoom } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Badge } from "../../components/ui/Badge.js";
import { Drawer } from "../../components/ui/Drawer.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import { SectionLabel, Surface } from "../../components/ui/Surface.js";
import { toast } from "../../components/ui/Toast.js";
import { useCountdown } from "../../hooks/useCountdown.js";
import { cn } from "../../lib/cn.js";
import { cancelRoom, fetchMyRooms, scheduleRoom } from "./interviewRoomApi.js";
import { avatarTint, initials } from "./room/roomFormat.js";

const DURATIONS = [15, 30, 45, 60];
const TARGET_SIZES = [3, 4, 5, 6];

type HubTab = "upcoming" | "past" | "cancelled";

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The practice-room hub: what's next, what's scheduled, and a way in by code. */
export function RoomListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<HubTab>("upcoming");
  const [pendingCancel, setPendingCancel] = useState<MockInterviewRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");

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
      toast("Practice room scheduled");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRoom,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mock-interview-rooms"] });
      setPendingCancel(null);
      toast("Room cancelled");
    },
  });

  const maxInvites = targetSize - 1;

  const grouped = useMemo(() => {
    const list = rooms ?? [];
    return {
      upcoming: list.filter((r) => r.status === "scheduled"),
      past: list.filter((r) => r.status === "completed"),
      cancelled: list.filter((r) => r.status === "cancelled"),
    };
  }, [rooms]);

  // Soonest scheduled room, so the hub always answers "what's next?" first.
  const nextRoom = useMemo(
    () =>
      [...grouped.upcoming].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      )[0] ?? null,
    [grouped.upcoming],
  );

  const visible = grouped[tab];

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Group practice rooms"
        description="Peer interview practice for 3–6 people. AI generates the questions, rotates the turns, and writes the recap."
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Schedule room
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {nextRoom ? (
          <NextSessionCard room={nextRoom} />
        ) : (
          <Surface level={2} className="flex flex-col justify-center p-6">
            <SectionLabel>Next session</SectionLabel>
            <p className="mt-2 text-h2 text-fg">Nothing on the calendar</p>
            <p className="mt-1 text-sm text-fg-muted">
              Schedule a room and invite up to five peers — reminders go out by email.
            </p>
            <Button className="mt-4 self-start" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Schedule your first room
            </Button>
          </Surface>
        )}

        <Surface level={2} className="p-5">
          <SectionLabel>Join with a code</SectionLabel>
          <p className="mt-1.5 text-sm text-fg-muted">Got a room code from a peer? Drop it in.</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const code = joinCode.trim();
              if (code) navigate(`/app/interview-room/${code}`);
            }}
          >
            <Input
              placeholder="Room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              aria-label="Room code"
            />
            <Button type="submit" variant="secondary" disabled={!joinCode.trim()}>
              Join
            </Button>
          </form>

          <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-fg-muted">
            <p className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              Questions are AI-generated from your topic and target role.
            </p>
            <p className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              The join window opens 10 minutes before the start.
            </p>
          </div>
        </Surface>
      </div>

      <div className="flex gap-1.5" role="tablist" aria-label="Room groups">
        {(
          [
            ["upcoming", "Upcoming", grouped.upcoming.length],
            ["past", "Completed", grouped.past.length],
            ["cancelled", "Cancelled", grouped.cancelled.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-pill px-3.5 py-1.5 text-label font-medium transition-colors",
              tab === id ? "bg-fg/[0.08] text-fg" : "text-fg-subtle hover:text-fg",
            )}
          >
            {label} <span className="tabular-nums text-fg-subtle">{count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Video className="h-5 w-5" />}
          title={tab === "upcoming" ? "No rooms scheduled" : tab === "past" ? "No completed sessions yet" : "Nothing cancelled"}
          description={
            tab === "upcoming"
              ? "Schedule a practice room and invite your peers."
              : "Finished sessions and their AI recaps will show up here."
          }
          action={tab === "upcoming" ? <Button onClick={() => setShowForm(true)}>Schedule room</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((room) => (
            <RoomCard key={room.id} room={room} onCancel={() => setPendingCancel(room)} />
          ))}
        </div>
      )}

      <Drawer
        open={showForm}
        title="Schedule a practice room"
        subtitle="3–6 people, AI questions, rotating turns"
        onClose={() => setShowForm(false)}
        footer={
          <div className="flex items-center gap-2">
            <Button onClick={() => scheduleMutation.mutate()} disabled={scheduleMutation.isPending}>
              {scheduleMutation.isPending ? "Scheduling…" : "Schedule room"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-label text-fg-muted">Date &amp; time</span>
            <Input className="mt-1" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-label text-fg-muted">Duration</span>
              <select
                className="mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-line-strong"
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
            <label className="block">
              <span className="text-label text-fg-muted">Group size</span>
              <select
                className="mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-fg outline-none focus:border-line-strong"
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
            <span className="text-label text-fg-muted">
              Invite by email — up to {maxInvites} ({inviteEmails.length}/{maxInvites})
            </span>
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
                    className="flex items-center gap-1 rounded-pill bg-fg/[0.06] px-2.5 py-1 text-caption text-fg-muted"
                  >
                    {email}
                    <button type="button" onClick={() => setInviteEmails((prev) => prev.filter((e) => e !== email))} aria-label={`Remove ${email}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-label text-fg-muted">Topic (optional) — tailors the AI questions</span>
            <Input
              className="mt-1"
              placeholder="e.g. System design, behavioural, frontend"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>

          {scheduleMutation.isError && (
            <p className="text-label text-critical">Couldn't schedule — try a different time.</p>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Cancel this room?"
        description="Invited peers won't be able to join. This can't be undone."
        confirmLabel="Cancel room"
        cancelLabel="Keep it"
        destructive
        busy={cancelMutation.isPending}
        onConfirm={() => pendingCancel && cancelMutation.mutate(pendingCancel.id)}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
}

/** Hero card for the soonest scheduled room, with the live countdown. */
function NextSessionCard({ room }: { room: MockInterviewRoom }) {
  const { label, elapsed } = useCountdown(room.scheduledAt);
  const date = new Date(room.scheduledAt);
  const active = room.participants.filter((p) => !p.leftAt);

  return (
    <Surface level={2} className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel>Next session</SectionLabel>
          <Badge tone={room.joinable ? "success" : "accent"}>
            {room.joinable ? "Join window open" : elapsed ? "Starting…" : `Starts in ${label}`}
          </Badge>
        </div>

        <h2 className="mt-2 text-h1 text-fg">{room.topic || "Practice session"}</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} ·{" "}
          {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {room.durationMinutes} min
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {active.slice(0, 5).map((p) => (
              <span
                key={p.userId}
                title={p.name}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-pill text-caption font-semibold ring-2 ring-surface",
                  avatarTint(p.userId),
                )}
              >
                {initials(p.name)}
              </span>
            ))}
            {active.length === 0 && (
              <span className="grid h-8 w-8 place-items-center rounded-pill bg-fg/[0.06] text-fg-subtle">
                <Users className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
          </div>
          <p className="text-label text-fg-muted">
            {active.length}/{room.maxParticipants} joined · needs {room.minParticipants} to start
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link to={`/app/interview-room/${room.code}`}>
            <Button disabled={!room.joinable}>
              <LogIn className="h-4 w-4" /> {room.joinable ? "Join room" : "Opens 10 min early"}
            </Button>
          </Link>
          <span className="rounded-pill bg-fg/[0.06] px-3 py-1.5 font-mono text-caption uppercase tracking-wider text-fg-muted">
            {room.code}
          </span>
        </div>
      </div>
    </Surface>
  );
}

function RoomCard({ room, onCancel }: { room: MockInterviewRoom; onCancel: () => void }) {
  const isScheduled = room.status === "scheduled";
  const isCompleted = room.status === "completed";
  const date = new Date(room.scheduledAt);

  return (
    <Surface
      level={2}
      interactive={room.status !== "cancelled"}
      className={cn("group relative flex flex-col p-5", room.status === "cancelled" && "opacity-60")}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <Video className="h-5 w-5" aria-hidden />
        </span>
        {isScheduled ? (
          <Badge tone={room.joinable ? "success" : "neutral"}>{room.joinable ? "Live now" : "Scheduled"}</Badge>
        ) : (
          <Badge tone={isCompleted ? "info" : "neutral"}>{room.status}</Badge>
        )}
      </div>

      <h3 className="mt-4 text-h3 text-fg">{room.topic || "Practice session"}</h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {room.durationMinutes}m
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {room.participants.length}/{room.maxParticipants}
        </span>
        {room.inviteEmails.length > 0 && (
          <span className="inline-flex items-center gap-1.5" title={room.inviteEmails.join(", ")}>
            <Mail className="h-3.5 w-3.5" aria-hidden />
            {room.inviteEmails.length}
          </span>
        )}
      </div>

      <div className="mt-auto pt-5">
        {isScheduled && (
          <Link to={`/app/interview-room/${room.code}`} className="block">
            <Button className="w-full" disabled={!room.joinable}>
              <LogIn className="h-4 w-4" /> Join room
            </Button>
          </Link>
        )}
        {isCompleted && (
          <Link to={`/app/interview-room/${room.code}/summary`} className="block">
            <Button className="w-full" variant="secondary">
              View recap <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {isScheduled && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel room"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-pill text-fg-subtle opacity-0 transition-opacity hover:bg-critical/10 hover:text-critical focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </Surface>
  );
}
