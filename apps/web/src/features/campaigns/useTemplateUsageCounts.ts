import { useMemo } from "react";
import type { Campaign } from "@believe-ai/shared";

/** Real usage counts, computed client-side from the campaigns actually on
 * file — a template counts once per campaign that references it as the
 * initial send OR as any follow-up step. No backend aggregate exists for
 * this yet, so this is the honest way to surface it without inventing data. */
export function useTemplateUsageCounts(campaigns: Campaign[] | undefined): Record<string, number> {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of campaigns ?? []) {
      const ids = new Set([c.templateId, ...c.followUps.map((f) => f.templateId)]);
      for (const id of ids) if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [campaigns]);
}
