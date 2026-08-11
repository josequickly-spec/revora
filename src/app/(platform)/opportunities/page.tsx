import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import OpportunitiesView from "@/components/opportunities/OpportunitiesView";

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
        description="Deterministic, evidence-linked opportunities derived from persisted FunnelSpy audits."
        actions={[{ label: "Review audits", href: "/audits" }]}
      />
      <OpportunitiesView />
    </>
  );
}
