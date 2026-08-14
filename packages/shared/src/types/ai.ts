/**
 * Request/response contracts for the AI writer & personalization endpoints.
 * Kept provider-agnostic — apps/api maps these to whichever AIProvider is
 * configured via env, never a hardcoded provider name.
 */
export interface AiEmailGenerationRequest {
  goal: string;
  target: string;
  tone: string;
  context?: string;
}

export interface AiEmailGenerationResult {
  subject: string;
  body: string;
  cta: string;
}

export type AiImproveAction =
  | "make_shorter"
  | "make_professional"
  | "make_friendly"
  | "make_persuasive"
  | "make_concise"
  | "fix_grammar"
  | "rewrite";

export interface AiImproveRequest {
  subject: string;
  body: string;
  action: AiImproveAction;
}

export interface AiPersonalizeRequest {
  templateSubject: string;
  templateBody: string;
  contact: {
    firstName: string;
    lastName: string;
    company: string | null;
    jobTitle: string | null;
  };
  senderContext?: string;
}

export interface AiPersonalizeResult {
  subject: string;
  body: string;
}

/**
 * Input to campaign insight generation is aggregate numbers only — never
 * per-recipient data — so AI analysis can't leak individual recipient
 * behavior (spec 5.17).
 */
export interface AiCampaignInsightRequest {
  campaignName: string;
  sent: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
}

export interface AiCampaignInsightResult {
  summary: string;
  whatWorked: string[];
  whatToImprove: string[];
}
