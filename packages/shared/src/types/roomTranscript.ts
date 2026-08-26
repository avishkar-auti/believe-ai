/** A short chunk of browser-STT-captured speech from one participant's turn
 * in a group practice room. Batched client-side (~10-15s of speech) before
 * being posted, not streamed word-by-word. */
export type RoomTranscriptSource = "browser-stt";

export interface RoomTranscriptTurn {
  id: string;
  roomId: string;
  questionId: string | null;
  speakerUserId: string;
  speakerName: string;
  text: string;
  source: RoomTranscriptSource;
  capturedAt: string;
  createdAt: string;
}
