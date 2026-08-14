declare global {
  namespace Express {
    interface Request {
      /** MongoDB _id of the authenticated user, set by authMiddleware. */
      userId?: string;
      firebaseUid?: string;
      /** Display name, set by authMiddleware — lets routes denormalize an author name without a second DB lookup. */
      userName?: string;
    }
  }
}

export {};
