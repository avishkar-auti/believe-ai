import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { firebaseAuth } from "../../lib/firebase.js";
import { fetchIceServers, fetchRoomByCode, getSignalingWsUrl, type IceServer } from "./interviewRoomApi.js";

type CallStatus = "connecting" | "waiting" | "connected" | "peer-left" | "ended" | "error";

/** video+audio -> audio-only -> video-only -> no media — a missing camera or
 * mic should never block joining the call entirely. */
async function acquireLocalMedia(): Promise<MediaStream | null> {
  const attempts: MediaStreamConstraints[] = [
    { video: true, audio: true },
    { video: false, audio: true },
    { video: true, audio: false },
  ];
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      continue;
    }
  }
  return null;
}

export function RoomCallPage() {
  const { code = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const { data: room } = useQuery({ queryKey: ["mock-interview-room", code], queryFn: () => fetchRoomByCode(code) });
  const { data: iceServers } = useQuery({ queryKey: ["ice-servers"], queryFn: fetchIceServers });

  useEffect(() => {
    if (!iceServers) return; // wait for ICE config before opening the signaling connection
    const servers = iceServers;
    let cancelled = false;

    async function connect() {
      const user = firebaseAuth.currentUser;
      if (!user) {
        setStatus("error");
        setErrorMessage("Sign-in expired — reload and try again.");
        return;
      }
      const token = await user.getIdToken();

      const localStream = await acquireLocalMedia();
      if (cancelled) return;
      localStreamRef.current = localStream;
      if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream;

      const ws = new WebSocket(`${getSignalingWsUrl()}?token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`);
      wsRef.current = ws;

      ws.onmessage = (event) => void handleSignal(JSON.parse(event.data), servers, localStream);
      ws.onclose = () => {
        if (!cancelled) setStatus((s) => (s === "connected" || s === "waiting" ? "ended" : s));
      };
      ws.onerror = () => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Couldn't reach the signaling server.");
        }
      };
    }

    async function ensurePeerConnection(servers: IceServer[], localStream: MediaStream | null): Promise<RTCPeerConnection> {
      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection({ iceServers: servers as RTCIceServer[] });
      pcRef.current = pc;

      localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0] ?? null;
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) send({ type: "ice-candidate", candidate: event.candidate.toJSON() });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
      };

      return pc;
    }

    function send(payload: unknown): void {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(payload));
    }

    async function flushPendingCandidates(pc: RTCPeerConnection): Promise<void> {
      const queued = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];
      for (const candidate of queued) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
      }
    }

    async function handleSignal(
      msg: { type: string } & Record<string, unknown>,
      servers: IceServer[],
      localStream: MediaStream | null,
    ): Promise<void> {
      if (msg.type === "waiting") {
        setStatus("waiting");
        return;
      }

      if (msg.type === "ready") {
        setStatus("waiting");
        const pc = await ensurePeerConnection(servers, localStream);
        if (msg.initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({ type: "offer", sdp: offer.sdp });
        }
        return;
      }

      if (msg.type === "offer") {
        const pc = await ensurePeerConnection(servers, localStream);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: msg.sdp as string }));
        await flushPendingCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: "answer", sdp: answer.sdp });
        return;
      }

      if (msg.type === "answer") {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp as string }));
        await flushPendingCandidates(pc);
        return;
      }

      if (msg.type === "ice-candidate") {
        const pc = pcRef.current;
        const candidate = msg.candidate as RTCIceCandidateInit;
        // Candidates can arrive before the offer/answer that sets the remote
        // description — queue them instead of dropping, and flush once it's set.
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
        return;
      }

      if (msg.type === "peer-left") {
        setStatus("peer-left");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        return;
      }

      if (msg.type === "error") {
        setStatus("error");
        setErrorMessage(typeof msg.message === "string" ? msg.message : "Couldn't join this room.");
      }
    }

    void connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [code, iceServers]);

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }

  function toggleVideo() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoOff(!track.enabled);
  }

  function leave() {
    wsRef.current?.close();
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate("/app/interview-room");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Practice interview</h1>
        {room && <p className="text-sm text-ink-500 dark:text-ink-400">{new Date(room.scheduledAt).toLocaleString()}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden">
          <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full bg-ink-900 object-cover" />
          <p className="p-2 text-center text-xs text-ink-400">You</p>
        </Card>
        <Card className="overflow-hidden">
          <video ref={remoteVideoRef} autoPlay playsInline className="aspect-video w-full bg-ink-900 object-cover" />
          <p className="p-2 text-center text-xs text-ink-400">
            {status === "connected" ? "Connected" : status === "waiting" ? "Waiting for the other participant…" : status === "peer-left" ? "The other participant left" : ""}
          </p>
        </Card>
      </div>

      {(status === "connecting" || status === "waiting") && (
        <div className="flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <Spinner className="h-4 w-4" /> {status === "connecting" ? "Connecting…" : "Waiting for the other participant to join…"}
        </div>
      )}
      {status === "error" && <p className="text-center text-sm text-red-600">{errorMessage}</p>}

      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={toggleMute}>
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" onClick={toggleVideo}>
          {videoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </Button>
        <Button variant="danger" onClick={leave}>
          <PhoneOff className="h-4 w-4" /> Leave
        </Button>
      </div>
    </div>
  );
}
