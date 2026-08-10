import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import ScrapingDashboard from "@/components/scraping/ScrapingDashboard";

export const metadata: Metadata = {
  title: "Web Scraping",
  description: "Advanced web scraping for lead discovery, analysis, and intelligence.",
};

export default function ScrapingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Intelligence Platform"
        title="Web Scraping"
        description="Advanced web scraping for discovering businesses, analyzing funnels, monitoring competitors, and enriching data automatically."
        actions={[
          { label: "View jobs", href: "/scraping?tab=jobs" },
          { label: "Documentation", href: "/docs/scraping", tone: "secondary" },
        ]}
      />
      <ScrapingDashboard />
    </>
  );
}
