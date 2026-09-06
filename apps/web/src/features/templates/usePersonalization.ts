import { useQuery } from "@tanstack/react-query";
import { canonicalTemplateVariable, type PersonalizationContext } from "@believe-ai/shared";
import { fetchPersonalizationContext } from "./templatesApi.js";

/** Sender variables resolved from the signed-in user's profile. Shared by the
 * composer's variable picker, the sign-off picker, and the campaign wizard's
 * readiness check — one query, one answer, so those three can't disagree
 * about what {{senderTitle}} currently is. */
export function usePersonalizationContext() {
  return useQuery({ queryKey: ["personalization-context"], queryFn: fetchPersonalizationContext });
}

const VARIABLE_PATTERN = /{{\s*(\w+)\s*}}/g;

/** Canonical names of every variable a template references, in first-use
 * order. Mirrors the backend's own regex and alias folding
 * (services/personalization.py) so "used here" means what it means at send
 * time — {{sender_name}} and {{senderName}} are one variable, not two. */
export function usedVariables(...texts: (string | undefined)[]): string[] {
  const found: string[] = [];
  for (const text of texts) {
    for (const match of (text ?? "").matchAll(VARIABLE_PATTERN)) {
      const key = canonicalTemplateVariable(match[1]!);
      if (!found.includes(key)) found.push(key);
    }
  }
  return found;
}

export interface UnresolvedVariable {
  key: string;
  label: string;
  /** "sender" is fixable on the Profile page; "unknown" is a typo in the
   * template; "recipient" just means this particular contact lacks the field. */
  reason: "sender" | "unknown" | "recipient";
}

/** Which of a template's variables would render blank — split by what the
 * user can actually do about it.
 *
 * `recipientValues` is for the one contact being previewed, so a "recipient"
 * result is about that contact, not the template. Sender results apply to
 * every recipient, which is why only those block a launch. */
export function findUnresolved(
  texts: (string | undefined)[],
  recipientValues: Record<string, string | undefined>,
  context: PersonalizationContext | undefined,
): UnresolvedVariable[] {
  const specs = new Map(context?.variables.map((v) => [v.key, v]) ?? []);
  const unresolved: UnresolvedVariable[] = [];
  for (const key of usedVariables(...texts)) {
    const spec = specs.get(key);
    // Until the context loads we can't tell an unset sender field from an
    // unknown name, so report nothing rather than guess wrong.
    if (!spec) {
      if (context) unresolved.push({ key, label: key, reason: "unknown" });
      continue;
    }
    if (spec.group === "sender") {
      if (!spec.configured) unresolved.push({ key, label: spec.label, reason: "sender" });
    } else if (!recipientValues[key]) {
      unresolved.push({ key, label: spec.label, reason: "recipient" });
    }
  }
  return unresolved;
}
