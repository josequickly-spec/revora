import type { Metadata } from "next";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/app-shell/PageHeader";
import OverviewDashboard from "@/components/platform/OverviewDashboard";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Live workspace totals, recent intelligence, audits and campaigns.",
};

export default function OverviewPage() {
  return (
    <AppShell>
      <>
        <PageHeader
          eyebrow={brand.product}
          title="Dashboard"
          description={`A live view of the businesses, contacts, funnels, audits and campaigns stored in ${brand.name}.`}
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
