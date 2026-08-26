import { useEffect, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { fetchAttachmentBlobUrl } from "./notesApi.js";

// Matches attachmentUrl()'s shape: .../notes/<noteId>/attachments/<attachmentId>
const ATTACHMENT_SRC_RE = /\/notes\/([^/]+)\/attachments\/([^/?]+)/;
const MIN_WIDTH = 60;

/** Image extension with a drag-to-resize handle, storing the chosen width back
 * onto the node (persisted like any other attribute) so it's remembered next
 * time the note is opened. Also owns the attachment-auth blob-URL swap itself
 * (rather than an external DOM MutationObserver) — a NodeView re-render (e.g.
 * after every resize, since that updates the node's attrs) would otherwise
 * stomp an externally-set img.src back to the un-authenticated URL. */
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

function ResizableImageView({ node, updateAttributes, selected }: ReactNodeViewProps) {
  const src = node.attrs.src as string;
  const initialWidth = (node.attrs.width as number | null) ?? undefined;
  const [displayWidth, setDisplayWidth] = useState<number | undefined>(initialWidth);
  const [resolvedSrc, setResolvedSrc] = useState<string>(src);
  const dragState = useRef<{ startX: number; startWidth: number; currentWidth: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => setDisplayWidth(initialWidth), [initialWidth]);

  useEffect(() => {
    const match = ATTACHMENT_SRC_RE.exec(src);
    const noteId = match?.[1];
    const attachmentId = match?.[2];
    if (!noteId || !attachmentId) {
      setResolvedSrc(src);
      return;
    }
    let blobUrl: string | null = null;
    fetchAttachmentBlobUrl(noteId, attachmentId).then((url) => {
      blobUrl = url;
      setResolvedSrc(url);
    });
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = displayWidth ?? imgRef.current?.offsetWidth ?? 300;
    dragState.current = { startX: e.clientX, startWidth, currentWidth: startWidth };

    function onMove(ev: PointerEvent) {
      if (!dragState.current) return;
      const next = Math.max(MIN_WIDTH, dragState.current.startWidth + (ev.clientX - dragState.current.startX));
      dragState.current.currentWidth = next;
      setDisplayWidth(next);
    }
    function onUp() {
      if (dragState.current) updateAttributes({ width: dragState.current.currentWidth });
      dragState.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <NodeViewWrapper as="span" className="group relative inline-block align-bottom" data-drag-handle>
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={(node.attrs.alt as string) ?? ""}
        style={{ width: displayWidth ? `${displayWidth}px` : undefined, maxWidth: "100%", display: "block" }}
        className={selected ? "rounded ring-2 ring-brand-500" : "rounded"}
        draggable={false}
      />
      <span
        onPointerDown={startResize}
        className="absolute bottom-0.5 right-0.5 h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-brand-500 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ opacity: selected ? 1 : undefined }}
      />
    </NodeViewWrapper>
  );
}
