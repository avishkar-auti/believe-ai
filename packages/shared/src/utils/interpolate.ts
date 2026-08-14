import type { TemplateVariableValues } from "../types/template.js";

/**
 * Replaces {{variable}} placeholders with provided values. Unknown or
 * missing variables are left blank rather than throwing — templates must
 * still render for contacts with partial data.
 */
export function interpolateTemplate(text: string, values: TemplateVariableValues): string {
  return text.replace(/{{\s*(\w+)\s*}}/g, (_match, key: string) => {
    const value = values[key as keyof TemplateVariableValues];
    return value ?? "";
  });
}
