import { SectionLabel } from "../../components/ui/Surface.js";

export function CommunityGuidelines() {
  return (
    <div>
      <SectionLabel>Community guidelines</SectionLabel>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg-muted">
        <li>Be helpful and constructive</li>
        <li>Share useful context</li>
        <li>Respect different perspectives</li>
      </ul>
    </div>
  );
}
