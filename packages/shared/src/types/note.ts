/** Believe Notes. `content` is a TipTap/ProseMirror JSON document — the
 * frontend editor's own document format, opaque to everything except the
 * editor itself and the backend's plain-text extraction for AI/embedding. */
export interface Note {
  id: string;
  title: string;
  content: Record<string, unknown>;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  /** Opaque display metadata linking this note to another Believe.ai entity
   * (a campaign, interview room, contact, job, design project, ...). Never
   * inferred — only set when the frontend had a real entity in view. */
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  linkedEntityLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

/** List-view shape — omits the full editor content, which can be large, but
 * includes a short plainText preview so the list can show a snippet. */
export interface NoteSummary {
  id: string;
  title: string;
  preview: string;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  linkedEntityLabel: string | null;
  updatedAt: string;
}

/** "active" (default) excludes archived and trashed notes; "archived" is only
 * archived notes; "trash" is only soft-deleted notes. */
export type NoteView = "active" | "archived" | "trash";

export interface CreateNoteInput {
  title?: string;
  content?: Record<string, unknown>;
  folderId?: string | null;
  tags?: string[];
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  linkedEntityLabel?: string | null;
}

export interface UpdateNoteInput {
  title?: string;
  content?: Record<string, unknown>;
  folderId?: string | null;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  linkedEntityLabel?: string | null;
}

export interface NoteFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  filename: string;
  contentType: string;
  createdAt: string;
}

export interface RelatedNote {
  id: string;
  title: string;
  score: number | null;
}

export interface NoteSearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number | null;
}

export type NoteTransformAction = "explain" | "simplify" | "summarize" | "fix_grammar" | "generate_example" | "extract_action_items";

export interface NoteTextTransformResult {
  result: string;
}

export interface NoteQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

export interface NoteQuizResult {
  questions: NoteQuizQuestion[];
}

export interface NoteFlashcard {
  front: string;
  back: string;
}

export interface NoteFlashcardsResult {
  cards: NoteFlashcard[];
}

export interface NoteChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NoteTutorResult {
  answer: string;
}

export interface NoteTranscriptCleanupResult {
  title: string;
  markdown: string;
}

export type VoiceCommandType = "create_note" | "add_section" | "summarize" | "generate_questions" | "none";

export interface VoiceCommandResult {
  commandType: VoiceCommandType;
  noteTitle: string | null;
  sectionTitle: string | null;
  questionCount: number | null;
}

/** A saved, spaced-repetition-scheduled flashcard — distinct from the ephemeral
 * cards the quick-look "Flashcards" modal generates but never persists. */
export interface SavedFlashcard {
  id: string;
  noteId: string;
  noteTitle: string;
  front: string;
  back: string;
  dueAt: string;
  repetitions: number;
}

export type ReviewGrade = "again" | "hard" | "good" | "easy";
