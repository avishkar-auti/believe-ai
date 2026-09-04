import type { Note, NoteFolder } from "@believe-ai/shared";
import { Drawer } from "../../components/ui/Drawer.js";
import { Badge } from "../../components/ui/Badge.js";

interface TipTapNode {
  text?: string;
  content?: TipTapNode[];
}

function countWords(doc: Record<string, unknown>): number {
  let words = 0;
  function walk(node: TipTapNode) {
    if (node.text) words += node.text.trim().split(/\s+/).filter(Boolean).length;
    node.content?.forEach(walk);
  }
  walk(doc as TipTapNode);
  return words;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** The one place metadata lives so the editor itself stays uncluttered —
 * word count, timestamps, tags, folder, and linked context (§ Note Info). */
export function NoteInfoDrawer({ note, folders, open, onClose }: { note: Note; folders: NoteFolder[] | undefined; open: boolean; onClose: () => void }) {
  const folder = folders?.find((f) => f.id === note.folderId);
  const words = countWords(note.content);

  return (
    <Drawer open={open} title="Note info" onClose={onClose}>
      <div className="space-y-5">
        <InfoRow label="Word count" value={`${words} word${words === 1 ? "" : "s"}`} />
        <InfoRow label="Created" value={formatDate(note.createdAt)} />
        <InfoRow label="Last edited" value={formatDate(note.updatedAt)} />
        <InfoRow label="Folder" value={folder?.name ?? "None"} />

        {note.linkedEntityLabel && <InfoRow label="Linked to" value={note.linkedEntityLabel} />}

        <div>
          <p className="mb-1.5 text-section uppercase text-fg-subtle">Tags</p>
          {note.tags.length === 0 ? (
            <p className="text-caption text-fg-subtle">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((t) => (
                <Badge key={t} tone="accent">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-section uppercase text-fg-subtle">{label}</p>
      <p className="mt-0.5 text-label text-fg">{value}</p>
    </div>
  );
}
