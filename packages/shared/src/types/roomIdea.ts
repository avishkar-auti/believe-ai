/** A single note posted to a group practice room's shared idea board,
 * scoped to one question within the room. */
export interface RoomIdea {
  id: string;
  roomId: string;
  questionId: string;
  authorUserId: string;
  authorName: string;
  text: string;
  createdAt: string;
}
