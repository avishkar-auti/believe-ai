import { Bookmark, Search } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Chip } from "../../components/ui/Chip.js";

const POPULAR_SEARCHES = ["AI Engineer", "Backend Engineer", "DevOps", "Cloud Engineer", "Data Engineer"];

export function JobSearchHeader({
  qInput,
  onQInputChange,
  onViewSaved,
}: {
  qInput: string;
  onQInputChange: (v: string) => void;
  onViewSaved: () => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">Career / Job Discovery</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-fg">Find work that fits you.</h1>
          <p className="mt-1.5 text-label font-normal text-fg-muted">
            Discover opportunities matched to your skills, experience, and career direction.
          </p>
        </div>
        <Button variant="secondary" onClick={onViewSaved}>
          <Bookmark className="h-4 w-4" /> Saved jobs
        </Button>
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <Input
          className="pl-10"
          placeholder="Search roles, companies, skills or technologies…"
          value={qInput}
          onChange={(e) => onQInputChange(e.target.value)}
        />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {POPULAR_SEARCHES.map((term) => (
          <Chip key={term} selected={qInput === term} onClick={() => onQInputChange(qInput === term ? "" : term)}>
            {term}
          </Chip>
        ))}
      </div>
    </div>
  );
}
