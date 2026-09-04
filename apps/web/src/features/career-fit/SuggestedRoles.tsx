import { SuggestedRoleCard } from "./SuggestedRoleCard.js";

export function SuggestedRoles({ roles }: { roles: string[] }) {
  if (roles.length === 0) return null;
  return (
    <div>
      <p className="text-section uppercase text-fg-subtle">Roles worth exploring</p>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {roles.map((r) => (
          <SuggestedRoleCard key={r} role={r} />
        ))}
      </div>
    </div>
  );
}
