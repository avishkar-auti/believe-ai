import type { Template } from "@believe-ai/shared";
import { Select } from "../../components/ui/Select.js";

/** A compact dropdown — used for each follow-up row, where a full card list
 * would be too heavy. CampaignContentStep uses the richer card list instead
 * for the initial template, since that's the campaign's single most
 * important choice. */
export function TemplateSelect({
  templates,
  value,
  onChange,
  className,
}: {
  templates: Template[] | undefined;
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <Select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select a template…</option>
      {templates?.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </Select>
  );
}
