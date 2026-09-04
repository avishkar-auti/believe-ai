import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { fetchUsage } from "../../../features/settings/usageApi.js";

/** Real, backend-backed plan/usage — never hard-code the figures here.
 * Hidden entirely when the sidebar is collapsed (no room for a card at
 * 72px, and the brief explicitly asks to hide usage text in compact mode). */
export function SidebarPlanCard({ collapsed }: { collapsed: boolean }) {
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: fetchUsage });
  if (collapsed || !usage) return null;

  const unlimited = usage.limits.maxContacts === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((usage.contacts / usage.limits.maxContacts) * 100));

  return (
    <div className="rounded-control border border-line bg-accent-soft/40 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-fg">
        <Zap className="h-3.5 w-3.5 text-accent" /> {usage.plan === "FREE" ? "Free plan" : `${usage.plan} plan`}
      </div>
      {!unlimited && (
        <>
          <p className="mb-1.5 text-[11px] text-fg-subtle">
            {usage.contacts.toLocaleString()} / {usage.limits.maxContacts.toLocaleString()} contacts used
          </p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-accent"
            />
          </div>
        </>
      )}
      <Link to="/app/pricing" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
        {usage.plan === "FREE" ? "Upgrade plan →" : "Manage plan →"}
      </Link>
    </div>
  );
}
