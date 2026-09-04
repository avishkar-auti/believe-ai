import { Card, CardBody } from "../../components/ui/Card.js";
import { SectionLabel } from "../../components/ui/Surface.js";
import { TrendingTopics } from "./TrendingTopics.js";
import { CommunityGuidelines } from "./CommunityGuidelines.js";

export function CommunitySidebar({
  totalPosts,
  trendingTopics,
}: {
  totalPosts?: number;
  /** No topic-aggregation endpoint exists yet, so callers never pass this today —
   * the section stays hidden rather than showing an empty card. See TrendingTopics.tsx. */
  trendingTopics?: { label: string; count: number }[];
}) {
  return (
    <aside className="hidden shrink-0 space-y-5 md:block md:w-[260px] lg:w-[300px]">
      {typeof totalPosts === "number" && (
        <Card>
          <CardBody>
            <SectionLabel>Community</SectionLabel>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-fg-muted">Posts</span>
              <span className="font-semibold tabular-nums text-fg">{totalPosts.toLocaleString()}</span>
            </div>
          </CardBody>
        </Card>
      )}

      {trendingTopics && trendingTopics.length > 0 && (
        <Card>
          <CardBody>
            <TrendingTopics topics={trendingTopics} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <CommunityGuidelines />
        </CardBody>
      </Card>
    </aside>
  );
}
