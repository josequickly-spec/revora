import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import BusinessesView from "@/components/platform/BusinessesView";

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
      <BusinessesView />
    </>
  );
}
