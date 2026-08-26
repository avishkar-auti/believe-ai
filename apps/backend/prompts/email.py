"""Email writing/editing/personalization/insight prompts."""

from __future__ import annotations

from prompts.base import json_schema, log_prompt_version, untrusted_text
from schemas.ai import AiCampaignInsightRequest, AiEmailGenerationRequest, AiImproveRequest, AiPersonalizeRequest

PROMPT_VERSION = "v1"

_IMPROVE_INSTRUCTIONS: dict[str, str] = {
    "make_shorter": "Make this email noticeably shorter while keeping the core ask.",
    "make_professional": "Rewrite this email in a more professional register.",
    "make_friendly": "Rewrite this email in a warmer, friendlier tone.",
    "make_persuasive": "Rewrite this email to be more persuasive without being pushy.",
    "make_concise": "Tighten the wording; remove filler.",
    "fix_grammar": "Fix any grammar and spelling issues, otherwise keep it unchanged.",
    "rewrite": "Rewrite this email with fresh wording while keeping the same intent.",
}


def build_email_generation_prompt(req: AiEmailGenerationRequest) -> str:
    log_prompt_version("email_generation", PROMPT_VERSION)
    lines = [
        json_schema('{"subject": string, "body": string, "cta": string}'),
        f"Goal: {req.goal}",
        f"Target recipient: {req.target}",
        f"Tone: {req.tone}",
    ]
    if req.context:
        lines.append(
            "Real context was provided below — use it to make the email specific and credible (aim for ~120-160 words in the body)."
        )
        lines += untrusted_text("CONTEXT", req.context)
    else:
        lines.append("No extra context was provided — keep the body concise and generically applicable (~80-120 words).")
    return "\n".join(lines)


def build_improve_prompt(req: AiImproveRequest) -> str:
    log_prompt_version("improve", PROMPT_VERSION)
    return "\n".join(
        [
            _IMPROVE_INSTRUCTIONS[req.action],
            json_schema('{"subject": string, "body": string}'),
            f"Current subject: {req.subject}",
            f"Current body: {req.body}",
        ]
    )


def build_personalize_prompt(req: AiPersonalizeRequest) -> str:
    log_prompt_version("personalize", PROMPT_VERSION)
    lines = [
        "Personalize this email template for a specific recipient using only the contact data given.",
        json_schema('{"subject": string, "body": string}'),
        f"Template subject: {req.templateSubject}",
        f"Template body: {req.templateBody}",
        *untrusted_text("CONTACT DATA", req.contact.model_dump_json()),
    ]
    if req.senderContext:
        lines.append("Sender context was provided below — weave in at most one relevant detail from it, naturally.")
        lines += untrusted_text("CONTEXT about the sender", req.senderContext)
    return "\n".join(lines)


def build_campaign_insight_prompt(req: AiCampaignInsightRequest) -> str:
    log_prompt_version("campaign_insight", PROMPT_VERSION)
    lines = [
        "Analyze this email campaign's aggregate performance and give the sender actionable insight.",
        json_schema('{"summary": string, "whatWorked": string[], "whatToImprove": string[]}'),
        "Base your analysis only on the numbers given — do not invent specifics about recipients or content you haven't seen.",
        f"Campaign: {req.campaignName}",
        f"Emails sent: {req.sent}",
        f"Open rate: {req.openRate}%",
        f"Click rate: {req.clickRate}%",
        f"Reply rate: {req.replyRate}%",
        f"Bounce rate: {req.bounceRate}%",
    ]
    if req.sent < 30:
        lines.append(
            f"Only {req.sent} emails were sent — this is too small a sample for confident rate comparisons. "
            "Note that explicitly in the summary rather than treating the percentages as statistically solid."
        )
    return "\n".join(lines)
