import { Search } from "lucide-react";
import type { NoteFolder, NoteSearchResult, NoteSummary } from "@believe-ai/shared";
import { Spinner } from "../../components/ui/Spinner.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { SectionLabel } from "../../components/ui/Surface.js";
import { groupNotesByDate } from "./dateGroups.js";
import { NoteListItem } from "./NoteListItem.js";
import { NotesFilters, type NotesFilterState } from "./NotesFilters.js";
import type { NotesView } from "./NotesSidebar.js";

interface NotesListProps {
  view: NotesView;
  notes: NoteSummary[] | undefined;
  notesLoading: boolean;
  folders: NoteFolder[] | undefined;
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  searchQuery: string;
  searching: boolean;
  searchResults: NoteSearchResult[] | undefined;
  filters: NotesFilterState;
  onFiltersChange: (next: NotesFilterState) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDuplicate: (id: string) => void;
  onMoveToFolder: (id: string, folderId: string | null) => void;
  onArchiveToggle: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

const VIEW_EMPTY_COPY: Record<NotesView, { title: string; description: string }> = {
  all: { title: "Capture your first idea", description: "Keep interview prep, campaign ideas, job research and project notes in one place." },
  pinned: { title: "Nothing pinned yet", description: "Pin a note to keep it at the top of your list." },
  recent: { title: "No recent notes", description: "Notes you edit will show up here first." },
  archived: { title: "Nothing archived", description: "Archived notes stay out of your way without being deleted." },
  trash: { title: "Trash is empty", description: "Notes you delete are kept here until you remove them permanently." },
};

function applyFilters(notes: NoteSummary[], filters: NotesFilterState): NoteSummary[] {
  let result = notes;
  if (filters.linkedOnly) result = result.filter((n) => !!n.linkedEntityId);
  if (filters.date !== "any") {
    const now = Date.now();
    const cutoff = filters.date === "today" ? 86_400_000 : filters.date === "week" ? 7 * 86_400_000 : 30 * 86_400_000;
    result = result.filter((n) => now - new Date(n.updatedAt).getTime() <= cutoff);
  }
  return result;
}

export function NotesList({
  view,
  notes,
  notesLoading,
  folders,
  selectedNoteId,
  onSelectNote,
  searchInput,
  onSearchInputChange,
  searchQuery,
  searching,
  searchResults,
  filters,
  onFiltersChange,
  onTogglePin,
  onDuplicate,
  onMoveToFolder,
  onArchiveToggle,
  onDelete,
  onRestore,
  onPermanentDelete,
}: NotesListProps) {
  const trashed = view === "trash";
  const filtered = notes ? applyFilters(notes, filters) : undefined;
  const groups = filtered ? groupNotesByDate(filtered) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search notes…"
            className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-label text-fg outline-none placeholder:text-fg-subtle focus:border-accent"
          />
        </div>
        <NotesFilters value={filters} onChange={onFiltersChange} />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {searchQuery ? (
          searching ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-5 w-5 text-fg-subtle" />
            </div>
          ) : !searchResults || searchResults.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-label font-medium text-fg">No notes found for "{searchQuery}"</p>
              <p className="mt-1 text-caption text-fg-subtle">Try another search or clear filters.</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-section uppercase text-fg-subtle">Results</p>
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectNote(r.id)}
                  className="block w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fg/[0.04]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-label font-medium text-fg">{r.title || "Untitled note"}</span>
                    {typeof r.score === "number" && <span className="shrink-0 text-caption text-fg-subtle">{Math.round(r.score * 100)}%</span>}
                  </span>
                  <span className="mt-0.5 block line-clamp-1 text-caption text-fg-muted">{r.snippet}</span>
                </button>
              ))}
            </div>
          )
        ) : notesLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-5 w-5 text-fg-subtle" />
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <EmptyState className="border-none py-14" title={VIEW_EMPTY_COPY[view].title} description={VIEW_EMPTY_COPY[view].description} />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div key={group.label}>
                <SectionLabel className="px-3 pb-1">{group.label}</SectionLabel>
                <div className="space-y-0.5">
                  {group.notes.map((n) => (
                    <NoteListItem
                      key={n.id}
                      note={n}
                      active={selectedNoteId === n.id}
                      trashed={trashed}
                      folders={folders}
                      onClick={() => onSelectNote(n.id)}
                      onTogglePin={() => onTogglePin(n.id, !n.pinned)}
                      onDuplicate={() => onDuplicate(n.id)}
                      onMoveToFolder={(folderId) => onMoveToFolder(n.id, folderId)}
                      onArchiveToggle={() => onArchiveToggle(n.id, !n.archived)}
                      onDelete={() => onDelete(n.id)}
                      onRestore={() => onRestore(n.id)}
                      onPermanentDelete={() => onPermanentDelete(n.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
