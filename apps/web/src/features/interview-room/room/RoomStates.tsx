import { Link } from "react-router-dom";
import { AlertTriangle, Sparkles, Users } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { Spinner } from "../../../components/ui/Spinner.js";
import { SectionLabel } from "../../../components/ui/Surface.js";

/** Connecting / signalling handshake. */
export function ConnectingState() {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="text-center">
        <Spinner className="mx-auto h-6 w-6" />
        <p className="mt-3 text-h3 text-fg">Connecting to the room</p>
        <p className="mt-1 text-label text-fg-muted">Setting up secure peer connections…</p>
      </div>
    </div>
  );
}

/** Waiting for the minimum number of peers before the session can start. */
export function WaitingState({ present, needed }: { present: number; needed: number }) {
  return (
    <div className="surface-2 surface-edge mx-auto max-w-md rounded-2xl p-6 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-pill bg-accent-soft text-accent">
        <Users className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-3 text-h2 text-fg">Waiting for the group</p>
      <p className="mt-1 text-label text-fg-muted">
        {present} of {needed} here. The session starts automatically once everyone arrives.
      </p>
      <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
        {Array.from({ length: needed }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-pill ${i < present ? "bg-accent" : "bg-fg/[0.12]"}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Session ended — routes to the AI recap. */
export function EndedState({ code }: { code: string }) {
  return (
    <div className="surface-2 surface-edge mx-auto max-w-md rounded-2xl p-6 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-pill bg-accent-soft text-accent">
        <Sparkles className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-3 text-h2 text-fg">Session complete</p>
      <p className="mt-1 text-label text-fg-muted">
        Your group recap and per-person feedback are being generated now.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to={`/app/interview-room/${code}/summary`}>
          <Button>View recap</Button>
        </Link>
        <Link to="/app/interview-room">
          <Button variant="secondary">Back to rooms</Button>
        </Link>
      </div>
    </div>
  );
}

/** Connection failure with the real error message from the socket / media layer. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="surface-2 surface-edge mx-auto max-w-md rounded-2xl p-6 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-pill bg-critical/15 text-critical">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-3 text-h2 text-fg">Couldn't stay connected</p>
      <SectionLabel className="mt-2 normal-case tracking-normal text-fg-muted">{message}</SectionLabel>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={onRetry}>Try again</Button>
        <Link to="/app/interview-room">
          <Button variant="secondary">Back to rooms</Button>
        </Link>
      </div>
    </div>
  );
}
