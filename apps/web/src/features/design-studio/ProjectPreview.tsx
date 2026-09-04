import type { DesignNode, DesignPlatform } from "@believe-ai/shared";
import { Layers } from "lucide-react";
import { NATIVE_W } from "./canvasLayout.js";
import { DesignRenderer } from "./DesignRenderer.js";

/** A genuine miniature preview — the same scaled-DesignRenderer technique
 * ScreenNode.tsx uses on the canvas, reused here so a dashboard card shows
 * real content instead of a decorative placeholder. Falls back to a quiet
 * icon only when the project truly has no screen yet (previewDsl is null),
 * never a fake rendering. */
export function ProjectPreview({
  dsl,
  platform,
  width,
  height,
}: {
  dsl: DesignNode | null;
  platform: DesignPlatform | null;
  width: number;
  height: number;
}) {
  if (!dsl || !platform) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-2" style={{ width, height }}>
        <Layers className="h-6 w-6 text-fg-subtle" />
      </div>
    );
  }

  const nativeWidth = NATIVE_W[platform];
  const scale = width / nativeWidth;

  return (
    <div className="overflow-hidden bg-white" style={{ width, height }}>
      <div className="pointer-events-none" style={{ width: nativeWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <DesignRenderer node={dsl} />
      </div>
    </div>
  );
}
