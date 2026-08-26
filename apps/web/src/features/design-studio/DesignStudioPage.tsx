import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Background, Controls, ReactFlow, useNodesState, type NodeMouseHandler, type OnNodeDrag } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { ArrowLeft } from "lucide-react";
import type { DesignPlatform, DesignScreenSummary } from "@believe-ai/shared";
import { ApiError } from "../../lib/apiClient.js";
import {
  createDesignScreen,
  editDesignScreen,
  fetchDesignProject,
  fetchDesignScreens,
  updateDesignScreenPosition,
} from "./designApi.js";
import { ActivityLog, type ChatMessage } from "./ActivityLog.js";
import { DesignRenderer } from "./DesignRenderer.js";
import { NATIVE_W, gridPosition } from "./canvasLayout.js";
import { GeneratingScreenNode, type GeneratingFlowNode } from "./GeneratingScreenNode.js";
import { PreviewModal } from "./PreviewModal.js";
import { PromptBar } from "./PromptBar.js";
import { ScreenNode, type ScreenFlowNode } from "./ScreenNode.js";

const nodeTypes = { screenNode: ScreenNode, generatingNode: GeneratingScreenNode };

type AnyFlowNode = ScreenFlowNode | GeneratingFlowNode;

function isScreenNode(node: AnyFlowNode): node is ScreenFlowNode {
  return node.type === "screenNode";
}

function toFlowNode(screen: DesignScreenSummary): ScreenFlowNode {
  return {
    id: screen.id,
    type: "screenNode",
    position: { x: screen.canvasPosition.x, y: screen.canvasPosition.y },
    data: { screen },
  };
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function DesignStudioPage() {
  const { projectId } = useParams<{ projectId: string }>();
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
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<DesignPlatform>("web");
  const [instruction, setInstruction] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  function pushMessage(role: ChatMessage["role"], text: string, isError = false) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text, isError }]);
  }

  useEffect(() => {
    if (!screensQuery.data || seededProjectRef.current === projectId) return;
    seededProjectRef.current = projectId ?? null;
    setNodes(screensQuery.data.map(toFlowNode));
  }, [screensQuery.data, projectId, setNodes]);

  const generateMutation = useMutation({
    mutationFn: (vars: { tempId: string; prompt: string; platform: DesignPlatform }) =>
      createDesignScreen(projectId!, { prompt: vars.prompt, platform: vars.platform }),
    onMutate: (vars) => {
      const placeholder: GeneratingFlowNode = {
        id: vars.tempId,
        type: "generatingNode",
        position: gridPosition(nodes.length),
        data: { platform: vars.platform },
      };
      setNodes((prev) => [...prev, placeholder]);
      pushMessage("user", vars.prompt);
      setPrompt("");
    },
    onSuccess: (result, vars) => {
      setNodes((prev) => prev.map((n) => (n.id === vars.tempId ? toFlowNode(result) : n)));
      pushMessage("assistant", `Generated '${result.title}'`);
    },
    onError: (err, vars) => {
      setNodes((prev) => prev.filter((n) => n.id !== vars.tempId));
      pushMessage("assistant", errorMessage(err, "Couldn't generate that screen — try again in a moment."), true);
    },
  });

  const editMutation = useMutation({
    mutationFn: (vars: { screenId: string; instruction: string }) =>
      editDesignScreen(vars.screenId, { instruction: vars.instruction }),
    onMutate: (vars) => {
      pushMessage("user", vars.instruction);
      setInstruction("");
    },
    onSuccess: (result) => {
      setNodes((prev) => prev.map((n) => (isScreenNode(n) && n.id === result.id ? toFlowNode(result) : n)));
      pushMessage("assistant", `Updated '${result.title}'`);
    },
    onError: (err) => {
      pushMessage("assistant", errorMessage(err, "Couldn't apply that edit — try again in a moment."), true);
    },
  });

  const positionMutation = useMutation({
    mutationFn: (vars: { id: string; x: number; y: number }) => updateDesignScreenPosition(vars.id, { x: vars.x, y: vars.y }),
    onError: (err) => console.warn("Failed to save screen position", err),
  });

  const handleNodeDragStop: OnNodeDrag<AnyFlowNode> = (_event, node) => {
    if (!isScreenNode(node)) return;
    positionMutation.mutate({ id: node.id, x: node.position.x, y: node.position.y });
  };

  const handleNodeClick: NodeMouseHandler<AnyFlowNode> = (_event, node) => {
    if (!isScreenNode(node)) return;
    setSelectedScreenId(node.id);
  };

  function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || generateMutation.isPending) return;
    generateMutation.mutate({ tempId: crypto.randomUUID(), prompt: prompt.trim(), platform });
  }

  function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!instruction.trim() || !selectedScreenId || editMutation.isPending) return;
    editMutation.mutate({ screenId: selectedScreenId, instruction: instruction.trim() });
  }

  const selectedScreen = nodes.find((n): n is ScreenFlowNode => isScreenNode(n) && n.id === selectedScreenId)?.data.screen ?? null;

  async function handleExport() {
    if (!frameRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(frameRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${(selectedScreen?.title || "design-screen").toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  const inlineError = selectedScreenId
    ? editMutation.isError
      ? errorMessage(editMutation.error, "Couldn't apply that edit — try again in a moment.")
      : null
    : generateMutation.isError
      ? errorMessage(generateMutation.error, "Couldn't generate that screen — try again in a moment.")
      : null;

  return (
    <div className="space-y-4">
      <div className="border-b border-ink-200/80 pb-4 dark:border-ink-700">
        <Link
          to="/app/design-studio"
          className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </Link>
        <h1 className="text-title font-semibold text-ink-900 dark:text-white">{projectQuery.data?.name ?? "Design Studio"}</h1>
      </div>

      <div className="relative h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border border-ink-800 bg-[#0b0d12]">
        <ReactFlow
          nodes={nodes}
          edges={[]}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          onPaneClick={() => {
            setSelectedScreenId(null);
            setPreviewOpen(false);
          }}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#2a2f3a" gap={22} size={1.5} />
          <Controls
            position="center-right"
            orientation="vertical"
            className="!rounded-pill !border !border-ink-700 !bg-ink-800/90 !shadow-lift [&>button]:!border-ink-700 [&>button]:!bg-transparent [&>button]:!fill-ink-300 [&>button]:!text-ink-300 [&>button:hover]:!bg-ink-700"
          />
        </ReactFlow>

        <ActivityLog messages={messages} />

        <PromptBar
          selectedScreenTitle={selectedScreen?.title ?? null}
          onDeselect={() => {
            setSelectedScreenId(null);
            setPreviewOpen(false);
          }}
          prompt={prompt}
          setPrompt={setPrompt}
          platform={platform}
          setPlatform={setPlatform}
          instruction={instruction}
          setInstruction={setInstruction}
          onSubmitGenerate={handleGenerate}
          onSubmitEdit={handleEdit}
          isPending={selectedScreenId ? editMutation.isPending : generateMutation.isPending}
          error={inlineError}
          onExport={handleExport}
          downloading={downloading}
          onPreview={() => setPreviewOpen(true)}
        />

        {previewOpen && selectedScreen && <PreviewModal screen={selectedScreen} onClose={() => setPreviewOpen(false)} />}
      </div>

      {/* Off-screen renderer feeding PNG export — the canvas itself is the only
          visible presentation of a screen, matching Stitch (no separate preview pane). */}
      <div style={{ position: "fixed", top: 0, left: -100000, pointerEvents: "none" }} aria-hidden>
        {selectedScreen && (
          <div ref={frameRef} style={{ width: NATIVE_W[selectedScreen.platform] }}>
            <DesignRenderer node={selectedScreen.dsl} />
          </div>
        )}
      </div>
    </div>
  );
}
