import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ChallengeTrack } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";

const TRACK_META: Record<ChallengeTrack, { label: string; description: string }> = {
  "python-for-ai": {
    label: "Python for AI",
    description: "Tokenization, embeddings, and the Python building blocks every AI pipeline relies on.",
  },
  rag: {
    label: "RAG",
    description: "Chunking, retrieval, reranking, and evaluation for retrieval-augmented pipelines.",
  },
  agents: {
    label: "Agents",
    description: "Tool calling, loop control, and memory management for autonomous agents.",
  },
};

export function TrackOverviewCard({ track, count }: { track: ChallengeTrack; count: number }) {
  const meta = TRACK_META[track];

  return (
    <Link to={`/app/practice/challenges?track=${track}`} className="block h-full">
      <Card className="h-full transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-line-strong hover:shadow-card-hover">
        <CardBody>
          <p className="text-[15px] font-semibold text-fg">{meta.label}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{meta.description}</p>
          <p className="mt-3 flex items-center gap-1 text-caption font-semibold text-accent">
            {count} challenge{count === 1 ? "" : "s"} <ArrowRight className="h-3 w-3" />
          </p>
        </CardBody>
      </Card>
    </Link>
  );
}
