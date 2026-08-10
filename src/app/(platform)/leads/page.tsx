import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import LeadFinder from "@/components/leads/LeadFinder";
import { ScrapingQuickButton } from "@/components/scraping/QuickAccessButtons";

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
        actions={[{ label: "Saved businesses", href: "/businesses" }]}
      />
      <div className="mb-6">
        <ScrapingQuickButton variant="leads" />
      </div>
      <LeadFinder />
    </>
  );
}
