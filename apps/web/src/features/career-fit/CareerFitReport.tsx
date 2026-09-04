import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { CareerFit } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { FitScore } from "./FitScore.js";
import { FitSummary } from "./FitSummary.js";
import { StrengthList } from "./StrengthList.js";
import { SkillGapList } from "./SkillGapList.js";
import { SuggestedRoles } from "./SuggestedRoles.js";

export function CareerFitReport({ fit, onDelete, deleting }: { fit: CareerFit; onDelete: () => void; deleting: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}>
      <Card>
        <CardHeader className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-h3 text-fg">{fit.targetRole ?? "Career Fit Analysis"}</p>
            <p className="mt-0.5 text-caption text-fg-subtle">
              Analyzed{" "}
              {new Date(fit.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete assessment"
            className="shrink-0 rounded-control p-2 text-fg-subtle transition-colors hover:bg-critical/10 hover:text-critical disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </CardHeader>

        <CardBody className="space-y-6">
          <FitScore fitScore={fit.fitScore} strengthCount={fit.strengths.length} gapCount={fit.skillGaps.length} />

          {fit.summary && <FitSummary summary={fit.summary} />}

          {(fit.strengths.length > 0 || fit.skillGaps.length > 0) && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {fit.strengths.length > 0 && <StrengthList strengths={fit.strengths} />}
              {fit.skillGaps.length > 0 && <SkillGapList skillGaps={fit.skillGaps} />}
            </div>
          )}

          <SuggestedRoles roles={fit.suggestedRoles} />
        </CardBody>
      </Card>
    </motion.div>
  );
}
