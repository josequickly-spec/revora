import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import ModuleState from "@/components/app-shell/ModuleState";

export const metadata: Metadata = {
  title: "Leads",
  description: "Discover public business candidates and move them into business intelligence.",
};

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Lead Finder"
        title="Leads"
        description="Lead Finder remains fully available in the legacy workspace while its search and enrichment flows are separated in Phase 2."
        actions={[{ label: "Open current Lead Finder", href: "/legacy" }]}
      />
      <ModuleState
        title="Module consolidation in progress"
        description="No lead metrics are fabricated here. The current OpenStreetMap search, Discovery, Hunter and BuiltWith workflows remain unchanged and accessible."
        action={{ label: "Use existing Lead Finder", href: "/legacy" }}
      />
    </>
  );
}
