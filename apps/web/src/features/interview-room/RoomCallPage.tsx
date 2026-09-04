import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { RoomIdea } from "@believe-ai/shared";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { toast } from "../../components/ui/Toast.js";
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
import { RoomHeader } from "./room/RoomHeader.js";
import { ParticipantStage, type StageParticipant } from "./room/ParticipantStage.js";
import { MeetingControls } from "./room/MeetingControls.js";
import { RoomSidePanel } from "./room/RoomSidePanel.js";
import { usePanelState } from "./room/usePanelState.js";
import { QuestionsPanel } from "./room/QuestionsPanel.js";
import { IdeaBoardPanel } from "./room/IdeaBoardPanel.js";
import { PeoplePanel, type PersonEntry } from "./room/PeoplePanel.js";
import { RecapPanel } from "./room/RecapPanel.js";
import { FeedbackPanel } from "./room/FeedbackPanel.js";
import { PreJoinScreen, type JoinPreferences } from "./room/PreJoinScreen.js";
import { ConnectingState, EndedState, ErrorState, WaitingState } from "./room/RoomStates.js";
import { useSpeakingDetection } from "./room/useSpeakingDetection.js";

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
 * mic should never block joining the call entirely. The pre-join screen's
 * chosen devices are tried first, then the same generic fallbacks. */
async function acquireLocalMedia(prefs: JoinPreferences | null): Promise<MediaStream | null> {
  const audio: MediaTrackConstraints | boolean = prefs?.audioDeviceId
    ? { deviceId: { exact: prefs.audioDeviceId } }
    : true;
  const video: MediaTrackConstraints | boolean = prefs?.videoDeviceId
    ? { deviceId: { exact: prefs.videoDeviceId } }
    : true;

  const attempts: MediaStreamConstraints[] = [
    { video, audio },
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
  const { data: currentUser } = useCurrentUser();

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  // Pre-join gate: the signalling/media effect below only runs once the user
  // has confirmed their devices, so nothing is captured before they ask.
  const [joinPrefs, setJoinPrefs] = useState<JoinPreferences | null>(null);
  const joined = joinPrefs !== null;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

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

  const panel = usePanelState("questions");

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

  useEffect(() => {
    if (status === "active") setStartedAt((prev) => prev ?? Date.now());
  }, [status]);

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
    if (!joined) return; // pre-join gate — no capture or socket until the user joins
    if (!iceServers) return; // wait for ICE config before opening the signaling connection
    const servers = iceServers;
    const prefs = joinPrefs;
    let cancelled = false;

    async function connect() {
      const user = firebaseAuth.currentUser;
      if (!user) {
        setStatus("error");
        setErrorMessage("Sign-in expired — reload and try again.");
        return;
      }
      const token = await user.getIdToken();

      const localStream = await acquireLocalMedia(prefs);
      if (cancelled) {
        localStream?.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = localStream;
      setLocalStream(localStream);

      // Honour the pre-join mic/camera choices on the real call tracks.
      if (localStream && prefs) {
        localStream.getAudioTracks().forEach((t) => (t.enabled = prefs.micOn));
        localStream.getVideoTracks().forEach((t) => (t.enabled = prefs.cameraOn));
        setMuted(!prefs.micOn);
        setVideoOff(!prefs.cameraOn);
      }

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
  }, [code, iceServers, navigate, joined, joinPrefs]);

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
    onSuccess: () => {
      setFeedbackPrompt(null);
      toast("Feedback sent");
    },
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
    onSettled: () => setEndOpen(false),
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

  /** Replaces the outgoing video track on every peer connection so peers see
   * the screen instead of the camera, then restores the camera on stop. */
  async function toggleShare() {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
      for (const pc of pcRef.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(cameraTrack).catch(() => undefined);
      }
      return;
    }

    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) return;
      setScreenStream(display);
      for (const pc of pcRef.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack).catch(() => undefined);
      }
      screenTrack.onended = () => {
        setScreenStream(null);
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
        for (const pc of pcRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) void sender.replaceTrack(cameraTrack).catch(() => undefined);
        }
      };
    } catch {
      toast("Screen sharing was cancelled");
    }
  }

  function leave() {
    wsRef.current?.close();
    for (const pc of pcRef.current.values()) pc.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    navigate("/app/interview-room");
  }

  // M / V shortcuts, ignored while typing into the idea board or feedback note.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "m" || e.key === "M") toggleMute();
      if (e.key === "v" || e.key === "V") toggleVideo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentQuestionIdeas = ideas.filter((idea) => idea.questionId === currentQuestion?.id);
  const localName = currentUser ? currentUser.name || currentUser.email : "You";

  const speakingStreams = useMemo(() => {
    const map = new Map<string, MediaStream>();
    if (currentUser && localStream) map.set(currentUser.id, localStream);
    for (const [userId, stream] of remoteStreams) map.set(userId, stream);
    return map;
  }, [currentUser, localStream, remoteStreams]);
  const speakingIds = useSpeakingDetection(speakingStreams);

  const stageParticipants: StageParticipant[] = [
    ...(currentUser
      ? [
          {
            userId: currentUser.id,
            name: localName,
            stream: localStream,
            isLocal: true,
            isHost: currentUser.id === hostUserId,
            micOn: !muted,
            cameraOn: !videoOff,
            averageRating: averageRatings.get(currentUser.id) ?? null,
          },
        ]
      : []),
    ...[...participants.entries()].map(([userId, name]) => ({
      userId,
      name,
      stream: remoteStreams.get(userId) ?? null,
      isLocal: false,
      isHost: userId === hostUserId,
      micOn: true,
      cameraOn: true,
      averageRating: averageRatings.get(userId) ?? null,
    })),
  ];

  const people: PersonEntry[] = stageParticipants.map((p) => ({
    userId: p.userId,
    name: p.name,
    isLocal: p.isLocal,
    isHost: p.isHost,
    micOn: p.micOn,
    averageRating: p.averageRating,
  }));

  const currentSpeakerName = currentSpeakerUserId
    ? (stageParticipants.find((p) => p.userId === currentSpeakerUserId)?.name ?? null)
    : null;

  if (!room || !currentUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Pre-join: device check, room facts, and an explicit join action.
  if (!joined) {
    return (
      <main className="flex min-h-screen flex-col gap-4 bg-bg p-3 sm:p-5">
        <RoomHeader
          code={code}
          topic={room.topic}
          status="connecting"
          participantCount={room.participants.filter((p) => !p.leftAt).length}
          capacity={room.maxParticipants}
          startedAt={null}
        />
        <PreJoinScreen
          room={room}
          userId={currentUser.id}
          userName={localName}
          joining={false}
          onJoin={(prefs) => setJoinPrefs(prefs)}
        />
      </main>
    );
  }

  return (
    <main className="flex h-[100dvh] flex-col gap-3 overflow-hidden bg-bg p-3 sm:p-4">
      <RoomHeader
        code={code}
        topic={room.topic}
        status={status}
        participantCount={stageParticipants.length}
        capacity={room.maxParticipants}
        startedAt={startedAt}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <section className="flex min-h-0 flex-1 flex-col gap-3">
          {status === "connecting" ? (
            <ConnectingState />
          ) : status === "error" ? (
            <div className="grid flex-1 place-items-center">
              <ErrorState message={errorMessage ?? "The connection dropped."} onRetry={() => window.location.reload()} />
            </div>
          ) : status === "ended" ? (
            <div className="grid flex-1 place-items-center">
              <EndedState code={code} />
            </div>
          ) : (
            <>
              {status === "waiting" && (
                <WaitingState present={stageParticipants.length} needed={minParticipants || room.minParticipants} />
              )}
              <ParticipantStage
                participants={stageParticipants}
                speakingIds={speakingIds}
                currentSpeakerUserId={currentSpeakerUserId}
                screenStream={screenStream}
                screenOwnerName={screenStream ? localName : null}
              />
            </>
          )}

          {feedbackPrompt && (
            <FeedbackPanel
              speakerName={feedbackPrompt.speakerName}
              questionText={currentQuestion?.text ?? null}
              submitting={submitFeedbackMutation.isPending}
              onSkip={() => setFeedbackPrompt(null)}
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
        </section>

        {panel.open && (
          <RoomSidePanel
            tab={panel.tab}
            onTabChange={panel.setTab}
            onClose={() => panel.setOpen(false)}
            peopleCount={people.length}
            ideaCount={currentQuestionIdeas.length}
            className="h-64 shrink-0 lg:h-auto lg:w-[22rem]"
          >
            {panel.tab === "questions" && (
              <QuestionsPanel
                questions={questions}
                currentIndex={currentQuestionIndex}
                currentSpeakerName={currentSpeakerName}
                isHost={isHost}
                regenerating={regenerateMutation.isPending}
                advanceDisabled={status !== "active"}
                onAdvance={advanceTurn}
                onRegenerate={() => regenerateMutation.mutate()}
              />
            )}
            {panel.tab === "board" && (
              <IdeaBoardPanel
                ideas={currentQuestionIdeas}
                onPost={(text) => postIdeaMutation.mutate(text)}
                posting={postIdeaMutation.isPending}
                disabled={!currentQuestion}
              />
            )}
            {panel.tab === "people" && (
              <PeoplePanel
                people={people}
                currentSpeakerUserId={currentSpeakerUserId}
                speakingIds={speakingIds}
                minParticipants={minParticipants || room.minParticipants}
              />
            )}
            {panel.tab === "recap" && <RecapPanel code={code} enabled={status === "active"} />}
          </RoomSidePanel>
        )}
      </div>

      <MeetingControls
        micOn={!muted}
        cameraOn={!videoOff}
        sharing={screenStream !== null}
        panelOpen={panel.open}
        isHost={isHost}
        canEnd={status === "active" && !endRoomMutation.isPending}
        onToggleMic={toggleMute}
        onToggleCamera={toggleVideo}
        onToggleShare={() => void toggleShare()}
        onTogglePanel={() => panel.setOpen(!panel.open)}
        onLeave={() => setLeaveOpen(true)}
        onEnd={() => setEndOpen(true)}
        className="mx-auto"
      />

      <ConfirmDialog
        open={leaveOpen}
        title="Leave this room?"
        description="You can rejoin while the session is still running."
        confirmLabel="Leave"
        onConfirm={leave}
        onCancel={() => setLeaveOpen(false)}
      />
      <ConfirmDialog
        open={endOpen}
        title="End the session for everyone?"
        description="The room closes for all participants and the AI recap starts generating."
        confirmLabel="End session"
        destructive
        busy={endRoomMutation.isPending}
        onConfirm={() => endRoomMutation.mutate()}
        onCancel={() => setEndOpen(false)}
      />
    </main>
  );
}
