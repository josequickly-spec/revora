import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import ModuleState from "@/components/app-shell/ModuleState";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Prioritized conversion opportunities derived from verified funnel evidence.",
};

export default function OpportunitiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Opportunity Engine"
        title="Opportunities"
        description="This surface will organize existing audit findings into a persistent opportunity lifecycle in a later authorized phase."
        actions={[{ label: "Review audits", href: "/audits" }]}
      />
      <ModuleState
        title="Module consolidation in progress"
        description="FunnelSpy scores, missing stages, weaknesses and recommendations remain available in each audit. Phase 1 does not create a duplicate opportunity model."
        action={{ label: "Open audit history", href: "/audits" }}
      />
    </>
  );
}
