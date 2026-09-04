import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Lightbulb, Search } from "lucide-react";
import type { DesignProject } from "@believe-ai/shared";
import { EASE, MOTION } from "../../lib/motion.js";
import { EXPLORE_IDEAS } from "./studioConfig.js";

/** Scoped to real data only — design projects (already fetched by the page,
 * passed in rather than re-queried) and the same curated idea prompts
 * TemplateSection shows. No "search screens" mode: there's no endpoint that
 * lists screens across every project, so it isn't offered (see designApi.ts). */
export function StudioSearchPalette({
  open,
  onClose,
  projects,
  onSelectIdea,
}: {
  open: boolean;
  onClose: () => void;
  projects: DesignProject[];
  onSelectIdea: (prompt: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const q = query.trim().toLowerCase();
  const matchedProjects = useMemo(() => (q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects.slice(0, 5)), [projects, q]);
  const matchedIdeas = useMemo(
    () => (q ? EXPLORE_IDEAS.filter((i) => i.name.toLowerCase().includes(q) || i.prompt.toLowerCase().includes(q)) : []),
    [q],
  );

  function openProject(id: string) {
    onClose();
    navigate(`/app/design-studio/${id}`);
  }

  function selectIdea(prompt: string) {
    onClose();
    onSelectIdea(prompt);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.fast }}
            className="absolute inset-0 bg-fg/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: MOTION.normal, ease: EASE }}
            className="relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-panel surface-4 surface-edge shadow-lift"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-fg-subtle" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your designs…"
                className="h-6 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
              />
              <kbd className="rounded-pill bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-subtle">Esc</kbd>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {matchedProjects.length > 0 && (
                <div className="mb-1">
                  <p className="px-2.5 py-1.5 text-section uppercase text-fg-subtle">Projects</p>
                  {matchedProjects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openProject(p.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-label text-fg transition-colors hover:bg-fg/[0.06]"
                    >
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto shrink-0 text-caption text-fg-subtle">
                        {p.screenCount} {p.screenCount === 1 ? "screen" : "screens"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchedIdeas.length > 0 && (
                <div>
                  <p className="px-2.5 py-1.5 text-section uppercase text-fg-subtle">Ideas</p>
                  {matchedIdeas.map((idea) => (
                    <button
                      key={idea.name}
                      type="button"
                      onClick={() => selectIdea(idea.prompt)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-label text-fg transition-colors hover:bg-fg/[0.06]"
                    >
                      <Lightbulb className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                      <span className="truncate">{idea.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchedProjects.length === 0 && matchedIdeas.length === 0 && (
                <p className="px-2.5 py-6 text-center text-caption text-fg-subtle">No matches for "{query}".</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
