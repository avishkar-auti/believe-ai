import type {
  CreateNoteInput,
  Note,
  NoteChatMessage,
  NoteFlashcardsResult,
  NoteFolder,
  NoteQuizResult,
  NoteSearchResult,
  NoteSummary,
  NoteTextTransformResult,
  NoteTranscriptCleanupResult,
  NoteTransformAction,
  NoteTutorResult,
  NoteView,
  RelatedNote,
  ReviewGrade,
  SavedFlashcard,
  UpdateNoteInput,
  VoiceCommandResult,
} from "@believe-ai/shared";
import { apiClient } from "../../lib/apiClient.js";

export async function fetchNotes(params: { folderId?: string; tag?: string; view?: NoteView } = {}) {
  const res = await apiClient.get<NoteSummary[]>("/notes/", { params });
  return res.data;
}

export async function fetchNote(id: string) {
  const res = await apiClient.get<Note>(`/notes/${id}`);
  return res.data;
}

export async function createNote(input: CreateNoteInput) {
  const res = await apiClient.post<Note>("/notes/", input);
  return res.data;
}

export async function updateNote(id: string, input: UpdateNoteInput) {
  const res = await apiClient.patch<Note>(`/notes/${id}`, input);
  return res.data;
}

/** Soft delete — moves the note to trash. See permanentlyDeleteNote to
 * actually remove it. */
export async function deleteNote(id: string) {
  await apiClient.delete(`/notes/${id}`);
}

export async function restoreNote(id: string) {
  const res = await apiClient.post<Note>(`/notes/${id}/restore`);
  return res.data;
}

export async function permanentlyDeleteNote(id: string) {
  await apiClient.delete(`/notes/${id}/permanent`);
}

export async function searchNotes(q: string) {
  const res = await apiClient.get<NoteSearchResult[]>("/notes/search/", { params: { q } });
  return res.data;
}

export async function fetchTags() {
  const res = await apiClient.get<string[]>("/notes/tags/");
  return res.data;
}

export async function fetchFolders() {
  const res = await apiClient.get<NoteFolder[]>("/notes/folders/");
  return res.data;
}

export async function createFolder(input: { name: string }) {
  const res = await apiClient.post<NoteFolder>("/notes/folders/", input);
  return res.data;
}

export async function deleteFolder(id: string) {
  await apiClient.delete(`/notes/folders/${id}`);
}

export async function uploadAttachment(noteId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<{ id: string }>(`/notes/${noteId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export function attachmentUrl(noteId: string, attachmentId: string) {
  return `${apiClient.defaults.baseURL}/notes/${noteId}/attachments/${attachmentId}`;
}

/** The attachment route requires the same Bearer auth as every other API call,
 * but a plain <img src="..."> request can't carry that header — browsers never
 * attach it to resource loads. Fetching through apiClient (which does attach it)
 * and handing back a local blob: URL is what actually lets the image render. */
export async function fetchAttachmentBlobUrl(noteId: string, attachmentId: string) {
  const res = await apiClient.get(`/notes/${noteId}/attachments/${attachmentId}`, { responseType: "blob" });
  return URL.createObjectURL(res.data as Blob);
}

export async function cleanupTranscript(rawTranscript: string) {
  const res = await apiClient.post<NoteTranscriptCleanupResult>("/notes/transcript/cleanup", { rawTranscript });
  return res.data;
}

export async function transformNoteText(text: string, action: NoteTransformAction) {
  const res = await apiClient.post<NoteTextTransformResult>("/notes/ai/transform", { text, action });
  return res.data;
}

export async function generateQuiz(noteId: string, questionCount = 5) {
  const res = await apiClient.post<NoteQuizResult>(`/notes/${noteId}/quiz`, null, { params: { questionCount } });
  return res.data;
}

export async function generateFlashcards(noteId: string, cardCount = 8) {
  const res = await apiClient.post<NoteFlashcardsResult>(`/notes/${noteId}/flashcards`, null, { params: { cardCount } });
  return res.data;
}

export async function findRelatedNotes(noteId: string) {
  const res = await apiClient.get<RelatedNote[]>(`/notes/${noteId}/related`);
  return res.data;
}

export async function askTutor(question: string, history: NoteChatMessage[] = []) {
  const res = await apiClient.post<NoteTutorResult>("/notes/ask", { question, history });
  return res.data;
}

export async function parseVoiceCommand(transcript: string, hasActiveNote: boolean) {
  const res = await apiClient.post<VoiceCommandResult>("/notes/voice-command", { transcript, hasActiveNote });
  return res.data;
}

export async function summarizeNote(noteId: string) {
  const res = await apiClient.post<NoteTextTransformResult>(`/notes/${noteId}/summarize`);
  return res.data;
}

export async function saveFlashcardsForReview(noteId: string, cardCount = 8) {
  const res = await apiClient.post<SavedFlashcard[]>(`/notes/${noteId}/flashcards/save`, { cardCount });
  return res.data;
}

export async function fetchDueFlashcards(limit = 20) {
  const res = await apiClient.get<SavedFlashcard[]>("/notes/review/due", { params: { limit } });
  return res.data;
}

export async function fetchDueFlashcardCount() {
  const res = await apiClient.get<number>("/notes/review/due/count");
  return res.data;
}

export async function reviewFlashcard(cardId: string, grade: ReviewGrade) {
  const res = await apiClient.post<SavedFlashcard>(`/notes/review/${cardId}`, { grade });
  return res.data;
}
