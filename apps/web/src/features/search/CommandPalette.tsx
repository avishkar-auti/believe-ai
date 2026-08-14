import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Megaphone,
  Plug,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { fetchCampaigns } from "../campaigns/campaignsApi.js";
import { fetchContacts } from "../contacts/contactsApi.js";
import { fetchTemplates } from "../templates/templatesApi.js";
import { cn } from "../../lib/cn.js";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  to: string;
  Icon: typeof Search;
}

const PAGES: Command[] = [
  { id: "page-dashboard", label: "Dashboard", group: "Pages", to: "/app", Icon: LayoutDashboard },
  { id: "page-campaigns", label: "Campaigns", group: "Pages", to: "/app/campaigns", Icon: Megaphone },
  { id: "page-new-campaign", label: "Create campaign", group: "Pages", to: "/app/campaigns/new", Icon: Megaphone },
  { id: "page-contacts", label: "Contacts", group: "Pages", to: "/app/contacts", Icon: Users },
  { id: "page-templates", label: "Templates", group: "Pages", to: "/app/templates", Icon: FileText },
  { id: "page-ai", label: "Believe AI Writer", group: "Pages", to: "/app/ai-writer", Icon: Sparkles },
  { id: "page-analytics", label: "Analytics", group: "Pages", to: "/app/analytics", Icon: BarChart3 },
  { id: "page-integrations", label: "Integrations", group: "Pages", to: "/app/integrations", Icon: Plug },
  { id: "page-settings", label: "Settings", group: "Pages", to: "/app/settings", Icon: Settings },
];

const MAX_PER_GROUP = 5;

/** Lets the Topbar search button open the palette without lifting state or faking a keypress. */
export const OPEN_COMMAND_PALETTE_EVENT = "believe-ai:open-command-palette";

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Records are only fetched once the palette is first opened — no cost for
  // users who never reach for it.
  const { data: campaigns } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns, enabled: open });
  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates, enabled: open });
  const { data: contactsPage } = useQuery({
    queryKey: ["contacts", "palette"],
    queryFn: () => fetchContacts({ page: 1 }),
    enabled: open,
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpenRequest() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus after paint, or the input isn't mounted yet.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const record: Command[] = [
      ...(campaigns ?? []).map((c) => ({
        id: `campaign-${c.id}`,
        label: c.name,
        hint: c.status,
        group: "Campaigns",
        to: `/app/campaigns/${c.id}`,
        Icon: Megaphone,
      })),
      ...(contactsPage?.items ?? []).map((c) => ({
        id: `contact-${c.id}`,
        label: `${c.firstName} ${c.lastName}`.trim() || c.email,
        hint: c.email,
        group: "Contacts",
        to: "/app/contacts",
        Icon: Users,
      })),
      ...(templates ?? []).map((t) => ({
        id: `template-${t.id}`,
        label: t.name,
        hint: t.subject,
        group: "Templates",
        to: "/app/templates",
        Icon: FileText,
      })),
    ];

    const all = [...PAGES, ...record];
    const q = query.trim().toLowerCase();
    const matched = q
      ? all.filter((c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q))
      : all;

    // Cap each group so one long list can't push the others off screen.
    const perGroup = new Map<string, number>();
    return matched.filter((c) => {
      const seen = perGroup.get(c.group) ?? 0;
      if (seen >= MAX_PER_GROUP) return false;
      perGroup.set(c.group, seen + 1);
      return true;
    });
  }, [campaigns, contactsPage, templates, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  function run(command: Command) {
    setOpen(false);
    navigate(command.to);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (commands.length === 0 ? 0 : (i + 1) % commands.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (commands.length === 0 ? 0 : (i - 1 + commands.length) % commands.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = commands[activeIndex];
      if (command) run(command);
    }
  }

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search believe.ai"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-ink-100 px-4 dark:border-ink-700">
          <Search className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search campaigns, contacts, templates…"
            aria-label="Search"
            className="h-12 w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-50"
          />
        </div>

        {commands.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-500 dark:text-ink-400">
            No matches for “{query}”.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {commands.map((command, index) => {
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;
              const active = index === activeIndex;

              return (
                <li key={command.id}>
                  {showGroup && (
                    <p className="px-4 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-400">
                      {command.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => run(command)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2 text-left text-sm",
                      active ? "bg-ink-100 dark:bg-ink-700" : "hover:bg-ink-50 dark:hover:bg-ink-700/50",
                    )}
                  >
                    <command.Icon className="h-4 w-4 shrink-0 text-ink-400" />
                    <span className="truncate text-ink-900 dark:text-ink-50">{command.label}</span>
                    {command.hint && (
                      <span className="ml-auto truncate pl-3 text-xs text-ink-400">{command.hint}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-ink-100 px-4 py-2 text-xs text-ink-400 dark:border-ink-700">
          <kbd className="font-sans">↑↓</kbd> navigate · <kbd className="font-sans">↵</kbd> open ·{" "}
          <kbd className="font-sans">esc</kbd> close
        </div>
      </div>
    </div>
  );
}
