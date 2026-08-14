import type { HydratedDocument } from "mongoose";
import type { OutreachDraft, DraftStatus, OutreachDraftEditedText, CompanyIntel } from "@believe-ai/shared";
import type { OutreachDraftDocument } from "@believe-ai/server";
import { ContactModel } from "@believe-ai/server";
import { outreachDraftRepository } from "../repositories/outreachDraft.repository.js";
import { jobIntelRepository } from "../repositories/jobIntel.repository.js";
import { resumeRepository } from "../repositories/resume.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { generateOutreachDraft } from "./aiServiceClient.js";
import { computeOutreachHook, computeMatchingSkills } from "./outreachHook.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";

const LINKEDIN_NOTE_CHAR_LIMIT = 300;

function toDto(doc: HydratedDocument<OutreachDraftDocument>): OutreachDraft {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    jobIntelId: doc.jobIntelId.toString(),
    contactId: doc.contactId.toString(),
    contactName: doc.contactName,
    hook: doc.hook,
    hookConfidence: doc.hookConfidence as "high" | "low",
    coldEmail: doc.coldEmail,
    linkedinNote: doc.linkedinNote,
    referralRequest: doc.referralRequest ?? null,
    coverLetter: doc.coverLetter ?? null,
    status: doc.status as DraftStatus,
    editedText: (doc.editedText as OutreachDraftEditedText | null) ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Deterministic truncation — the model is asked to respect the 300-char LinkedIn
 * connection-note limit but isn't fully reliable about it on its own. */
function truncateLinkedinNote(text: string): string {
  if (text.length <= LINKEDIN_NOTE_CHAR_LIMIT) return text;
  return `${text.slice(0, LINKEDIN_NOTE_CHAR_LIMIT - 1).trimEnd()}…`;
}

export const outreachDraftService = {
  toDto,

  /**
   * Step A (grounded hook, no LLM) -> Step B (one Python call per contact for
   * cold email + LinkedIn note + optional cover letter). Every draft persists
   * as "pending" — nothing here ever sends anything (that's Phase 4).
   */
  async generate(userId: string, bearerToken: string, jobIntelId: string, contactIds: string[]): Promise<OutreachDraft[]> {
    if (contactIds.length === 0) throw new ValidationError("Select at least one contact");

    const jobIntel = await jobIntelRepository.findById(jobIntelId, userId);
    if (!jobIntel) throw new NotFoundError("Job analysis not found");

    const contacts = await ContactModel.find({ _id: { $in: contactIds }, userId });
    if (contacts.length !== contactIds.length) throw new NotFoundError("One or more contacts not found");

    const [resume, user] = await Promise.all([resumeRepository.findByUserId(userId), userRepository.findById(userId)]);

    const { hook, confidence } = computeOutreachHook(
      jobIntel.company,
      jobIntel.skills,
      jobIntel.companyIntel as CompanyIntel,
    );
    const matchingSkills = computeMatchingSkills(jobIntel.skills, resume?.content ?? null);
    const includeCoverLetter = Boolean(resume);

    const drafts = await Promise.all(
      contacts.map(async (contact) => {
        const contactName = `${contact.firstName} ${contact.lastName}`.trim();
        const ai = await generateOutreachDraft(bearerToken, {
          contactName,
          roleTitle: jobIntel.roleTitle,
          company: jobIntel.company,
          hook,
          matchingSkills,
          candidateName: user?.name || null,
          includeCoverLetter,
        });
        return {
          userId,
          jobIntelId,
          contactId: contact._id.toString(),
          contactName,
          hook,
          hookConfidence: confidence,
          coldEmail: ai.coldEmail,
          linkedinNote: truncateLinkedinNote(ai.linkedinNote),
          coverLetter: ai.coverLetter,
        };
      }),
    );

    const created = await outreachDraftRepository.createMany(drafts);
    return (created as unknown as HydratedDocument<OutreachDraftDocument>[]).map(toDto);
  },

  async listByJobIntel(jobIntelId: string, userId: string): Promise<OutreachDraft[]> {
    const docs = await outreachDraftRepository.listByJobIntel(jobIntelId, userId);
    return docs.map(toDto);
  },

  async decide(
    id: string,
    userId: string,
    status: DraftStatus,
    editedText: OutreachDraftEditedText | null,
  ): Promise<OutreachDraft> {
    if (status === "edited" && !editedText) {
      throw new ValidationError("editedText is required when marking a draft edited");
    }
    const doc = await outreachDraftRepository.updateStatus(id, userId, status, editedText);
    if (!doc) throw new NotFoundError("Draft not found");
    return toDto(doc);
  },
};
