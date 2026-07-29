import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import ModuleState from "@/components/app-shell/ModuleState";

export const metadata: Metadata = {
  title: "Settings",
  description: "EcoScale Partner platform and integration settings.",
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Inspect integration readiness without exposing configured credentials or secret values."
        actions={[{ label: "Integration status", href: "/settings/integrations" }]}
      />
      <ModuleState
        title="Settings consolidation in progress"
        description="Phase 1 exposes the existing integration readiness endpoint. Authentication, tenancy, quotas and plugin configuration belong to later authorized phases."
        action={{ label: "Review integrations", href: "/settings/integrations" }}
      />
    </>
  );
}
