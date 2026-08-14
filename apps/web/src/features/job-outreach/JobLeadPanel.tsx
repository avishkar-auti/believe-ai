import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, Flame, Search, UserPlus } from "lucide-react";
import type { JobLead } from "@believe-ai/shared";
import { Button } from "../../components/ui/Button.js";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { Input } from "../../components/ui/Input.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { addJobLeadToContacts, discoverJobLeads, fetchJobLeads } from "./jobLeadApi.js";

export function JobLeadPanel({ jobIntelId }: { jobIntelId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["jobLeads", jobIntelId],
    queryFn: () => fetchJobLeads(jobIntelId),
    enabled: open,
  });

  const discoverMutation = useMutation({
    mutationFn: () => discoverJobLeads(jobIntelId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["jobLeads", jobIntelId] }),
  });

  return (
    <div className="border-t border-ink-100 pt-4 dark:border-ink-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-600 dark:hover:text-ink-300"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        Discovered contacts
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <Button variant="secondary" size="sm" onClick={() => discoverMutation.mutate()} disabled={discoverMutation.isPending}>
            <Search className="h-3.5 w-3.5" /> {discoverMutation.isPending ? "Searching…" : "Find contacts"}
          </Button>
          {discoverMutation.isError && (
            <p className="text-sm text-red-600">
              {(discoverMutation.error as { message?: string })?.message || "Couldn't search for contacts."}
            </p>
          )}

          {leadsQuery.isLoading ? (
            <Spinner className="h-4 w-4 text-ink-400" />
          ) : !leadsQuery.data || leadsQuery.data.length === 0 ? (
            !discoverMutation.isPending && (
              <p className="text-sm text-ink-400">
                No contacts discovered yet — click "Find contacts" to search LinkedIn for people at this company.
              </p>
            )
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {leadsQuery.data.map((lead) => (
                <LeadCard key={lead.id} lead={lead} jobIntelId={jobIntelId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, jobIntelId }: { lead: JobLead; jobIntelId: string }) {
  const [addingEmail, setAddingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: () => addJobLeadToContacts(lead.id, email),
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
            {lead.title && <p className="text-xs text-ink-500 dark:text-ink-400">{lead.title}</p>}
          </div>
          {lead.warmPath && (
            <Badge tone="success">
              <Flame className="mr-1 h-3 w-3" /> Warm
            </Badge>
          )}
        </div>

        {lead.warmPathReason && <p className="text-xs text-ink-500 dark:text-ink-400">{lead.warmPathReason}</p>}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lead.linkedinUrl && (
            <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline dark:text-brand-300">
              LinkedIn <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {lead.workEmailPattern && (
            <span className="text-ink-400" title="Inferred pattern, not a verified email">
              {lead.workEmailPattern} (guessed)
            </span>
          )}
        </div>

        {lead.addedContactId ? (
          <Badge tone="neutral">Added to contacts</Badge>
        ) : addingEmail ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="real.email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 flex-1 text-sm"
            />
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!email.trim() || addMutation.isPending}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAddingEmail(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAddingEmail(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Add to contacts
          </Button>
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
