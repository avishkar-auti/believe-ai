import type { PracticeProgress } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";

export function PracticeProgressSummary({ progress }: { progress: PracticeProgress }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <CardBody>
          <p className="text-caption text-fg-subtle">Challenges solved</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-positive">{progress.challengesSolved}</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <p className="text-caption text-fg-subtle">Challenges attempted</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">{progress.challengesAttempted}</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <p className="text-caption text-fg-subtle">Total submissions</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">{progress.totalSubmissions}</p>
        </CardBody>
      </Card>
    </div>
  );
}
