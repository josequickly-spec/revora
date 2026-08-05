import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import IntegrationsView from "@/components/platform/IntegrationsView";
import ParseHubPanel from "@/components/platform/ParseHubPanel";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Read-only readiness status for existing EcoScale Partner integrations.",
};

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Integrations"
        description="Read-only status from the existing integration endpoint. Secret values are never returned or rendered."
        actions={[{ label: "Back to settings", href: "/settings", tone: "secondary" }]}
      />
      <IntegrationsView />
      <ParseHubPanel />
    </>
  );
}
