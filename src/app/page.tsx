import type { Metadata } from "next";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/app-shell/PageHeader";
import OverviewDashboard from "@/components/platform/OverviewDashboard";
import { brand } from "@/lib/brand";
import { ScrapingFeatureCard } from "@/components/scraping/QuickAccessButtons";

export const metadata: Metadata = {
  title: "Command Center",
  description: "Live command center for leads, intelligence, funnels, proposals, outreach and CRM.",
};

export default function OverviewPage() {
  return (
    <AppShell>
      <>
        <PageHeader
          eyebrow={`${brand.product} · Command Center`}
          title="Operate growth from one place"
          description={`A live workspace for moving evidence-backed opportunities through ${brand.name}: lead discovery, FunnelSpy, strategy, proposals, outreach and CRM.`}
          actions={[
            { label: "Find leads", href: "/leads" },
            { label: "Open Funnel Builder", href: "/funnelspy", tone: "secondary" },
          ]}
        />
        <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ScrapingFeatureCard icon="🔍" title="Business Discovery" description="Find businesses from web directories automatically" variant="leads" />
          <ScrapingFeatureCard icon="👁️" title="Funnel Analysis" description="Analyze competitor landing pages" variant="funnel" />
          <ScrapingFeatureCard icon="👥" title="Competitor Intelligence" description="Monitor competitor data and strategies" variant="competitor" />
          <ScrapingFeatureCard icon="💾" title="Data Enrichment" description="Enrich business information from web" variant="business" />
          <ScrapingFeatureCard icon="👤" title="Contact Extraction" description="Find decision-makers and employees" variant="contacts" />
          <ScrapingFeatureCard icon="📝" title="Proposal Personalization" description="Generate AI-personalized proposals" variant="proposal" />
        </section>
        <OverviewDashboard />
      </>
    </AppShell>
  );
}
