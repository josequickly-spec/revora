import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import LeadFinder from "@/components/leads/LeadFinder";

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
        description="Search public business records, review the evidence, then explicitly save and enrich one candidate."
        actions={[{ label: "Legacy workspace", href: "/legacy" }]}
      />
      <LeadFinder />
    </>
  );
}
