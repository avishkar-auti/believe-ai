import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { cancelRoom, fetchMyRooms, scheduleRoom } from "./interviewRoomApi.js";

const DURATIONS = [15, 30, 45, 60];

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
  const [guestEmail, setGuestEmail] = useState("");

  const { data: rooms, isLoading } = useQuery({ queryKey: ["mock-interview-rooms"], queryFn: fetchMyRooms });

  const scheduleMutation = useMutation({
    mutationFn: () =>
      scheduleRoom({
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        guestEmail: guestEmail || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mock-interview-rooms"] });
      setGuestEmail("");
      setShowForm(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRoom,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["mock-interview-rooms"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
            <Video className="h-5 w-5 text-brand-500" /> Live Practice Room
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Schedule a 1:1 video mock interview — the join link opens 10 minutes early.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Schedule"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </div>
            <Input
              placeholder="Invite by email (optional)"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
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
        <EmptyState title="No rooms scheduled" description="Schedule your first practice interview above." />
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardBody className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink-900 dark:text-white">
                      {new Date(room.scheduledAt).toLocaleString()}
                    </p>
                    <Badge tone={room.status === "scheduled" ? (room.joinable ? "success" : "neutral") : "neutral"}>
                      {room.status === "scheduled" ? (room.joinable ? "Live now" : room.status) : room.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-400">
                    {room.durationMinutes} min {room.guestEmail ? `· invited ${room.guestEmail}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {room.status === "scheduled" && (
                    <Link to={`/app/interview-room/${room.code}`}>
                      <Button size="sm" disabled={!room.joinable}>
                        Join
                      </Button>
                    </Link>
                  )}
                  {room.status === "scheduled" && (
                    <Button variant="ghost" size="sm" onClick={() => cancelMutation.mutate(room.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
