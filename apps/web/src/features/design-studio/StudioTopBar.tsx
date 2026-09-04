import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Download,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  Palette,
  Play,
  Redo2,
  Sparkles,
  Undo2,
} from "lucide-react";
import { cn } from "../../lib/cn.js";

export type SaveState = "idle" | "saving" | "saved";

interface StudioTopBarProps {
  projectName: string;
  saveState: SaveState;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onExport: () => void;
  exporting: boolean;
  onArrange: () => void;
  onOpenDesignSystem: () => void;
  onToggleAgent: () => void;
  agentOpen: boolean;
}

/** Deliberately lightweight: project identity on the left, the three actions a
 * user reaches for constantly on the right, everything else behind a menu. */
export function StudioTopBar(props: StudioTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface/90 px-2 backdrop-blur-[var(--liquid-blur-md)]">
      <div className="flex min-w-0 items-center gap-1">
        <Link
          to="/app/design-studio"
          aria-label="Back to all projects"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors duration-150 hover:bg-surface-3 hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <button
          type="button"
          aria-label="Project menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors duration-150 hover:bg-surface-3 hover:text-fg"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="hidden shrink-0 items-center gap-1.5 pl-1 pr-2 text-xs font-semibold text-fg sm:flex">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Believe Design
        </span>
        <span className="hidden text-fg-subtle sm:inline">/</span>
        <span className="truncate px-2 text-xs font-medium text-fg-muted">{props.projectName}</span>
        <AnimatePresence>
          {props.saveState !== "idle" && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden items-center gap-1 text-[11px] text-fg-subtle sm:flex"
            >
              {props.saveState === "saving" ? "Saving…" : (
                <>
                  <Check className="h-3 w-3" /> Saved
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                className="absolute left-1 top-11 z-20 w-60 overflow-hidden rounded-xl border border-line bg-surface-3/95 p-1.5 shadow-lift backdrop-blur-[var(--liquid-blur-lg)]"
              >
                <MenuItem icon={<LayoutGrid className="h-3.5 w-3.5" />} to="/app/design-studio" label="All projects" />
                <MenuItem
                  icon={<Palette className="h-3.5 w-3.5" />}
                  label="Design system"
                  onClick={() => {
                    setMenuOpen(false);
                    props.onOpenDesignSystem();
                  }}
                />
                <MenuItem
                  icon={<LayoutGrid className="h-3.5 w-3.5" />}
                  label="Arrange screens"
                  onClick={() => {
                    setMenuOpen(false);
                    props.onArrange();
                  }}
                />
                <MenuItem
                  icon={<Download className="h-3.5 w-3.5" />}
                  label="Export selected as PNG"
                  onClick={() => {
                    setMenuOpen(false);
                    props.onExport();
                  }}
                />
                <div className="my-1 h-px bg-line" />
                <MenuItem icon={<ArrowLeft className="h-3.5 w-3.5" />} to="/app" label="Back to Believe.ai" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconAction label="Undo" onClick={props.onUndo} disabled={!props.canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconAction>
        <IconAction label="Redo" onClick={props.onRedo} disabled={!props.canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconAction>
        <span className="mx-1 h-4 w-px bg-line" />
        <IconAction label="AI agent" onClick={props.onToggleAgent} active={props.agentOpen}>
          <Sparkles className="h-4 w-4" />
        </IconAction>
        <button
          type="button"
          onClick={props.onPreview}
          className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-pill bg-accent px-3 text-xs font-semibold text-accent-fg transition-colors duration-150 hover:bg-accent-hover"
        >
          <Play className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Preview</span>
        </button>
        <div className="relative">
          <IconAction label="More" onClick={() => setOverflowOpen((v) => !v)}>
            <MoreHorizontal className="h-4 w-4" />
          </IconAction>
          <AnimatePresence>
            {overflowOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setOverflowOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-line bg-surface-3/95 p-1.5 shadow-lift backdrop-blur-[var(--liquid-blur-lg)]"
                >
                  <MenuItem
                    icon={<Download className="h-3.5 w-3.5" />}
                    label={props.exporting ? "Exporting…" : "Export selected as PNG"}
                    onClick={() => {
                      setOverflowOpen(false);
                      props.onExport();
                    }}
                  />
                  <MenuItem
                    icon={<Palette className="h-3.5 w-3.5" />}
                    label="Design system"
                    onClick={() => {
                      setOverflowOpen(false);
                      props.onOpenDesignSystem();
                    }}
                  />
                  <MenuItem
                    icon={<LayoutGrid className="h-3.5 w-3.5" />}
                    label="Arrange screens"
                    onClick={() => {
                      setOverflowOpen(false);
                      props.onArrange();
                    }}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted transition-colors duration-150 hover:bg-surface-3 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-accent-soft text-accent",
      )}
    >
      {children}
    </button>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
}) {
  const className =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-fg-muted transition-colors duration-150 hover:bg-surface-4 hover:text-fg";
  if (to) {
    return (
      <Link to={to} className={className}>
        {icon} {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {icon} {label}
    </button>
  );
}
