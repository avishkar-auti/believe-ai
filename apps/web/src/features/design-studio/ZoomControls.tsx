import { Maximize, Minus, Plus, Scan } from "lucide-react";

/** Bottom-left camera controls. Zoom steps go through React Flow's animated
 * zoom (200ms) rather than snapping between scale values. */
export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  onFitSelection,
  hasSelection,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onFitSelection: () => void;
  hasSelection: boolean;
}) {
  return (
    <div className="absolute bottom-4 left-3 z-20 flex items-center gap-0.5 rounded-pill border border-line bg-surface-3/90 p-1 shadow-lift backdrop-blur-[var(--liquid-blur-md)] sm:bottom-6">
      <Btn label="Zoom out" onClick={onZoomOut}>
        <Minus className="h-3.5 w-3.5" />
      </Btn>
      <button
        type="button"
        onClick={onReset}
        title="Reset to 100%"
        className="min-w-[46px] rounded-pill px-1 text-[11px] font-medium text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
      >
        {Math.round(zoom * 100)}%
      </button>
      <Btn label="Zoom in" onClick={onZoomIn}>
        <Plus className="h-3.5 w-3.5" />
      </Btn>
      <span className="mx-0.5 h-4 w-px bg-line" />
      <Btn label="Zoom to fit" onClick={onFit}>
        <Maximize className="h-3.5 w-3.5" />
      </Btn>
      {hasSelection && (
        <Btn label="Fit selection" onClick={onFitSelection}>
          <Scan className="h-3.5 w-3.5" />
        </Btn>
      )}
    </div>
  );
}

function Btn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-pill text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg"
    >
      {children}
    </button>
  );
}
