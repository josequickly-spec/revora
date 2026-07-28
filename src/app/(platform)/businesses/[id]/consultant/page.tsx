import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import { BusinessConsultantView } from "@/components/consultant/ConsultantView";

export const metadata: Metadata = { title: "Generate AI strategy", description: "Generate an evidence-grounded strategy from a persisted audit." };

export default async function BusinessConsultantPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ auditId?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const businessId = Number(id);
  return <><PageHeader eyebrow="AI Consultant" title={`Business #${businessId} strategy`} description="Select existing evidence, review deterministic opportunities, then explicitly generate an advisory report." actions={[{ label: "Business profile", href: `/businesses/${businessId}`, tone: "secondary" }, { label: "Report history", href: `/consultant?businessId=${businessId}` }]} /><BusinessConsultantView businessId={businessId} initialAuditId={query.auditId} /></>;
}
