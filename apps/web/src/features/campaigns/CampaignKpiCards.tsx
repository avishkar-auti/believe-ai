import { AlertTriangle, Eye, Mail, MousePointerClick, Reply, Send } from "lucide-react";
import type { CampaignAnalytics } from "@believe-ai/shared";
import { Card, CardBody } from "../../components/ui/Card.js";

const KPIS: {
  key: "sent" | "delivered" | "uniqueOpened" | "uniqueClicked" | "replied" | "bounced";
  label: string;
  icon: typeof Send;
  iconClass: string;
  rateKey?: "openRate" | "clickRate" | "replyRate" | "bounceRate";
}[] = [
  { key: "sent", label: "Sent", icon: Send, iconClass: "bg-blue-500/10 text-blue-500" },
  { key: "delivered", label: "Delivered", icon: Mail, iconClass: "bg-emerald-500/10 text-emerald-500" },
  { key: "uniqueOpened", label: "Open Detected", icon: Eye, iconClass: "bg-violet-500/10 text-violet-500", rateKey: "openRate" },
  { key: "uniqueClicked", label: "Clicked", icon: MousePointerClick, iconClass: "bg-indigo-500/10 text-indigo-500", rateKey: "clickRate" },
  { key: "replied", label: "Replied", icon: Reply, iconClass: "bg-green-500/10 text-green-500", rateKey: "replyRate" },
  { key: "bounced", label: "Bounced", icon: AlertTriangle, iconClass: "bg-red-500/10 text-red-500", rateKey: "bounceRate" },
];

export function CampaignKpiCards({ analytics }: { analytics: CampaignAnalytics }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {KPIS.map(({ key, label, icon: Icon, iconClass, rateKey }) => (
        <Card key={key}>
          <CardBody className="!p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}>
              <Icon className="h-4.5 w-4.5" />
            </span>
            <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">{label}</p>
            <p className="text-2xl font-semibold text-ink-900 dark:text-white">{analytics[key]}</p>
            {rateKey && (
              <p className={`text-xs font-medium ${key === "bounced" ? "text-red-500" : "text-ink-400"}`}>{analytics[rateKey]}%</p>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
