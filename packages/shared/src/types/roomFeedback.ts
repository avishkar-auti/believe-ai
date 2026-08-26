/** One peer's star rating (+ optional comment) for another participant's
 * turn on a specific question within a group practice room. */
export interface RoomFeedback {
  id: string;
  roomId: string;
  questionId: string;
  turnSpeakerUserId: string;
  raterUserId: string;
  raterName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** Aggregate rating for one speaker across the whole room session — powers
 * the roster badge. Plain Node arithmetic, no AI involved. */
export interface RoomFeedbackSummaryEntry {
  speakerUserId: string;
  averageRating: number;
  ratingCount: number;
}
