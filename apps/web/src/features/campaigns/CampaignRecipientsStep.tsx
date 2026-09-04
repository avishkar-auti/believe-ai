import { Search, Users } from "lucide-react";
import type { Contact } from "@believe-ai/shared";
import { cn } from "../../lib/cn.js";
import { Button } from "../../components/ui/Button.js";
import { Checkbox } from "../../components/ui/Checkbox.js";
import { StepTitle } from "./StepTitle.js";

export function CampaignRecipientsStep({
  contacts,
  contactsLoading,
  selectedIds,
  onToggle,
  onToggleAll,
  allSelected,
  search,
  onSearchChange,
}: {
  contacts: Contact[];
  contactsLoading: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div>
      <StepTitle icon={<Users className="h-4 w-4" />} title="Choose your audience" description="Select the contacts that should receive this campaign." />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search contacts…"
            className="h-9 w-full rounded-control border border-line bg-surface pl-8 pr-3 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-caption text-fg-muted">{selectedIds.size} selected</span>
          <Button type="button" variant="ghost" size="sm" onClick={onToggleAll}>
            {allSelected ? "Deselect all" : "Select all"}
          </Button>
        </div>
      </div>

      <div className="max-h-[26rem] overflow-y-auto rounded-control border border-line">
        {contactsLoading ? (
          <p className="p-6 text-center text-caption text-fg-subtle">Loading contacts…</p>
        ) : contacts.length === 0 ? (
          <p className="p-6 text-center text-caption text-fg-subtle">{search.trim() ? `No contacts match "${search}".` : "No contacts yet — add some first."}</p>
        ) : (
          <div className="divide-y divide-line">
            {contacts.map((c) => {
              const selected = selectedIds.has(c.id);
              return (
                <label
                  key={c.id}
                  className={cn("flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors", selected ? "bg-accent-soft" : "hover:bg-surface-2")}
                >
                  <Checkbox checked={selected} onChange={() => onToggle(c.id)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label font-medium text-fg">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="truncate text-caption text-fg-subtle">{c.email}</p>
                  </div>
                  <span className="hidden w-32 shrink-0 truncate text-caption text-fg-muted sm:block">{c.company ?? "—"}</span>
                  <span className="hidden w-32 shrink-0 truncate text-caption text-fg-muted md:block">{c.jobTitle ?? "—"}</span>
                  <span className={cn("hidden shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-medium sm:block", c.subscribed ? "bg-positive/10 text-positive" : "bg-fg/[0.06] text-fg-subtle")}>
                    {c.subscribed ? "Subscribed" : "Unsubscribed"}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
