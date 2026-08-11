import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import { ConsultantDetailView } from "@/components/consultant/ConsultantView";

export const metadata: Metadata = { title: "Consultant report", description: "Review evidence-grounded AI strategy." };

export default async function ConsultantReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><PageHeader eyebrow="AI Consultant" title="Strategy report" description="Generated advisory content is displayed separately from deterministic evidence." actions={[{ label: "All reports", href: "/consultant", tone: "secondary" }]} /><ConsultantDetailView reportId={id} /></>;
}
