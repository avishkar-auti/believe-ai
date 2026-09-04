import type { ReactNode } from "react";
import {
  LayoutPanelLeft,
  LogOut,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  ScreenShareOff,
  Video,
  VideoOff,
} from "lucide-react";
import { Tooltip } from "../../../components/ui/Tooltip.js";
import { cn } from "../../../lib/cn.js";

function ControlButton({
  label,
  active = false,
  danger = false,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip label={label} side="top">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-pill transition-[background-color,color,transform] duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          danger
            ? "bg-critical text-white hover:opacity-90"
            : active
              ? "bg-accent text-accent-fg"
              : "bg-fg/[0.06] text-fg-muted hover:bg-fg/[0.12] hover:text-fg",
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/**
 * The single control dock. Every action maps to real media / session state —
 * mic and camera toggle the actual local tracks, share uses getDisplayMedia,
 * and leave/end call the same handlers the page already owned.
 */
export function MeetingControls({
  micOn,
  cameraOn,
  sharing,
  panelOpen,
  isHost,
  canEnd,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onTogglePanel,
  onLeave,
  onEnd,
  className,
}: {
  micOn: boolean;
  cameraOn: boolean;
  sharing: boolean;
  panelOpen: boolean;
  isHost: boolean;
  canEnd: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleShare: () => void;
  onTogglePanel: () => void;
  onLeave: () => void;
  onEnd: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-3 surface-edge flex items-center justify-center gap-2 rounded-pill px-3 py-2 shadow-lift",
        className,
      )}
    >
      <ControlButton label={micOn ? "Mute microphone (M)" : "Unmute microphone (M)"} danger={!micOn} onClick={onToggleMic}>
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton label={cameraOn ? "Turn camera off (V)" : "Turn camera on (V)"} danger={!cameraOn} onClick={onToggleCamera}>
        {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton label={sharing ? "Stop presenting" : "Present your screen"} active={sharing} onClick={onToggleShare}>
        {sharing ? <ScreenShareOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
      </ControlButton>

      <ControlButton label={panelOpen ? "Hide session panel" : "Show session panel"} active={panelOpen} onClick={onTogglePanel}>
        <LayoutPanelLeft className="h-5 w-5" />
      </ControlButton>

      <span className="mx-1 h-6 w-px bg-line" aria-hidden />

      <ControlButton label="Leave room" onClick={onLeave}>
        <LogOut className="h-5 w-5" />
      </ControlButton>

      {isHost && (
        <ControlButton label="End session for everyone" danger onClick={onEnd} disabled={!canEnd}>
          <PhoneOff className="h-5 w-5" />
        </ControlButton>
      )}
    </div>
  );
}
