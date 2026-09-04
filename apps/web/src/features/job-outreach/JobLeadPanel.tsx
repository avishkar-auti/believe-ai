import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, HelpCircle, MessageSquarePlus, Search, UserCheck, UserPlus } from "lucide-react";
import type { Contact, JobLead, OutreachDraftIntent } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Input } from "../../components/ui/Input.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { fetchContacts } from "../contacts/contactsApi.js";
import { addJobLeadToContacts, discoverJobLeads, fetchJobLeads } from "./jobLeadApi.js";
import { generateOutreachDrafts } from "./outreachDraftApi.js";

const LINKEDIN_NOTE_RE = /LinkedIn:\s*(\S+)/;

export function JobLeadPanel({ jobIntelId, company }: { jobIntelId: string; company: string }) {
  const [open, setOpen] = useState(false);
  const [locationInputOpen, setLocationInputOpen] = useState(false);
  const [locationOverride, setLocationOverride] = useState("");
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["jobLeads", jobIntelId],
    queryFn: () => fetchJobLeads(jobIntelId),
    enabled: open,
  });

  // Checked as soon as the panel opens, before the user spends a search — no
  // point re-discovering people at a company you've already got real
  // contacts for. Client-side filtered to an exact (case-insensitive)
  // company match: the backend's `search` param also matches name/email
  // substrings, which is fine for the general contacts search but too broad
  // for "does this company already have someone."
  const existingContactsQuery = useQuery({
    queryKey: ["contacts", "byCompany", company],
    queryFn: () => fetchContacts({ search: company, limit: 50 }),
    enabled: open && !!company,
    select: (data) => data.items.filter((c) => c.company?.trim().toLowerCase() === company.trim().toLowerCase()),
  });
  const existingContacts = existingContactsQuery.data ?? [];

  const discoverMutation = useMutation({
    mutationFn: (options?: { broaden?: boolean; locationOverride?: string }) => discoverJobLeads(jobIntelId, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobLeads", jobIntelId] });
      setLocationInputOpen(false);
    },
  });

  return (
    <div className="border-t border-ink-100 pt-4 dark:border-ink-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-600 dark:hover:text-ink-300"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        Recommended people
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {existingContacts.length > 0 && (
            <div className="space-y-2 rounded-xl border border-lime-200 bg-lime-50/60 p-3 dark:border-lime-900/40 dark:bg-lime-950/20">
              <p className="text-sm font-medium text-ink-900 dark:text-white">
                You already have {existingContacts.length} contact{existingContacts.length === 1 ? "" : "s"} at{" "}
                {company} — no need to search again unless you want more.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {existingContacts.map((contact) => (
                  <ExistingContactCard key={contact.id} contact={contact} jobIntelId={jobIntelId} />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button variant="secondary" size="sm" onClick={() => discoverMutation.mutate({})} disabled={discoverMutation.isPending}>
              <Search className="h-3.5 w-3.5" />
              {discoverMutation.isPending
                ? "Searching…"
                : existingContacts.length > 0
                  ? "Find more contacts"
                  : "Find contacts"}
            </Button>
            {discoverMutation.isError && (
              <p className="text-sm text-red-600">
                {(discoverMutation.error as { message?: string })?.message || "Couldn't search for contacts."}
              </p>
            )}

            {leadsQuery.isLoading ? (
              <Spinner className="h-4 w-4 text-ink-400" />
            ) : !leadsQuery.data || leadsQuery.data.length === 0 ? (
              !discoverMutation.isPending &&
              existingContacts.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-ink-400">
                    {discoverMutation.isSuccess
                      ? "No relevant recruiting contacts were found for this company/location combination."
                      : 'Click "Find contacts" to search for recruiters and hiring managers at this company.'}
                  </p>
                  {discoverMutation.isSuccess &&
                    (locationInputOpen ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="e.g. Bangalore, India"
                          value={locationOverride}
                          onChange={(e) => setLocationOverride(e.target.value)}
                          className="h-9 flex-1 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => discoverMutation.mutate({ locationOverride })}
                          disabled={!locationOverride.trim() || discoverMutation.isPending}
                        >
                          Search
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setLocationInputOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => discoverMutation.mutate({ broaden: true })}>
                          Broaden search
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setLocationInputOpen(true)}>
                          Try another location
                        </Button>
                      </div>
                    ))}
                </div>
              )
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {leadsQuery.data.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} jobIntelId={jobIntelId} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RelationshipBadge() {
  return (
    <Badge
      tone="neutral"
      title="LinkedIn's own API can't confirm connection status without partner-tier access — this is honest, not a bug"
    >
      <HelpCircle className="mr-1 h-3 w-3" /> Relationship unavailable
    </Badge>
  );
}

function GenerateButtons({
  jobIntelId,
  contactId,
}: {
  jobIntelId: string;
  contactId: string;
}) {
  const [generatedFor, setGeneratedFor] = useState<OutreachDraftIntent | null>(null);
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: (intent: OutreachDraftIntent) => generateOutreachDrafts(jobIntelId, [contactId], undefined, intent),
    onSuccess: (_drafts, intent) => {
      void queryClient.invalidateQueries({ queryKey: ["outreachDrafts", jobIntelId] });
      setGeneratedFor(intent);
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => generateMutation.mutate("referral")}
          disabled={generateMutation.isPending}
        >
          <UserCheck className="h-3.5 w-3.5" /> Generate Referral Message
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => generateMutation.mutate("outreach")}
          disabled={generateMutation.isPending}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" /> Generate Connection Note
        </Button>
      </div>
      {generatedFor && (
        <p className="text-xs text-lime-600 dark:text-lime-400">Draft generated — review it in "Outreach drafts" below.</p>
      )}
      {generateMutation.isError && (
        <p className="text-sm text-red-600">
          {(generateMutation.error as { message?: string })?.message || "Couldn't generate a draft."}
        </p>
      )}
    </>
  );
}

function ExistingContactCard({ contact, jobIntelId }: { contact: Contact; jobIntelId: string }) {
  const linkedinUrl = useMemo(() => contact.notes?.match(LINKEDIN_NOTE_RE)?.[1], [contact.notes]);

  return (
    <Card>
      <CardBody className="space-y-2">
        <div>
          <p className="font-medium text-ink-900 dark:text-white">
            {contact.firstName} {contact.lastName}
          </p>
          {contact.jobTitle && <p className="text-xs text-ink-500 dark:text-ink-400">{contact.jobTitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
            >
              LinkedIn <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <span className="text-ink-400">
            {contact.outreachChannel === "linkedin" ? "LinkedIn message only — no email on file" : contact.email}
          </span>
        </div>

        <RelationshipBadge />
        <GenerateButtons jobIntelId={jobIntelId} contactId={contact.id} />
      </CardBody>
    </Card>
  );
}

function LeadCard({ lead, jobIntelId }: { lead: JobLead; jobIntelId: string }) {
  const [addingEmail, setAddingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (emailOverride?: string) => addJobLeadToContacts(lead.id, emailOverride),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobLeads", jobIntelId] });
      setAddingEmail(false);
    },
  });

  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-ink-900 dark:text-white">{lead.name}</p>
            {(lead.headline ?? lead.title) && (
              <p className="text-xs text-ink-500 dark:text-ink-400">{lead.headline ?? lead.title}</p>
            )}
          </div>
          <Badge tone={lead.relevanceScore >= 60 ? "success" : "neutral"}>{lead.relevanceScore}% relevant</Badge>
        </div>

        {lead.relevanceReasons.length > 0 && (
          <ul className="space-y-0.5 text-xs text-ink-500 dark:text-ink-400">
            {lead.relevanceReasons.map((reason) => (
              <li key={reason} className="flex items-center gap-1.5">
                <span className="h-1 w-1 shrink-0 rounded-full bg-ink-300 dark:bg-ink-600" /> {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lead.linkedinUrl && (
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300"
            >
              LinkedIn <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {lead.workEmailPattern && (
            <span className="text-ink-400" title="Inferred pattern, not a verified email">
              {lead.workEmailPattern} (guessed)
            </span>
          )}
        </div>

        <RelationshipBadge />

        {lead.addedContactId ? (
          <GenerateButtons jobIntelId={jobIntelId} contactId={lead.addedContactId} />
        ) : addingEmail ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="real.email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 flex-1 text-sm"
            />
            <Button size="sm" onClick={() => addMutation.mutate(email)} disabled={!email.trim() || addMutation.isPending}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingEmail(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAddingEmail(true)}>
              <UserPlus className="h-3.5 w-3.5" /> Add via email
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addMutation.mutate(undefined)}
              disabled={addMutation.isPending}
              title="Skip email — just generate the LinkedIn message to copy and send yourself"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" /> Get LinkedIn message
            </Button>
          </div>
        )}

        {addMutation.isError && (
          <p className="text-sm text-red-600">
            {(addMutation.error as { message?: string })?.message || "Couldn't add this contact."}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
