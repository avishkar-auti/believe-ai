import type { HydratedDocument } from "mongoose";
import type { JobLead } from "@believe-ai/shared";
import { ContactModel, type JobLeadDocument } from "@believe-ai/server";
import { jobLeadRepository } from "../repositories/jobLead.repository.js";
import { jobIntelRepository } from "../repositories/jobIntel.repository.js";
import { resumeRepository } from "../repositories/resume.repository.js";
import { searchLinkedinLeads, type LinkedinProfile } from "./linkedinLeads.client.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";

// Ported from HireConnect's lead_discovery_config.py.
const HIRING_TEAM_TITLE_TEMPLATES = ["Engineering Manager", "Technical Recruiter", "Director of Engineering", "HRBP"];
const EMPLOYEE_DISCOVERY_TITLE = "Senior Software Engineer";
const MAX_LEADS_PER_JOB = 10;

interface CandidateLead {
  name: string;
  title: string | null;
  linkedinUrl: string | null;
  priorCompanies: string[];
  relevanceRank: number;
  warmPath: boolean;
  warmPathReason: string | null;
}

function buildTargetTitles(hiringTeamNames: string[]): string[] {
  const templated = HIRING_TEAM_TITLE_TEMPLATES.filter((t) => !hiringTeamNames.includes(t));
  return [...hiringTeamNames, ...templated];
}

function inferCompanyDomain(company: string): string | null {
  const cleaned = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned ? `${cleaned}.com` : null;
}

function inferEmailPattern(name: string, domain: string | null): string | null {
  if (!domain) return null;
  const parts = name
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => /^[a-z]+$/.test(p));
  if (parts.length < 2) return null;
  return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
}

/** A prior employer the profile lists that also shows up in the candidate's own
 * resume — a real, checkable overlap. Never alma-mater matching: this codebase
 * has no structured resume parser to extract "school" from, so that signal
 * (which HireConnect's reference implementation also uses) is honestly
 * dropped rather than faked. */
function computeWarmPath(priorCompanies: string[], resumeContent: string | null): { warmPath: boolean; reason: string | null } {
  if (!resumeContent) return { warmPath: false, reason: null };
  const lowered = resumeContent.toLowerCase();
  for (const company of priorCompanies) {
    if (company && lowered.includes(company.toLowerCase())) {
      return { warmPath: true, reason: `Prior company overlap: ${company}` };
    }
  }
  return { warmPath: false, reason: null };
}

function toCandidateLead(profile: LinkedinProfile, fallbackTitle: string, rank: number, warmPath = false, warmPathReason: string | null = null): CandidateLead {
  return {
    name: profile.name,
    title: profile.title ?? fallbackTitle,
    linkedinUrl: profile.linkedinUrl,
    priorCompanies: profile.priorCompanies,
    relevanceRank: rank,
    warmPath,
    warmPathReason,
  };
}

function mergeAndDeduplicate(leads: CandidateLead[]): CandidateLead[] {
  const merged = new Map<string, CandidateLead>();
  for (const lead of leads) {
    const key = lead.name.trim().toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...lead });
      continue;
    }
    existing.warmPath = existing.warmPath || lead.warmPath;
    if (!existing.warmPathReason && lead.warmPathReason) existing.warmPathReason = lead.warmPathReason;
    if (!existing.title && lead.title) existing.title = lead.title;
    if (!existing.linkedinUrl && lead.linkedinUrl) existing.linkedinUrl = lead.linkedinUrl;
  }
  return [...merged.values()];
}

function toDto(doc: HydratedDocument<JobLeadDocument>): JobLead {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    jobIntelId: doc.jobIntelId.toString(),
    name: doc.name,
    title: doc.title ?? null,
    linkedinUrl: doc.linkedinUrl ?? null,
    relevanceRank: doc.relevanceRank,
    warmPath: doc.warmPath,
    warmPathReason: doc.warmPathReason ?? null,
    workEmailPattern: doc.workEmailPattern ?? null,
    addedContactId: doc.addedContactId?.toString() ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const leadDiscoveryService = {
  toDto,

  /**
   * Step A (hiring team, by title) + Step B (employee discovery, warm-path
   * scored against the candidate's own resume) + Step C (merge/dedup, infer
   * a work-email pattern) -> deterministic ranking (warm-path first). No LLM
   * anywhere in this path — every field traces to a real LinkedIn profile
   * result or a real resume-text match. Ported from HireConnect's
   * lead_discovery_agent, minus its optional Grok re-rank step (the
   * deterministic warm-path-first ranking is already grounded and honest,
   * so an LLM re-rank wasn't worth the added complexity) and minus
   * alma-mater matching (no structured resume parser exists in this codebase).
   */
  async discover(userId: string, jobIntelId: string): Promise<JobLead[]> {
    const jobIntel = await jobIntelRepository.findById(jobIntelId, userId);
    if (!jobIntel) throw new NotFoundError("Job analysis not found");

    const resume = await resumeRepository.findByUserId(userId);

    const titles = buildTargetTitles(jobIntel.hiringTeamNames);
    const hiringTeamLeads: CandidateLead[] = [];
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i]!;
      const profiles = await searchLinkedinLeads(jobIntel.company, title);
      for (const profile of profiles) {
        hiringTeamLeads.push(toCandidateLead(profile, title, i + 1));
      }
    }

    const employeeProfiles = await searchLinkedinLeads(jobIntel.company, EMPLOYEE_DISCOVERY_TITLE);
    const employeeLeads: CandidateLead[] = employeeProfiles.map((profile) => {
      const { warmPath, reason } = computeWarmPath(profile.priorCompanies, resume?.content ?? null);
      return toCandidateLead(profile, EMPLOYEE_DISCOVERY_TITLE, 99, warmPath, reason);
    });

    const merged = mergeAndDeduplicate([...hiringTeamLeads, ...employeeLeads]);

    // Warm-path signals weighted above cold titles, then by discovery rank.
    merged.sort((a, b) => Number(b.warmPath) - Number(a.warmPath) || a.relevanceRank - b.relevanceRank);
    merged.forEach((lead, i) => (lead.relevanceRank = i + 1));

    const domain = inferCompanyDomain(jobIntel.company);
    const capped = merged.slice(0, MAX_LEADS_PER_JOB);

    await jobLeadRepository.deleteUnaddedByJobIntel(jobIntelId, userId);
    const created = await jobLeadRepository.createMany(
      capped.map((lead) => ({
        userId,
        jobIntelId,
        name: lead.name,
        title: lead.title,
        linkedinUrl: lead.linkedinUrl,
        relevanceRank: lead.relevanceRank,
        warmPath: lead.warmPath,
        warmPathReason: lead.warmPathReason,
        workEmailPattern: inferEmailPattern(lead.name, domain),
      })),
    );
    return (created as unknown as HydratedDocument<JobLeadDocument>[]).map(toDto);
  },

  async listByJobIntel(jobIntelId: string, userId: string): Promise<JobLead[]> {
    const docs = await jobLeadRepository.listByJobIntel(jobIntelId, userId);
    return docs.map(toDto);
  },

  /** The only path that can turn a discovered lead into a real, sendable
   * Contact — requires the user to supply a real email themselves, since
   * workEmailPattern is an inferred guess, never a verified address. */
  async addToContacts(leadId: string, userId: string, email: string): Promise<JobLead> {
    const lead = await jobLeadRepository.findById(leadId, userId);
    if (!lead) throw new NotFoundError("Discovered contact not found");
    if (lead.addedContactId) throw new ValidationError("Already added to contacts");

    const jobIntel = await jobIntelRepository.findById(lead.jobIntelId.toString(), userId);
    const [firstName, ...rest] = lead.name.trim().split(/\s+/);

    const contact = await ContactModel.create({
      userId,
      firstName: firstName || lead.name,
      lastName: rest.join(" "),
      email,
      company: jobIntel?.company ?? null,
      jobTitle: lead.title,
      notes: lead.linkedinUrl ? `LinkedIn: ${lead.linkedinUrl}` : null,
      source: "manual",
    });

    const updated = await jobLeadRepository.markAdded(leadId, userId, contact._id.toString());
    if (!updated) throw new NotFoundError("Discovered contact not found");
    return toDto(updated);
  },
};
