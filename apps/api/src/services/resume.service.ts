// Import the internal module directly, not the package root — pdf-parse's
// index.js runs a debug demo block at import time whenever `module.parent`
// is falsy (true under tsx's module loader), which tries to read a
// nonexistent fixture PDF and crashes the whole process on startup.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { HydratedDocument } from "mongoose";
import type { Resume } from "@believe-ai/shared";
import type { ResumeDocument } from "@believe-ai/server";
import { resumeRepository } from "../repositories/resume.repository.js";
import { embedTexts } from "./aiServiceClient.js";
import { chunkText } from "../utils/chunkText.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { logger } from "../config/logger.js";

const MAX_RESUME_BYTES = 4 * 1024 * 1024;

function toDto(doc: HydratedDocument<ResumeDocument>): Resume {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    content: doc.content,
    chunks: doc.chunks.map((c) => ({ text: c.text, vector: c.vector ?? null })),
    embeddingReady: doc.chunks.length > 0 && doc.chunks.every((c) => c.vector != null),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const resumeService = {
  toDto,

  async getByUserId(userId: string): Promise<Resume> {
    const resume = await resumeRepository.findByUserId(userId);
    if (!resume) throw new NotFoundError("No resume uploaded yet");
    return toDto(resume);
  },

  /**
   * Upload replaces any existing resume wholesale (stale chunks/vectors from
   * a previous file can never survive). Parsing and chunking happen here,
   * not in apps/ai-service, so a resume can be stored and browsed even if
   * every AI provider is down — only the embedding step depends on AI, and
   * a partially-embedded resume degrades gracefully (embeddingReady: false)
   * rather than failing the whole upload.
   */
  async upload(userId: string, file: { originalname: string; mimetype: string; size: number; buffer: Buffer }, bearerToken: string): Promise<Resume> {
    if (file.mimetype !== "application/pdf") {
      throw new ValidationError("Only PDF resumes are supported right now");
    }
    if (file.size > MAX_RESUME_BYTES) {
      throw new ValidationError("Resume must be under 4 MB");
    }

    const parsed = await pdfParse(file.buffer).catch(() => {
      throw new ValidationError("Could not read this PDF — it may be corrupted or scanned as images");
    });
    const content = parsed.text.trim();
    if (!content) {
      throw new ValidationError("No extractable text found in this PDF");
    }

    const chunks = chunkText(content).map((text) => ({ text, vector: null as number[] | null }));

    await resumeRepository.upsertFile(userId, file.originalname, file.mimetype, file.buffer);
    const resume = await resumeRepository.upsert({
      userId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      content,
      chunks,
    });

    // Embedding failure shouldn't fail the upload — the resume is stored and
    // usable (e.g. for direct display) even before it's RAG-ready. The
    // caller can re-trigger embedding by re-uploading.
    try {
      const { vectors } = await embedTexts(
        bearerToken,
        chunks.map((c) => c.text),
      );
      const embedded = await resumeRepository.setChunkVectors(userId, vectors);
      return toDto(embedded ?? resume);
    } catch (err) {
      logger.warn({ err, userId }, "Resume embedding failed, resume stored without vectors");
      return toDto(resume);
    }
  },

  async delete(userId: string): Promise<void> {
    const [resume] = await resumeRepository.delete(userId);
    if (!resume) throw new NotFoundError("No resume uploaded yet");
  },
};
