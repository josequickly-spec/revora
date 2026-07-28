import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import ModuleState from "@/components/app-shell/ModuleState";

export const metadata: Metadata = {
  title: "CRM",
  description: "Campaign and commercial pipeline access.",
};

export default function CrmPage() {
  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Pipeline & campaigns"
        description="The existing campaign dashboard and legacy CRM remain intact while they are brought under one bounded context."
        actions={[
          { label: "Open campaign dashboard", href: "/dashboard" },
          { label: "Open legacy pipeline", href: "/legacy", tone: "secondary" },
        ]}
      />
      <ModuleState
        title="CRM consolidation in progress"
        description="Campaigns and metrics continue to use their existing APIs and database records. Phase 1 adds navigation only and does not change campaign behavior."
        action={{ label: "Use current dashboard", href: "/dashboard" }}
      />
    </>
  );
}
