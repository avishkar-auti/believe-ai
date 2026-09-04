import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Star, X } from "lucide-react";
import { SKILL_CATEGORIES, type SkillCategory } from "@believe-ai/shared";
import { Card, CardBody, CardHeader } from "../../../components/ui/Card.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Select } from "../../../components/ui/Select.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { Skeleton } from "../../../components/ui/Skeleton.js";
import { cn } from "../../../lib/cn.js";
import { createSkill, deleteSkill, fetchSkills, updateSkill } from "../api/skillsApi.js";

const MAX_FEATURED = 5;

export function SkillsSection() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory>("Programming");

  const { data: items, isLoading } = useQuery({ queryKey: ["profile", "skills"], queryFn: fetchSkills });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["profile", "skills"] });
  }

  const createMutation = useMutation({
    mutationFn: () => createSkill({ name: name.trim(), category }),
    onSuccess: () => {
      invalidate();
      setName("");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => updateSkill(id, { featured }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({ mutationFn: deleteSkill, onSuccess: invalidate });

  const featuredCount = items?.filter((s) => s.featured).length ?? 0;
  const topSkills = (items ?? []).filter((s) => s.featured);
  const grouped = SKILL_CATEGORIES.map((cat) => ({
    category: cat,
    skills: (items ?? []).filter((s) => s.category === cat),
  })).filter((g) => g.skills.length > 0);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-h3 text-fg">Skills</h2>
      </CardHeader>
      <CardBody className="space-y-5">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createMutation.mutate();
          }}
        >
          <Input
            className="flex-1 min-w-[10rem]"
            placeholder="Add a skill (e.g. Python)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select className="w-40" value={category} onChange={(e) => setCategory(e.target.value as SkillCategory)}>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" variant="secondary" disabled={!name.trim() || createMutation.isPending}>
            Add
          </Button>
        </form>

        {isLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : !items || items.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="No skills added yet"
            description="Add your strongest technical skills."
          />
        ) : (
          <div className="space-y-5">
            {topSkills.length > 0 && (
              <div>
                <p className="mb-2 text-section uppercase text-fg-subtle">Top skills</p>
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <SkillPill
                      key={skill.id}
                      name={skill.name}
                      featured
                      onToggleFeatured={() => toggleFeaturedMutation.mutate({ id: skill.id, featured: false })}
                      onDelete={() => deleteMutation.mutate(skill.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {grouped.map(({ category: cat, skills }) => (
              <div key={cat}>
                <p className="mb-2 text-section uppercase text-fg-subtle">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <SkillPill
                      key={skill.id}
                      name={skill.name}
                      featured={skill.featured}
                      featuredDisabled={!skill.featured && featuredCount >= MAX_FEATURED}
                      onToggleFeatured={() => toggleFeaturedMutation.mutate({ id: skill.id, featured: !skill.featured })}
                      onDelete={() => deleteMutation.mutate(skill.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function SkillPill({
  name,
  featured,
  featuredDisabled,
  onToggleFeatured,
  onDelete,
}: {
  name: string;
  featured: boolean;
  featuredDisabled?: boolean;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm font-medium",
        featured ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-fg",
      )}
    >
      {name}
      <button
        type="button"
        aria-label={featured ? "Remove from top skills" : "Add to top skills"}
        disabled={featuredDisabled}
        onClick={onToggleFeatured}
        className={cn("rounded-pill p-0.5 disabled:opacity-30", featured ? "text-accent" : "text-fg-subtle hover:text-accent")}
      >
        <Star className={cn("h-3 w-3", featured && "fill-current")} />
      </button>
      <button type="button" aria-label={`Remove ${name}`} onClick={onDelete} className="rounded-pill p-0.5 text-fg-subtle hover:text-critical">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
