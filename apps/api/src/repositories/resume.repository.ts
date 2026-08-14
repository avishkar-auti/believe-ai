import { ResumeModel, ResumeFileModel, type ResumeDocument } from "@believe-ai/server";

export interface ResumeChunkRecord {
  text: string;
  vector: number[] | null;
}

export interface UpsertResumeRecord {
  userId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: string;
  chunks: ResumeChunkRecord[];
}

export const resumeRepository = {
  findByUserId(userId: string) {
    return ResumeModel.findOne({ userId });
  },

  /** One resume per user — re-uploading replaces the previous document wholesale. */
  upsert(record: UpsertResumeRecord) {
    return ResumeModel.findOneAndUpdate(
      { userId: record.userId },
      {
        fileName: record.fileName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        content: record.content,
        chunks: record.chunks,
      },
      { new: true, upsert: true },
    );
  },

  setChunkVectors(userId: string, vectors: (number[] | null)[]) {
    // Positional bulk update over the chunks array — each vector lines up
    // with the chunk at the same index in the array that was embedded.
    const update: Record<string, unknown> = {};
    vectors.forEach((vector, i) => {
      update[`chunks.${i}.vector`] = vector;
    });
    return ResumeModel.findOneAndUpdate({ userId }, { $set: update }, { new: true });
  },

  delete(userId: string) {
    return Promise.all([ResumeModel.findOneAndDelete({ userId }), ResumeFileModel.findOneAndDelete({ userId })]);
  },

  upsertFile(userId: string, fileName: string, mimeType: string, data: Buffer) {
    return ResumeFileModel.findOneAndUpdate(
      { userId },
      { fileName, mimeType, data },
      { new: true, upsert: true },
    );
  },

  findFileByUserId(userId: string) {
    return ResumeFileModel.findOne({ userId });
  },
};

export type { ResumeDocument };
