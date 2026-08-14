import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Target, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.js";
import { Badge } from "../../components/ui/Badge.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Spinner } from "../../components/ui/Spinner.js";
import { deleteCareerFit, fetchCareerFits, generateCareerFit } from "./careerFitApi.js";

export function CareerFitPage() {
  const queryClient = useQueryClient();
  const [targetRole, setTargetRole] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["career-fit"], queryFn: fetchCareerFits });

  const generateMutation = useMutation({
    mutationFn: () => generateCareerFit(targetRole || undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["career-fit"] });
      setTargetRole("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCareerFit,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["career-fit"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900 dark:text-white">
          <Target className="h-5 w-5 text-brand-500" /> Career Fit
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          An honest read on your strengths and gaps, grounded in your uploaded resume.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Target role (optional) — e.g. Senior Backend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? "Analyzing…" : "Analyze my fit"}
          </Button>
        </CardBody>
        {generateMutation.isError && (
          <CardBody className="pt-0">
            <p className="text-sm text-red-600">Couldn't generate an assessment — upload a resume first, then try again.</p>
          </CardBody>
        )}
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-ink-400" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No assessments yet" description="Generate your first career-fit assessment above." />
      ) : (
        <div className="space-y-4">
          {data.items.map((fit) => (
            <Card key={fit.id}>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">
                    {fit.targetRole ?? "General assessment"}
                  </p>
                  <p className="text-xs text-ink-400">{new Date(fit.createdAt).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(fit.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-ink-700 dark:text-ink-200">{fit.summary}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-ink-400">Strengths</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fit.strengths.map((s) => (
                        <Badge key={s} tone="success">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-ink-400">Skill gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fit.skillGaps.map((s) => (
                        <Badge key={s} tone="warning">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {fit.suggestedRoles.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-ink-400">Suggested roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fit.suggestedRoles.map((r) => (
                        <Badge key={r} tone="info">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
