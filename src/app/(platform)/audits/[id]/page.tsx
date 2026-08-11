import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import AuditsView from "@/components/platform/AuditsView";

export const metadata: Metadata = {
  title: "Audit detail",
  description: "Persisted FunnelSpy evidence, stages and consultant report.",
};

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader
        eyebrow="Funnel Analysis"
        title="Audit detail"
        description="This view reads the existing FunnelSpy audit record without re-running analysis."
        actions={[
          { label: "All audits", href: "/audits", tone: "secondary" },
          { label: "New audit", href: "/funnelspy" },
        ]}
      />
      <AuditsView selectedId={id} />
    </>
  );
}
