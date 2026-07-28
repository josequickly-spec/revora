import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import AuditsView from "@/components/platform/AuditsView";

export const metadata: Metadata = {
  title: "Audits",
  description: "FunnelSpy audit history and evidence.",
};

export default function AuditsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Funnel Analysis"
        title="Audits"
        description="Review persisted FunnelSpy audits or start a new public-site analysis."
        actions={[
          { label: "New audit", href: "/funnelspy" },
          { label: "FunnelSpy history", href: "/funnelspy/history", tone: "secondary" },
        ]}
      />
      <AuditsView />
    </>
  );
}
