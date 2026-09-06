"""The one place merge variables are defined, aliased, resolved and validated.

Before this module there were two registries — a Python one inlined in the
campaign send job and a TypeScript one in packages/shared — plus separate
regexes in template_service and email_content. They drifted: the composer
offered variables the sender pipeline didn't fill, and "missing" meant
different things in the editor than at send time.

Everything that renders a merge variable now goes through here:
  * template_service.preview()          — composer Preview + campaign preview
  * worker/jobs/send_campaign_email.py  — the real send, and follow-ups

Sender values come from the authenticated user's profile, never from the
request body, so a client can't spoof another user's identity into an email.

Kept deliberately in step with packages/shared/src/types/template.ts, which
drives the picker UI. If you add a variable, add it in both.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:  # avoids a models <-> services import cycle at runtime
    from models.user import User

VariableGroup = Literal["recipient", "sender"]

# {{name}} with optional inner whitespace — the exact shape every previous
# implementation used, so existing templates keep matching.
VARIABLE_PATTERN = re.compile(r"{{\s*(\w+)\s*}}")


@dataclass(frozen=True)
class VariableSpec:
    key: str
    label: str
    group: VariableGroup
    description: str

    # Whether an empty value should block a send. Only the ones an email is
    # genuinely broken without — a missing portfolio link is the user's
    # choice, a missing recipient first name produces "Hi ,".
    required: bool = False


# The canonical registry. Order matters — the picker renders it as-is.
VARIABLES: tuple[VariableSpec, ...] = (
    # --- Recipient: resolved per contact, changes for every email sent ---
    VariableSpec("firstName", "First name", "recipient", "Recipient's first name.", required=True),
    VariableSpec("lastName", "Last name", "recipient", "Recipient's last name."),
    VariableSpec("fullName", "Full name", "recipient", "Recipient's full name."),
    VariableSpec("company", "Company", "recipient", "Recipient's company.", required=True),
    VariableSpec("jobTitle", "Job title", "recipient", "The role you're writing about."),
    VariableSpec("recipientEmail", "Recipient email", "recipient", "Recipient's email address."),
    # --- Sender: resolved from the profile, identical for every recipient ---
    VariableSpec("senderName", "Your name", "sender", "From your profile name.", required=True),
    VariableSpec("senderFirstName", "Your first name", "sender", "From your profile name."),
    VariableSpec("senderLastName", "Your last name", "sender", "From your profile name."),
    VariableSpec("senderTitle", "Your title", "sender", "From your profile job title or headline."),
    VariableSpec("senderEmail", "Your email", "sender", "From your account email."),
    VariableSpec("senderCompany", "Your company", "sender", "From your profile company."),
    VariableSpec("phone", "Your phone", "sender", "From your profile phone number."),
    VariableSpec("linkedin", "LinkedIn", "sender", "A linked 'LinkedIn' from your profile."),
    VariableSpec("github", "GitHub", "sender", "A linked 'GitHub' from your profile."),
    VariableSpec("portfolio", "Portfolio", "sender", "A linked 'Portfolio' from your profile."),
    VariableSpec("linkedinUrl", "LinkedIn URL", "sender", "The raw LinkedIn URL as text."),
    VariableSpec("githubUrl", "GitHub URL", "sender", "The raw GitHub URL as text."),
    VariableSpec("portfolioUrl", "Portfolio URL", "sender", "The raw portfolio URL as text."),
)

VARIABLES_BY_KEY: dict[str, VariableSpec] = {spec.key: spec for spec in VARIABLES}

SENDER_KEYS = frozenset(spec.key for spec in VARIABLES if spec.group == "sender")

# The three link variables resolve to real anchor markup, so interpolate_html
# must not escape them. Everything else is untrusted text and gets escaped.
LINK_KEYS = frozenset({"linkedin", "github", "portfolio"})

# Older templates (and anything hand-written) may use snake_case. Normalising
# at resolve time avoids a destructive rewrite of stored template bodies.
ALIASES: dict[str, str] = {
    "first_name": "firstName",
    "last_name": "lastName",
    "full_name": "fullName",
    "job_title": "jobTitle",
    "recipient_email": "recipientEmail",
    "sender_name": "senderName",
    "sender_first_name": "senderFirstName",
    "sender_last_name": "senderLastName",
    "sender_title": "senderTitle",
    "sender_email": "senderEmail",
    "sender_company": "senderCompany",
    "linkedin_url": "linkedinUrl",
    "github_url": "githubUrl",
    "portfolio_url": "portfolioUrl",
}


def canonical_key(name: str) -> str:
    return ALIASES.get(name, name)


@dataclass
class PersonalizationContext:
    """Resolved values keyed by canonical variable name. Built once per
    sender (see build_sender_values) and merged with each recipient's own
    values, so a 500-recipient campaign reads the profile once."""

    sender: dict[str, str] = field(default_factory=dict)
    recipient: dict[str, str] = field(default_factory=dict)

    def values(self) -> dict[str, str]:
        return {**self.sender, **self.recipient}


def _split_name(name: str) -> tuple[str, str]:
    parts = name.strip().split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def _anchor(url: str, label: str) -> str:
    """Link markup for the rich-HTML body. The URL is attribute-escaped and
    limited to http(s) so a profile field can't smuggle javascript: into a
    sent email."""
    safe = url.strip()
    if not safe.lower().startswith(("http://", "https://")):
        safe = f"https://{safe}"
    if not safe.lower().startswith(("http://", "https://")):
        return label
    escaped = safe.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")
    return f'<a href="{escaped}">{label}</a>'


def build_sender_values(
    *,
    name: str | None,
    email: str | None,
    job_title: str | None,
    headline: str | None,
    company: str | None,
    phone: str | None,
    social_links: dict[str, str] | None,
) -> dict[str, str]:
    """Maps a User profile onto sender variables. Genuinely empty fields are
    left out rather than set to "" — that's what lets validation tell the
    difference between "resolved to nothing" and "not configured"."""
    links = social_links or {}
    values: dict[str, str] = {}

    if name and name.strip():
        first, last = _split_name(name)
        values["senderName"] = name.strip()
        if first:
            values["senderFirstName"] = first
        if last:
            values["senderLastName"] = last
    if email:
        values["senderEmail"] = email
    # jobTitle is the explicit field; headline is the public-profile tagline
    # and a reasonable fallback for people who only filled that in.
    title = job_title or headline
    if title:
        values["senderTitle"] = title
    if company:
        values["senderCompany"] = company
    if phone:
        values["phone"] = phone

    for key, label in (("linkedin", "LinkedIn"), ("github", "GitHub"), ("portfolio", "Portfolio")):
        url = links.get(key)
        if url:
            values[key] = _anchor(url, label)
            values[f"{key}Url"] = url

    return values


def build_recipient_values(
    *,
    first_name: str | None,
    last_name: str | None,
    email: str | None,
    company: str | None,
    job_title: str | None,
) -> dict[str, str]:
    values: dict[str, str] = {}
    if first_name:
        values["firstName"] = first_name
    if last_name:
        values["lastName"] = last_name
    full = " ".join(part for part in [first_name, last_name] if part).strip()
    if full:
        values["fullName"] = full
    if email:
        values["recipientEmail"] = email
    if company:
        values["company"] = company
    if job_title:
        values["jobTitle"] = job_title
    return values


def used_variables(*texts: str) -> list[str]:
    """Canonical names of every variable referenced across the given texts,
    including ones that resolve through an alias."""
    found: list[str] = []
    for text in texts:
        for match in VARIABLE_PATTERN.finditer(text or ""):
            key = canonical_key(match.group(1))
            if key not in found:
                found.append(key)
    return found


@dataclass
class ValidationIssue:
    variable: str
    label: str
    group: VariableGroup | None
    reason: Literal["missing", "unknown"]


def validate(*texts: str, values: dict[str, str]) -> list[ValidationIssue]:
    """Reports variables a template uses that won't render: sender/recipient
    fields with no value, and names that aren't in the registry at all.

    Deliberately reports rather than raises — the composer shows these as
    warnings while editing (someone may fill the profile in later), and only
    the campaign launch path treats them as blocking.
    """
    issues: list[ValidationIssue] = []
    for key in used_variables(*texts):
        spec = VARIABLES_BY_KEY.get(key)
        if spec is None:
            issues.append(ValidationIssue(key, key, None, "unknown"))
        elif not values.get(key):
            issues.append(ValidationIssue(key, spec.label, spec.group, "missing"))
    return issues


def sender_values_for_user(user: User) -> dict[str, str]:
    """The sender half of the context, straight off the profile document.

    Called once per campaign rather than once per recipient — sender values
    are identical for every email in a send, so re-deriving them 500 times
    was pure waste.
    """
    return build_sender_values(
        name=user.name or None,
        email=user.email,
        job_title=user.jobTitle,
        headline=user.headline,
        company=user.company,
        phone=user.phone,
        social_links=user.socialLinks,
    )
