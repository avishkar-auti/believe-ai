import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  useViewport,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import type { DesignPlatform, DesignScreenSummary } from "@believe-ai/shared";
import { ApiError } from "../../lib/apiClient.js";
import {
  createDesignScreen,
  deleteDesignScreen,
  editDesignScreen,
  fetchDesignProject,
  fetchDesignScreen,
  fetchDesignScreens,
  updateDesignScreenPosition,
} from "./designApi.js";
import { AgentPanel, type ChatMessage } from "./AgentPanel.js";
import { CanvasContextMenu, type ContextMenuItem } from "./CanvasContextMenu.js";
import { DesignRenderer } from "./DesignRenderer.js";
import { DesignSystemPanel } from "./DesignSystemPanel.js";
import { GeneratingScreenNode, type GeneratingFlowNode } from "./GeneratingScreenNode.js";
import { PromptDock } from "./PromptDock.js";
import { PrototypeOverlay } from "./PrototypeOverlay.js";
import { ScreenNode, type ScreenFlowNode, type ScreenNodeActions } from "./ScreenNode.js";
import { StudioCommandPalette, type StudioCommand } from "./StudioCommandPalette.js";
import { StudioTopBar, type SaveState } from "./StudioTopBar.js";
import { ZoomControls } from "./ZoomControls.js";
import { FloatingNotesLayer } from "../floating-notes/FloatingNotesLayer.js";
import { NATIVE_W, arrangePositions, belowPosition, besidePosition, gridPosition } from "./canvasLayout.js";
import { STARTER_PROMPTS, VARIATION_DIRECTIONS, type WorkflowMode } from "./studioConfig.js";

const nodeTypes = { screenNode: ScreenNode, generatingNode: GeneratingScreenNode };
// A stable reference — there are no edges on this canvas, but passing a fresh
// `[]` literal as a prop every render made ReactFlow re-run internal effects
// that depend on it, which fed back into a render loop that never settled
// (and, in turn, starved the route change when navigating away from here).
const EMPTY_EDGES: [] = [];

type AnyFlowNode = ScreenFlowNode | GeneratingFlowNode;

function isScreenNode(node: AnyFlowNode): node is ScreenFlowNode {
  return node.type === "screenNode";
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

interface GenerateVars {
  tempId: string;
  prompt: string;
  platform: DesignPlatform;
  position: { x: number; y: number };
  label: string;
}

export function DesignStudioPage() {
  return (
    <ReactFlowProvider>
      <StudioCanvas />
    </ReactFlowProvider>
  );
}

function StudioCanvas() {
  const { projectId } = useParams<{ projectId: string }>();
  const flow = useReactFlow<AnyFlowNode>();
  const { zoom } = useViewport();

  const screensQuery = useQuery({
    queryKey: ["design-screens", projectId],
    queryFn: () => fetchDesignScreens(projectId!),
    enabled: !!projectId,
  });
  const projectQuery = useQuery({
    queryKey: ["design-project", projectId],
    queryFn: () => fetchDesignProject(projectId!),
    enabled: !!projectId,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<AnyFlowNode>([]);
  const seededProjectRef = useRef<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<WorkflowMode>("create");
  const [platform, setPlatform] = useState<DesignPlatform>("web");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const [designSystemOpen, setDesignSystemOpen] = useState(false);
  const [prototypeStart, setPrototypeStart] = useState<number | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [exporting, setExporting] = useState(false);
  const [exportTarget, setExportTarget] = useState<DesignScreenSummary | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [hintsDismissed, setHintsDismissed] = useState(() => localStorage.getItem("design-studio-hints") === "done");
  const frameRef = useRef<HTMLDivElement>(null);

  // Undo/redo covers what the client owns outright: screen positions. AI
  // generations and deletions are server-side and are not silently reversed.
  const undoStack = useRef<{ id: string; x: number; y: number }[][]>([]);
  const redoStack = useRef<{ id: string; x: number; y: number }[][]>([]);
  const [historyTick, setHistoryTick] = useState(0);

  const pushMessage = useCallback((role: ChatMessage["role"], text: string, isError = false) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text, isError }]);
  }, []);

  const screenNodes = useMemo(() => nodes.filter(isScreenNode), [nodes]);
  const selectedNodes = useMemo(() => screenNodes.filter((n) => n.selected), [screenNodes]);
  const screensInFlowOrder = useMemo(
    () =>
      [...screenNodes]
        .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
        .map((n) => n.data.screen),
    [screenNodes],
  );
  // Read via refs (not as useMemo/useCallback dependencies) inside the action
  // handlers below — depending on them directly made `actions` recompute
  // every time `nodes` changed, which fed back into the "keep node actions
  // fresh" effect further down and looped forever (setNodes → new nodes →
  // new screenNodes/screensInFlowOrder → new actions → effect fires → setNodes…).
  const screenNodesRef = useRef(screenNodes);
  screenNodesRef.current = screenNodes;
  const screensInFlowOrderRef = useRef(screensInFlowOrder);
  screensInFlowOrderRef.current = screensInFlowOrder;

  useEffect(() => {
    if (!screensQuery.data || seededProjectRef.current === projectId) return;
    seededProjectRef.current = projectId ?? null;
    setNodes(screensQuery.data.map((screen) => toFlowNode(screen, actionsRef.current)));
    // Screens fade into their saved positions, then the camera frames them.
    requestAnimationFrame(() => flow.fitView({ duration: 320, padding: 0.25, maxZoom: 1 }));
  }, [screensQuery.data, projectId, setNodes, flow]);

  const flashSaved = useCallback(() => {
    setSaveState("saving");
    window.setTimeout(() => setSaveState("saved"), 400);
    window.setTimeout(() => setSaveState("idle"), 2200);
  }, []);

  const positionMutation = useMutation({
    mutationFn: (vars: { id: string; x: number; y: number }) =>
      updateDesignScreenPosition(vars.id, { x: vars.x, y: vars.y }),
    onSuccess: flashSaved,
    onError: () => setInlineError("Connection interrupted — that move wasn't saved."),
  });

  const generateMutation = useMutation({
    mutationFn: (vars: GenerateVars) =>
      createDesignScreen(projectId!, { prompt: vars.prompt, platform: vars.platform }),
    onMutate: (vars) => {
      setInlineError(null);
      const placeholder: GeneratingFlowNode = {
        id: vars.tempId,
        type: "generatingNode",
        position: vars.position,
        data: { platform: vars.platform, label: vars.label },
      };
      setNodes((prev) => [...prev, placeholder]);
      pushMessage("user", vars.prompt);
      // Gentle camera move so the new frame is visible without yanking the canvas.
      flow.setCenter(vars.position.x + 180, vars.position.y + 120, { duration: 380, zoom: Math.min(zoom, 1) });
    },
    onSuccess: (result, vars) => {
      setNodes((prev) => prev.map((n) => (n.id === vars.tempId ? toFlowNode(result, actionsRef.current) : n)));
      pushMessage("assistant", `Created "${result.title}" on the canvas.`);
      flashSaved();
    },
    onError: (err, vars) => {
      const message = errorMessage(err, "Couldn't finish this design — your canvas is unchanged.");
      setNodes((prev) =>
        prev.map((n) =>
          n.id === vars.tempId && !isScreenNode(n)
            ? {
                ...n,
                data: {
                  ...n.data,
                  failed: true,
                  error: message,
                  onRetry: () => {
                    setNodes((cur) => cur.filter((x) => x.id !== vars.tempId));
                    generateMutation.mutate({ ...vars, tempId: crypto.randomUUID() });
                  },
                  onDismiss: () => setNodes((cur) => cur.filter((x) => x.id !== vars.tempId)),
                },
              }
            : n,
        ),
      );
      pushMessage("assistant", message, true);
    },
  });

  const editMutation = useMutation({
    mutationFn: (vars: { screenId: string; instruction: string }) =>
      editDesignScreen(vars.screenId, { instruction: vars.instruction }),
    onMutate: (vars) => {
      setInlineError(null);
      pushMessage("user", vars.instruction);
    },
    onSuccess: (result) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === result.id ? { ...toFlowNode(result, actionsRef.current), selected: true } : n)),
      );
      pushMessage("assistant", `Updated "${result.title}".`);
      flashSaved();
    },
    onError: (err) => {
      const message = errorMessage(err, "Couldn't apply that change — the screen is unchanged.");
      setInlineError(message);
      pushMessage("assistant", message, true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDesignScreen,
    onSuccess: (_data, id) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      flashSaved();
    },
    onError: (err) => setInlineError(errorMessage(err, "Couldn't delete that screen.")),
  });
  // useMutation's returned object isn't reference-stable across renders here,
  // so anything that needs to call .mutate from inside a useCallback/useMemo
  // reads it off a ref instead of closing over the mutation object directly —
  // otherwise every render "changes" that dependency, which (for `actions`
  // below) fed into the node-sync effect and looped forever.
  const deleteMutationRef = useRef(deleteMutation);
  deleteMutationRef.current = deleteMutation;

  const nextGridPosition = useCallback(() => gridPosition(nodes.length), [nodes.length]);

  const generateMutationRef = useRef(generateMutation);
  generateMutationRef.current = generateMutation;

  const runGenerate = useCallback(
    (text: string, target: DesignPlatform, position: { x: number; y: number }, label: string) => {
      generateMutationRef.current.mutate({ tempId: crypto.randomUUID(), prompt: text, platform: target, position, label });
    },
    [],
  );

  const screenById = useCallback((id: string) => screenNodesRef.current.find((n) => n.id === id), []);

  const selectOnly = useCallback(
    (id: string) => setNodes((prev) => prev.map((n) => ({ ...n, selected: n.id === id }))),
    [setNodes],
  );

  const actions: ScreenNodeActions = useMemo(
    () => ({
      onEdit: (id) => {
        selectOnly(id);
        setMode("refine");
      },
      onVariation: (id) => {
        const node = screenById(id);
        if (!node) return;
        const source = node.data.screen;
        void sourceBrief(source).then((brief) => {
          VARIATION_DIRECTIONS.forEach((direction, i) => {
            window.setTimeout(() => {
              runGenerate(
                `${brief}\n\nCreate a ${direction.toLowerCase()} variation of this design.`,
                source.platform,
                besidePosition(node.position, i),
                `${direction} variation…`,
              );
            }, i * 80);
          });
        });
      },
      onMobile: (id) => {
        const node = screenById(id);
        if (!node) return;
        void sourceBrief(node.data.screen).then((brief) =>
          runGenerate(
            `${brief}\n\nDesign the mobile version of this screen.`,
            "mobile",
            belowPosition(node.position),
            "Mobile version…",
          ),
        );
      },

      onPreview: (id) => {
        const index = screensInFlowOrderRef.current.findIndex((s) => s.id === id);
        setPrototypeStart(index < 0 ? 0 : index);
      },
      onDelete: (id) => deleteMutationRef.current.mutate(id),
      onMore: (id, anchor) => {
        const node = screenById(id);
        if (!node) return;
        setContextMenu({
          x: anchor.x,
          y: anchor.y,
          items: [
            { label: "Refine with AI", onSelect: () => actionsRef.current.onEdit(id) },
            { label: "Create variations", onSelect: () => actionsRef.current.onVariation(id) },
            {
              label: "Generate mobile version",
              disabled: node.data.screen.platform === "mobile",
              onSelect: () => actionsRef.current.onMobile(id),
            },
            { label: "Preview", onSelect: () => actionsRef.current.onPreview(id) },
            { label: "Export as PNG", onSelect: () => void exportScreen(node.data.screen) },
            { label: "Delete", danger: true, onSelect: () => deleteMutationRef.current.mutate(id) },
          ],
        });
      },
    }),
    [runGenerate, screenById, selectOnly],
  );

  const actionsRef = useRef<ScreenNodeActions>(actions);
  actionsRef.current = actions;

  // Keep the live action closures on every existing node.
  useEffect(() => {
    setNodes((prev) => prev.map((n) => (isScreenNode(n) ? { ...n, data: { ...n.data, actions } } : n)));
  }, [actions, setNodes]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<AnyFlowNode>[]) => {
      const finishedDrag = changes.some((c) => c.type === "position" && c.dragging === false);
      if (finishedDrag) {
        undoStack.current.push(screenNodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })));
        redoStack.current = [];
        setHistoryTick((t) => t + 1);
      }
      onNodesChange(changes);
      if (finishedDrag) {
        changes.forEach((c) => {
          if (c.type === "position" && c.dragging === false) {
            const node = flow.getNode(c.id);
            if (node && isScreenNode(node as AnyFlowNode)) {
              positionMutation.mutate({ id: node.id, x: node.position.x, y: node.position.y });
            }
          }
        });
      }
    },
    [flow, onNodesChange, positionMutation, screenNodes],
  );

  const applyPositions = useCallback(
    (positions: { id: string; x: number; y: number }[]) => {
      setNodes((prev) =>
        prev.map((n) => {
          const next = positions.find((p) => p.id === n.id);
          return next ? { ...n, position: { x: next.x, y: next.y } } : n;
        }),
      );
      positions.forEach((p) => positionMutation.mutate(p));
    },
    [positionMutation, setNodes],
  );

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(screenNodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })));
    applyPositions(previous);
    setHistoryTick((t) => t + 1);
  }, [applyPositions, screenNodes]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(screenNodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })));
    applyPositions(next);
    setHistoryTick((t) => t + 1);
  }, [applyPositions, screenNodes]);

  const arrange = useCallback(() => {
    const target = (selectedNodes.length > 1 ? selectedNodes : screenNodes).map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
    }));
    if (target.length === 0) return;
    undoStack.current.push(target);
    redoStack.current = [];
    setHistoryTick((t) => t + 1);
    applyPositions(arrangePositions(target));
  }, [applyPositions, screenNodes, selectedNodes]);

  async function exportScreen(screen: DesignScreenSummary) {
    setExportTarget(screen);
    setExporting(true);
    // Wait a frame so the off-screen renderer has the requested screen mounted.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      if (!frameRef.current) return;
      const dataUrl = await toPng(frameRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${screen.title.toLowerCase().replace(/\s+/g, "-") || "design-screen"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setInlineError("Couldn't export that screen as an image.");
    } finally {
      setExporting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || generateMutation.isPending || editMutation.isPending) return;

    if (selectedNodes.length === 0) {
      runGenerate(text, platform, nextGridPosition(), "Generating screen…");
      setPrompt("");
      return;
    }

    if (mode === "explore") {
      selectedNodes.forEach((node, i) => {
        void sourceBrief(node.data.screen).then((brief) =>
          window.setTimeout(
            () => runGenerate(`${brief}\n\n${text}`, node.data.screen.platform, besidePosition(node.position, i), "Variation…"),
            i * 80,
          ),
        );
      });
      setPrompt("");
      return;
    }


    // Refine (and Create with a selection) edits exactly the selected screens.
    selectedNodes.forEach((node) => editMutation.mutate({ screenId: node.id, instruction: text }));
    setPrompt("");
  }

  const commands: StudioCommand[] = useMemo(
    () => [
      { label: "Create screen", hint: "Prompt", onRun: () => document.querySelector<HTMLTextAreaElement>("textarea")?.focus() },
      {
        label: "Create variations of selection",
        onRun: () => selectedNodes[0] && actionsRef.current.onVariation(selectedNodes[0].id),
      },
      { label: "Arrange screens", onRun: arrange },
      { label: "Open design system", onRun: () => setDesignSystemOpen(true) },
      { label: "Open agent panel", onRun: () => setAgentOpen(true) },
      { label: "Preview prototype", onRun: () => setPrototypeStart(0) },
      { label: "Zoom to fit", hint: "Cmd 0", onRun: () => flow.fitView({ duration: 200, padding: 0.25 }) },
      {
        label: "Export selection as PNG",
        onRun: () => selectedNodes[0] && void exportScreen(selectedNodes[0].data.screen),
      },
    ],
    [arrange, flow, selectedNodes],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (typing) {
        if (e.key === "Escape") target?.blur();
        return;
      }
      if (meta && e.key === "0") {
        e.preventDefault();
        flow.fitView({ duration: 200, padding: 0.25 });
      } else if (meta && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        flow.zoomIn({ duration: 200 });
      } else if (meta && e.key === "-") {
        e.preventDefault();
        flow.zoomOut({ duration: 200 });
      } else if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        redo();
      } else if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodes.length > 0) {
          e.preventDefault();
          selectedNodes.forEach((n) => deleteMutation.mutate(n.id));
        }
      } else if (e.key === "Escape") {
        setNodes((prev) => prev.map((n) => ({ ...n, selected: false })));
        setContextMenu(null);
        setDesignSystemOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteMutation, flow, redo, selectedNodes, setNodes, undo]);

  useEffect(() => {
    if (selectedNodes.length === 0 && mode !== "create") setMode("create");
  }, [mode, selectedNodes.length]);

  const projectName = projectQuery.data?.name ?? "Untitled design";
  const selectionLabel =
    selectedNodes.length === 1
      ? selectedNodes[0]!.data.screen.title
      : selectedNodes.length > 1
        ? `${selectedNodes.length} screens`
        : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-bg text-fg">
      <StudioTopBar
        projectName={screensQuery.isLoading ? `Opening ${projectName}…` : projectName}
        saveState={saveState}
        canUndo={undoStack.current.length > 0 && historyTick >= 0}
        canRedo={redoStack.current.length > 0}
        onUndo={undo}
        onRedo={redo}
        onPreview={() => setPrototypeStart(0)}
        onExport={() => selectedNodes[0] && void exportScreen(selectedNodes[0].data.screen)}
        exporting={exporting}
        onArrange={arrange}
        onOpenDesignSystem={() => {
          setDesignSystemOpen(true);
          setAgentOpen(false);
        }}
        onToggleAgent={() => {
          setAgentOpen((v) => !v);
          setDesignSystemOpen(false);
        }}
        agentOpen={agentOpen}
      />

      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={EMPTY_EDGES}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onPaneContextMenu={(event) => {
            event.preventDefault();
            const e = event as unknown as MouseEvent;
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              items: [
                { label: "Create screen here", onSelect: () => document.querySelector<HTMLTextAreaElement>("textarea")?.focus() },
                { label: "Select all screens", onSelect: () => setNodes((prev) => prev.map((n) => ({ ...n, selected: true }))) },
                { label: "Arrange screens", onSelect: arrange },
                { label: "Zoom to fit", onSelect: () => flow.fitView({ duration: 200, padding: 0.25 }) },
              ],
            });
          }}
          onPaneClick={() => setContextMenu(null)}
          minZoom={0.15}
          maxZoom={2.5}
          zoomOnDoubleClick={false}
          panOnScroll
          selectionOnDrag
          multiSelectionKeyCode="Shift"
          panActivationKeyCode="Space"
          proOptions={{ hideAttribution: true }}
          className="[&_.react-flow\_\_pane]:cursor-default"
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="var(--line-strong)" />
        </ReactFlow>

        {/* Empty canvas: a calm invitation, not an intimidating grid. */}
        {!screensQuery.isLoading && screenNodes.length === 0 && nodes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6 text-center"
          >
            <h2 className="text-h2 text-fg">Start designing</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-fg-subtle">
              Describe an interface below and Believe will build it here on the canvas.
            </p>
            <div className="pointer-events-auto mt-4 flex flex-wrap justify-center gap-1.5">
              {STARTER_PROMPTS.slice(0, 4).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="rounded-pill border border-line bg-surface-3/85 px-3 py-1.5 text-[11px] font-medium text-fg-muted shadow-flat backdrop-blur-[var(--liquid-blur-sm)] transition-colors duration-150 hover:border-line-strong hover:text-fg"
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Three tiny first-run tips, dismissed for good. */}
        {!hintsDismissed && screenNodes.length > 0 && (
          <div className="absolute left-3 top-3 z-20 w-60 rounded-xl border border-line bg-surface-3/90 p-3 shadow-lift backdrop-blur-[var(--liquid-blur-md)]">
            <ol className="space-y-1.5 text-[11px] leading-relaxed text-fg-muted">
              <li>1. Describe what you want below.</li>
              <li>2. Select a screen and ask AI to change it.</li>
              <li>3. Press Preview to play through your screens.</li>
            </ol>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("design-studio-hints", "done");
                setHintsDismissed(true);
              }}
              className="mt-2 text-[11px] font-semibold text-accent hover:underline"
            >
              Got it
            </button>
          </div>
        )}

        <ZoomControls
          zoom={zoom}
          onZoomIn={() => flow.zoomIn({ duration: 200 })}
          onZoomOut={() => flow.zoomOut({ duration: 200 })}
          onFit={() => flow.fitView({ duration: 200, padding: 0.25 })}
          onReset={() => flow.zoomTo(1, { duration: 200 })}
          onFitSelection={() =>
            flow.fitView({ duration: 220, padding: 0.35, nodes: selectedNodes.map((n) => ({ id: n.id })) })
          }
          hasSelection={selectedNodes.length > 0}
        />

        <AnimatePresence>
          {agentOpen && (
            <AgentPanel
              messages={messages}
              onClose={() => setAgentOpen(false)}
              selectionSummary={
                selectionLabel ? `${selectionLabel} · ${screenNodes.length} screens in project` : `${screenNodes.length} screens in project`
              }
              isGenerating={generateMutation.isPending || editMutation.isPending}
            />
          )}
          {designSystemOpen && <DesignSystemPanel onClose={() => setDesignSystemOpen(false)} />}
        </AnimatePresence>

        <PromptDock
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          mode={mode}
          onModeChange={setMode}
          platform={platform}
          onPlatformChange={setPlatform}
          selectionCount={selectedNodes.length}
          selectionLabel={selectionLabel}
          onClearSelection={() => setNodes((prev) => prev.map((n) => ({ ...n, selected: false })))}
          pending={generateMutation.isPending || editMutation.isPending}
          error={inlineError}
        />

        {contextMenu && (
          <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
        )}
      </div>

      <AnimatePresence>
        {prototypeStart !== null && screensInFlowOrder.length > 0 && (
          <PrototypeOverlay
            screens={screensInFlowOrder}
            startIndex={Math.min(prototypeStart, screensInFlowOrder.length - 1)}
            onClose={() => setPrototypeStart(null)}
          />
        )}
      </AnimatePresence>

      {paletteOpen && <StudioCommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}

      {/* Design Studio runs outside DashboardLayout (its own full-screen shell,
          see the router comment), so it doesn't inherit the floating notes
          mounted there — mount them here too, or notes never float on this page. */}
      <FloatingNotesLayer />

      {/* Off-screen renderer feeding PNG export at the screen's native width. */}
      <div style={{ position: "fixed", top: 0, left: -100000, pointerEvents: "none" }} aria-hidden>
        {exportTarget && (
          <div ref={frameRef} style={{ width: NATIVE_W[exportTarget.platform] }}>
            <DesignRenderer node={exportTarget.dsl} />
          </div>
        )}
      </div>
    </div>
  );
}

/** The canvas summary shape omits the original prompt, so variations and
 * responsive versions fetch the full screen to reuse the real brief; the title
 * is only a fallback if that read fails. */
async function sourceBrief(screen: DesignScreenSummary): Promise<string> {
  try {
    const full = await fetchDesignScreen(screen.id);
    return full.prompt;
  } catch {
    return screen.title;
  }
}

function toFlowNode(screen: DesignScreenSummary, actions: ScreenNodeActions): ScreenFlowNode {
  return {
    id: screen.id,
    type: "screenNode",
    position: { x: screen.canvasPosition.x, y: screen.canvasPosition.y },
    data: { screen, actions },
  };
}
