import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, ShieldAlert, Users, Video, VideoOff } from "lucide-react";
import type { MockInterviewRoom } from "@believe-ai/shared";
import { Button } from "../../../components/ui/Button.js";
import { Badge } from "../../../components/ui/Badge.js";
import { SectionLabel } from "../../../components/ui/Surface.js";
import { Spinner } from "../../../components/ui/Spinner.js";
import { avatarTint, initials } from "./roomFormat.js";
import { cn } from "../../../lib/cn.js";

export interface JoinPreferences {
  micOn: boolean;
  cameraOn: boolean;
  audioDeviceId: string | null;
  videoDeviceId: string | null;
}

/**
 * Device check before entering. Uses a throwaway preview stream so the user can
 * confirm their real camera and mic, then hands the chosen devices to the page
 * which owns the actual call media. Permission denial is surfaced honestly —
 * joining audio-only stays possible because the signalling path allows it.
 */
export function PreJoinScreen({
  room,
  userName,
  userId,
  joining,
  onJoin,
}: {
  room: MockInterviewRoom;
  userName: string;
  userId: string;
  joining: boolean;
  onJoin: (prefs: JoinPreferences) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDeviceId, setAudioDeviceId] = useState<string | null>(null);
  const [videoDeviceId, setVideoDeviceId] = useState<string | null>(null);
  const [permission, setPermission] = useState<"pending" | "granted" | "denied">("pending");

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
          video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        stopPreview();
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setPermission("granted");
        const list = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(list.filter((d) => d.kind === "audioinput" || d.kind === "videoinput"));
      } catch {
        if (!cancelled) setPermission("denied");
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [audioDeviceId, videoDeviceId, stopPreview]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
    stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn, cameraOn]);

  const audioInputs = devices.filter((d) => d.kind === "audioinput");
  const videoInputs = devices.filter((d) => d.kind === "videoinput");
  const showPreview = permission === "granted" && cameraOn;

  return (
    <div className="grid flex-1 items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-fg/[0.06] ring-1 ring-inset ring-line">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn("h-full w-full object-cover", showPreview ? "opacity-100" : "opacity-0")}
          />

          {!showPreview && (
            <div className="absolute inset-0 grid place-items-center px-6 text-center">
              {permission === "pending" ? (
                <p className="flex items-center gap-2 text-label text-fg-muted">
                  <Spinner className="h-4 w-4" /> Checking your camera and microphone…
                </p>
              ) : permission === "denied" ? (
                <div className="max-w-xs">
                  <ShieldAlert className="mx-auto h-6 w-6 text-caution" aria-hidden />
                  <p className="mt-2 text-h3 text-fg">Camera and mic blocked</p>
                  <p className="mt-1 text-caption text-fg-muted">
                    Allow access in your browser to be seen and heard. You can still join and listen.
                  </p>
                </div>
              ) : (
                <div className={cn("grid h-20 w-20 place-items-center rounded-pill text-h1 font-semibold", avatarTint(userId))}>
                  {initials(userName)}
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 pb-4">
            <button
              type="button"
              onClick={() => setMicOn((v) => !v)}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
              aria-pressed={micOn}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-pill backdrop-blur transition-colors",
                micOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-critical text-white",
              )}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setCameraOn((v) => !v)}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              aria-pressed={cameraOn}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-pill backdrop-blur transition-colors",
                cameraOn ? "bg-white/15 text-white hover:bg-white/25" : "bg-critical text-white",
              )}
            >
              {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {permission === "granted" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <DeviceSelect
              label="Microphone"
              devices={audioInputs}
              value={audioDeviceId}
              onChange={setAudioDeviceId}
              fallback="System default"
            />
            <DeviceSelect
              label="Camera"
              devices={videoInputs}
              value={videoDeviceId}
              onChange={setVideoDeviceId}
              fallback="System default"
            />
          </div>
        )}
      </div>

      <div className="surface-2 surface-edge rounded-2xl p-5">
        <SectionLabel>Ready to join</SectionLabel>
        <h1 className="mt-2 text-h1 text-fg">{room.topic ?? "Group practice room"}</h1>
        <p className="mt-1 text-label text-fg-muted">
          Hosted by {room.hostName} · {room.durationMinutes} min
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="neutral">
            <Users className="mr-1 h-3 w-3" aria-hidden /> {room.participants.filter((p) => !p.leftAt).length}/
            {room.maxParticipants} here
          </Badge>
          {room.targetRole && <Badge tone="neutral">{room.targetRole}</Badge>}
          <Badge tone={room.joinable ? "success" : "warning"}>{room.joinable ? "Join window open" : "Outside join window"}</Badge>
        </div>

        <dl className="mt-5 space-y-2.5 text-label">
          <div className="flex justify-between gap-3">
            <dt className="text-fg-subtle">Scheduled</dt>
            <dd className="text-right text-fg">{new Date(room.scheduledAt).toLocaleString()}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-fg-subtle">Needs</dt>
            <dd className="text-fg">{room.minParticipants} people to start</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-fg-subtle">Questions</dt>
            <dd className="text-fg">{room.questions.length || "Generated live"}</dd>
          </div>
        </dl>

        <Button
          className="mt-5 w-full"
          size="lg"
          disabled={joining}
          onClick={() => {
            stopPreview();
            onJoin({ micOn, cameraOn, audioDeviceId, videoDeviceId });
          }}
        >
          {joining ? "Joining…" : "Join room"}
        </Button>
        <p className="mt-2 text-center text-caption text-fg-subtle">
          Everyone hears everyone. Turns rotate per question.
        </p>
      </div>
    </div>
  );
}

function DeviceSelect({
  label,
  devices,
  value,
  onChange,
  fallback,
}: {
  label: string;
  devices: MediaDeviceInfo[];
  value: string | null;
  onChange: (id: string | null) => void;
  fallback: string;
}) {
  return (
    <label className="block">
      <span className="text-caption text-fg-subtle">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="mt-1 h-9 w-full rounded-xl border border-line bg-surface px-2.5 text-label text-fg outline-none focus:border-line-strong"
      >
        <option value="">{fallback}</option>
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || label}
          </option>
        ))}
      </select>
    </label>
  );
}
