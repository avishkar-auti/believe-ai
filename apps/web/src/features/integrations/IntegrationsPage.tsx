import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Card, CardBody } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Badge } from "../../components/ui/Badge.js";
import {
  disconnectProvider,
  fetchIntegrations,
  getConnectUrl,
  type EmailIntegrationProvider,
  type IntegrationStatus,
} from "./integrationsApi.js";

const PROVIDERS: { id: EmailIntegrationProvider; label: string; description: string }[] = [
  { id: "gmail", label: "Gmail", description: "Send campaigns from your Google account." },
  { id: "outlook", label: "Outlook", description: "Send campaigns from your Microsoft account." },
];

export function IntegrationsPage() {
  const { data } = useQuery({ queryKey: ["integrations"], queryFn: fetchIntegrations });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Integrations</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">Connect an email provider to send campaigns.</p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            connected={data?.find((i) => i.provider === provider.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ProviderCardProps {
  provider: { id: EmailIntegrationProvider; label: string; description: string };
  connected: IntegrationStatus | undefined;
}

function ProviderCard({ provider, connected }: ProviderCardProps) {
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: () => getConnectUrl(provider.id),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectProvider(provider.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["integrations"] }),
  });

  const error = connectMutation.error ?? disconnectMutation.error;

  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 shrink-0 text-brand-500" />
          <div>
            <p className="font-medium text-ink-900 dark:text-white">{provider.label}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {connected ? connected.email : provider.description}
            </p>
            {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
          </div>
        </div>

        {connected ? (
          <div className="flex shrink-0 items-center gap-3">
            <Badge tone="success">Connected</Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending ? "Connecting…" : `Connect ${provider.label}`}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
