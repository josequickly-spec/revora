import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import { NewProposalView } from "@/components/proposals/ProposalViews";
export const metadata: Metadata = { title: "New proposal", description: "Create an explicit evidence-based proposal draft." };
export default async function NewProposalPage({ searchParams }: { searchParams: Promise<{ businessId?: string; auditId?: string; consultantReportId?: string }> }) {
  const query = await searchParams;
  return <><PageHeader eyebrow="Proposal Builder" title="Create proposal draft" description="Select persisted evidence and create a reviewable draft. Nothing is published automatically." actions={[{ label: "All proposals", href: "/proposals", tone: "secondary" }]} /><NewProposalView initialBusinessId={query.businessId ? Number(query.businessId) : undefined} initialAuditId={query.auditId} initialConsultantReportId={query.consultantReportId} /></>;
}
