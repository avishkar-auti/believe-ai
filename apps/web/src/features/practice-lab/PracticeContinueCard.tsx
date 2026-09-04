import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import type { PracticeProgress } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";
import { fetchChallenges } from "./practiceApi.js";

export function PracticeContinueCard({ progress }: { progress: PracticeProgress }) {
  const mostRecent = [...progress.attempts].sort((a, b) => b.lastSubmittedAt.localeCompare(a.lastSubmittedAt))[0];
  const { data } = useQuery({ queryKey: ["practice-challenges", {}], queryFn: () => fetchChallenges(), enabled: Boolean(mostRecent) });
  const challenge = mostRecent && data ? data.items.find((c) => c.id === mostRecent.challengeId) : undefined;

  if (!mostRecent || !challenge) return null;

  return (
    <Link to={`/app/practice/challenges/${challenge.slug}`} className="block">
      <Card className="transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-line-strong hover:shadow-card-hover">
        <CardBody className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption font-medium text-fg-subtle">Continue practicing</p>
            <p className="mt-0.5 truncate text-[15px] font-semibold text-fg">{challenge.title}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
        </CardBody>
      </Card>
    </Link>
  );
}
