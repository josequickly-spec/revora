import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import BusinessesView from "@/components/platform/BusinessesView";
import { ScrapingQuickAccessButton } from "@/components/scraping/QuickAccessButtons";

export const metadata: Metadata = {
  title: "Business Intelligence",
  description: "Saved businesses, contacts and funnel assets from the current EcoScale Partner workspace.",
};

export default function BusinessesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Intelligence"
        title="Businesses"
        description="Review the real businesses already persisted by manual entry, Lead Finder and Discovery."
        actions={[{ label: "Find businesses", href: "/leads" }]}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <ScrapingQuickAccessButton variant="business" />
        <ScrapingQuickAccessButton variant="competitor" />
      </div>
      <BusinessesView />
    </>
  );
}
