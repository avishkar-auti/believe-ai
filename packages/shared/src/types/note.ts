/** Believe Notes. `content` is a TipTap/ProseMirror JSON document — the
 * frontend editor's own document format, opaque to everything except the
 * editor itself and the backend's plain-text extraction for AI/embedding. */
export interface Note {
  id: string;
  title: string;
  content: Record<string, unknown>;
  folderId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** List-view shape — omits the full editor content, which can be large. */
export interface NoteSummary {
  id: string;
  title: string;
  folderId: string | null;
  tags: string[];
  updatedAt: string;
}

export interface CreateNoteInput {
  title?: string;
  content?: Record<string, unknown>;
  folderId?: string | null;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: Record<string, unknown>;
  folderId?: string | null;
  tags?: string[];
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

export type NoteTransformAction = "explain" | "simplify" | "summarize" | "fix_grammar" | "generate_example";

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
