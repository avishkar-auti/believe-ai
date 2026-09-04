import { HelpCircle, MessageCircle, Trophy } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";

const QUICK_ACTIONS = [
  { id: "question", label: "Question", icon: HelpCircle, placeholder: "What's your question?" },
  { id: "discussion", label: "Discussion", icon: MessageCircle, placeholder: "What's on your mind?" },
  { id: "win", label: "Win", icon: Trophy, placeholder: "What are you celebrating?" },
] as const;

export function QuickComposer({
  authorInitials,
  onCompose,
}: {
  authorInitials: string;
  onCompose: (placeholder?: string) => void;
}) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {authorInitials}
          </span>
          <button
            type="button"
            onClick={() => onCompose()}
            className="h-11 flex-1 rounded-control border border-line bg-surface-2 px-4 text-left text-sm text-fg-subtle transition-colors hover:border-line-strong hover:bg-surface-3"
          >
            Share a question, win, or insight…
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-12">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onCompose(action.placeholder)}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <action.icon className="h-3.5 w-3.5" /> {action.label}
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
