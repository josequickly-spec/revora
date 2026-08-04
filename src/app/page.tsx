import type { Metadata } from "next";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/app-shell/PageHeader";
import OverviewDashboard from "@/components/platform/OverviewDashboard";
import { brand } from "@/lib/brand";

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
        <OverviewDashboard />
      </>
    </AppShell>
  );
}
