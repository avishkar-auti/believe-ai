import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import type { RoomIdea } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { cn } from "../../lib/cn.js";
import { firebaseAuth } from "../../lib/firebase.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import {
  endRoom,
  fetchIceServers,
  fetchIdeas,
  fetchRoomByCode,
  fetchRoomFeedbackSummary,
  getSignalingWsUrl,
  postIdea,
  postTranscriptChunk,
  regenerateRoomQuestions,
  submitRoomFeedback,
  type IceServer,
} from "./interviewRoomApi.js";
import { FeedbackDrawer } from "./FeedbackDrawer.js";
import { IdeaBoard } from "./IdeaBoard.js";
import { QuestionPanel } from "./QuestionPanel.js";
import { RecapTab } from "./RecapTab.js";
import { RoomRoster, type RosterEntry } from "./RoomRoster.js";

interface FeedbackPrompt {
  questionId: string;
  speakerUserId: string;
  speakerName: string;
}

// Minimal shape of the Web Speech API's SpeechRecognition — not in TS's DOM
// lib, and support is Chrome/Edge-only (no Safari), so this is entirely
// feature-detected and optional rather than a hard dependency.
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const TRANSCRIPT_FLUSH_INTERVAL_MS = 12_000;

type CallStatus = "connecting" | "waiting" | "active" | "ended" | "error";

interface QuestionRef {
  id: string;
  text: string;
}

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

function gridColsClass(tileCount: number): string {
  if (tileCount <= 2) return "sm:grid-cols-2";
  if (tileCount <= 4) return "sm:grid-cols-2";
  return "sm:grid-cols-3";
}

export function RoomCallPage() {
  const { code = "" } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const [participants, setParticipants] = useState<Map<string, string>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [minParticipants, setMinParticipants] = useState(0);
  const [questions, setQuestions] = useState<QuestionRef[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSpeakerUserId, setCurrentSpeakerUserId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<RoomIdea[]>([]);
  const [averageRatings, setAverageRatings] = useState<Map<string, number>>(new Map());
  const [feedbackPrompt, setFeedbackPrompt] = useState<FeedbackPrompt | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  // Mirror a few pieces of state into refs so the WS handler below (a stable
  // closure created once per connect effect run) can read their latest
  // values synchronously when a "turn-changed" event needs to know who was
  // just speaking and on which question, without re-subscribing the socket.
  const currentQuestionIndexRef = useRef(0);
  const questionsRef = useRef<QuestionRef[]>([]);
  const participantsRef = useRef<Map<string, string>>(new Map());
  const currentUserIdRef = useRef<string | null>(null);

  const { data: room } = useQuery({ queryKey: ["mock-interview-room", code], queryFn: () => fetchRoomByCode(code) });
  const { data: iceServers } = useQuery({ queryKey: ["ice-servers"], queryFn: fetchIceServers });

  const isHost = Boolean(currentUser && hostUserId && currentUser.id === hostUserId);
  const currentQuestion = questions[currentQuestionIndex] ?? null;

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser]);

  // Browser-side speech-to-text during the local user's own turn — batches
  // ~12s of finalized speech and posts it as one transcript chunk (feeds the
  // live recap). Feature-detected: browsers without SpeechRecognition (or
  // this sandboxed test browser, which blocks mic access entirely) simply
  // never start it, rather than blocking the call.
  useEffect(() => {
    const isMyTurn = status === "active" && currentUser != null && currentSpeakerUserId === currentUser.id;
    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!isMyTurn || !RecognitionCtor) return;

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let buffer = "";
    let stopping = false;

    function flush(): void {
      const text = buffer.trim();
      if (!text) return;
      buffer = "";
      const questionId = questionsRef.current[currentQuestionIndexRef.current]?.id ?? null;
      postTranscriptChunk(code, { questionId, text }).catch(() => undefined);
    }

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) buffer += (buffer ? " " : "") + result[0].transcript.trim();
      }
    };
    recognition.onerror = () => undefined;
    // Browsers auto-stop recognition after a pause in speech — restart while it's still our turn.
    recognition.onend = () => {
      if (!stopping) recognition.start();
    };

    try {
      recognition.start();
    } catch {
      return;
    }
    const flushTimer = window.setInterval(flush, TRANSCRIPT_FLUSH_INTERVAL_MS);

    return () => {
      stopping = true;
      window.clearInterval(flushTimer);
      recognition.onend = null;
      recognition.stop();
      flush();
    };
  }, [status, currentSpeakerUserId, currentUser, code]);

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
        if (!cancelled) setStatus((s) => (s === "error" ? s : "ended"));
      };
      ws.onerror = () => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Couldn't reach the signaling server.");
        }
      };
    }

    function send(payload: unknown): void {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(payload));
    }

    async function ensurePeerConnection(
      peerId: string,
      iceServerList: IceServer[],
      localStream: MediaStream | null,
    ): Promise<RTCPeerConnection> {
      const existing = pcRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: iceServerList as RTCIceServer[] });
      pcRef.current.set(peerId, pc);

      localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) send({ type: "ice-candidate", to: peerId, candidate: event.candidate.toJSON() });
      };

      return pc;
    }

    function closePeerConnection(peerId: string): void {
      pcRef.current.get(peerId)?.close();
      pcRef.current.delete(peerId);
      pendingCandidatesRef.current.delete(peerId);
      setRemoteStreams((prev) => {
        if (!prev.has(peerId)) return prev;
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    }

    async function flushPendingCandidates(peerId: string, pc: RTCPeerConnection): Promise<void> {
      const queued = pendingCandidatesRef.current.get(peerId) ?? [];
      pendingCandidatesRef.current.delete(peerId);
      for (const candidate of queued) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
      }
    }

    async function handleSignal(
      msg: { type: string } & Record<string, unknown>,
      servers: IceServer[],
      localStream: MediaStream | null,
    ): Promise<void> {
      if (msg.type === "roster") {
        const hostId = msg.hostUserId as string;
        const rosterParticipants = msg.participants as { userId: string; name: string }[];
        setHostUserId(hostId);
        setMinParticipants(msg.minParticipants as number);
        setParticipants(new Map(rosterParticipants.map((p) => [p.userId, p.name])));
        setQuestions(msg.questions as QuestionRef[]);
        setCurrentQuestionIndex(msg.currentQuestionIndex as number);
        setCurrentSpeakerUserId((msg.currentSpeakerUserId as string | null) ?? null);
        setStatus(msg.active ? "active" : "waiting");

        // The newly-joined peer always initiates the offer to each existing peer —
        // deterministic, and generalizes past 2 people without a host-only-initiator case.
        for (const peer of rosterParticipants) {
          const pc = await ensurePeerConnection(peer.userId, servers, localStream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({ type: "offer", to: peer.userId, sdp: offer.sdp });
        }
        return;
      }

      if (msg.type === "peer-joined") {
        const userId = msg.userId as string;
        const name = msg.name as string;
        setParticipants((prev) => new Map(prev).set(userId, name));
        return;
      }

      if (msg.type === "peer-left") {
        const userId = msg.userId as string;
        setParticipants((prev) => {
          if (!prev.has(userId)) return prev;
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
        closePeerConnection(userId);
        return;
      }

      if (msg.type === "room-active") {
        setStatus("active");
        return;
      }

      if (msg.type === "turn-changed") {
        const newSpeakerUserId = (msg.speakerUserId as string | null) ?? null;
        // Whoever was speaking before this update just finished their turn —
        // prompt everyone else (not them) to rate it. Reading the previous
        // value via the functional updater avoids a stale closure.
        setCurrentSpeakerUserId((prevSpeakerId) => {
          if (prevSpeakerId && prevSpeakerId !== currentUserIdRef.current) {
            const question = questionsRef.current[currentQuestionIndexRef.current];
            const speakerName = participantsRef.current.get(prevSpeakerId) ?? "them";
            if (question) setFeedbackPrompt({ questionId: question.id, speakerUserId: prevSpeakerId, speakerName });
          }
          return newSpeakerUserId;
        });
        setCurrentQuestionIndex(msg.questionIndex as number);
        return;
      }

      if (msg.type === "idea-added") {
        setIdeas((prev) => [...prev, msg.idea as RoomIdea]);
        return;
      }

      if (msg.type === "questions-updated") {
        setQuestions(msg.questions as QuestionRef[]);
        return;
      }

      if (msg.type === "room-ended") {
        navigate(`/app/interview-room/${code}/summary`);
        return;
      }

      if (msg.type === "feedback-summary-updated") {
        const speakerUserId = msg.speakerUserId as string;
        const averageRating = msg.averageRating as number | null;
        setAverageRatings((prev) => {
          const next = new Map(prev);
          if (averageRating == null) next.delete(speakerUserId);
          else next.set(speakerUserId, averageRating);
          return next;
        });
        return;
      }

      if (msg.type === "offer") {
        const from = msg.from as string;
        const pc = await ensurePeerConnection(from, servers, localStream);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: msg.sdp as string }));
        await flushPendingCandidates(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: "answer", to: from, sdp: answer.sdp });
        return;
      }

      if (msg.type === "answer") {
        const from = msg.from as string;
        const pc = pcRef.current.get(from);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp as string }));
        await flushPendingCandidates(from, pc);
        return;
      }

      if (msg.type === "ice-candidate") {
        const from = msg.from as string;
        const pc = pcRef.current.get(from);
        const candidate = msg.candidate as RTCIceCandidateInit;
        // Candidates can arrive before the offer/answer that sets the remote
        // description — queue them instead of dropping, and flush once it's set.
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
        } else {
          const list = pendingCandidatesRef.current.get(from) ?? [];
          list.push(candidate);
          pendingCandidatesRef.current.set(from, list);
        }
        return;
      }

      if (msg.type === "error") {
        setStatus("error");
        setErrorMessage(typeof msg.message === "string" ? msg.message : "Couldn't join this room.");
      }
    }

    void connect();

    const peerConnections = pcRef.current;
    return () => {
      cancelled = true;
      wsRef.current?.close();
      for (const pc of peerConnections.values()) pc.close();
      peerConnections.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [code, iceServers, navigate]);

  // Hydrates the full session's notes once on mount/reconnect — separate from
  // the WS lifecycle above, since a late joiner or a refresh needs to see
  // notes posted before they connected, not just ones that arrive live.
  useEffect(() => {
    if (!code) return;
    fetchIdeas(code)
      .then(setIdeas)
      .catch(() => undefined);
  }, [code]);

  // Same idea for the rating badges — hydrate the ratings submitted before
  // this tab joined, then let "feedback-summary-updated" keep them live.
  useEffect(() => {
    if (!code) return;
    fetchRoomFeedbackSummary(code)
      .then((rows) => setAverageRatings(new Map(rows.map((r) => [r.speakerUserId, r.averageRating]))))
      .catch(() => undefined);
  }, [code]);

  const postIdeaMutation = useMutation({
    // Same one-update-path pattern as regenerateMutation — the posted note
    // arrives back over the WS connection ("idea-added", broadcast to every
    // socket in the room including this one) rather than being appended here.
    mutationFn: (text: string) => postIdea(code, currentQuestion!.id, text),
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: (input: { questionId: string; turnSpeakerUserId: string; rating: number; comment: string | null }) =>
      submitRoomFeedback(code, input),
    // Dismissing the drawer is local-only UI state (not shared with other
    // tabs), so it's applied directly here rather than round-tripping
    // through a WS broadcast the way the roster badge value does.
    onSuccess: () => setFeedbackPrompt(null),
  });

  function advanceTurn() {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "advance-turn" }));
    }
  }

  const regenerateMutation = useMutation({
    // The refreshed question list arrives back over the WS connection (all
    // joined tabs, including this one, get "questions-updated") rather than
    // being applied from this response directly — one update path, not two.
    mutationFn: () => regenerateRoomQuestions(room!.id),
  });

  const endRoomMutation = useMutation({
    // Navigation for every tab (including the host's) happens via the
    // room-ended WS broadcast, not this mutation's own response — same
    // one-update-path pattern as regenerateMutation.
    mutationFn: () => endRoom(code),
  });

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
    for (const pc of pcRef.current.values()) pc.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate("/app/interview-room");
  }

  const currentQuestionIdeas = ideas.filter((idea) => idea.questionId === currentQuestion?.id);
  const tileCount = 1 + participants.size;
  const rosterEntries: RosterEntry[] = [
    ...(currentUser ? [{ userId: currentUser.id, name: currentUser.name || currentUser.email, isSelf: true }] : []),
    ...[...participants.entries()].map(([userId, name]) => ({ userId, name })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Practice room</h1>
        {room && <p className="text-sm text-ink-500 dark:text-ink-400">{new Date(room.scheduledAt).toLocaleString()}</p>}
      </div>

      <RoomRoster entries={rosterEntries} currentSpeakerUserId={currentSpeakerUserId} averageRatings={averageRatings} />

      {(status === "active" || status === "waiting") && (
        <QuestionPanel
          questionText={currentQuestion?.text ?? null}
          questionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          isHost={isHost}
          onAdvance={advanceTurn}
          onRegenerate={() => regenerateMutation.mutate()}
          regenerating={regenerateMutation.isPending}
          disabled={status !== "active"}
        />
      )}

      {(status === "active" || status === "waiting") && currentQuestion && (
        <IdeaBoard
          ideas={currentQuestionIdeas}
          onPost={(text) => postIdeaMutation.mutate(text)}
          posting={postIdeaMutation.isPending}
        />
      )}

      {status === "active" && <RecapTab code={code} enabled />}

      <div className={cn("grid grid-cols-1 gap-4", gridColsClass(tileCount))}>
        <Card className="overflow-hidden">
          <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full bg-ink-900 object-cover" />
          <p className="p-2 text-center text-xs text-ink-400">You</p>
        </Card>
        {[...participants.entries()].map(([userId, name]) => (
          <RemoteTile key={userId} name={name} stream={remoteStreams.get(userId) ?? null} />
        ))}
      </div>

      {status === "connecting" && (
        <div className="flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <Spinner className="h-4 w-4" /> Connecting…
        </div>
      )}
      {status === "waiting" && (
        <div className="flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          <Spinner className="h-4 w-4" /> Waiting for at least {minParticipants} people — {tileCount}/{minParticipants} here…
        </div>
      )}
      {status === "ended" && <p className="text-center text-sm text-ink-500 dark:text-ink-400">The room has ended.</p>}
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
        {isHost && status === "active" && (
          <Button variant="secondary" onClick={() => endRoomMutation.mutate()} disabled={endRoomMutation.isPending}>
            {endRoomMutation.isPending ? "Ending…" : "End room"}
          </Button>
        )}
      </div>

      {feedbackPrompt && (
        <FeedbackDrawer
          speakerName={feedbackPrompt.speakerName}
          submitting={submitFeedbackMutation.isPending}
          onDismiss={() => setFeedbackPrompt(null)}
          onSubmit={(rating, comment) =>
            submitFeedbackMutation.mutate({
              questionId: feedbackPrompt.questionId,
              turnSpeakerUserId: feedbackPrompt.speakerUserId,
              rating,
              comment,
            })
          }
        />
      )}
    </div>
  );
}

function RemoteTile({ name, stream }: { name: string; stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <Card className="overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="aspect-video w-full bg-ink-900 object-cover" />
      <p className="p-2 text-center text-xs text-ink-400">{stream ? name : `Connecting to ${name}…`}</p>
    </Card>
  );
}
