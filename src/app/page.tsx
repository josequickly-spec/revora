import type { Metadata } from "next";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/app-shell/PageHeader";
import OverviewDashboard from "@/components/platform/OverviewDashboard";

export const metadata: Metadata = {
  title: "Overview",
  description: "Live workspace totals, recent intelligence, audits and campaigns.",
};

export default function OverviewPage() {
  return (
    <AppShell>
      <>
        <PageHeader
          eyebrow="Lead Intelligence workspace"
          title="Overview"
          description="A live view of the businesses, contacts, funnels, audits and campaigns already stored in Revora."
          actions={[
            { label: "Find leads", href: "/leads" },
            { label: "New audit", href: "/funnelspy", tone: "secondary" },
          ]}
        />
        <OverviewDashboard />
      </>
    </AppShell>
  );
}
