import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import { ProposalEditorView } from "@/components/proposals/ProposalViews";
export const metadata: Metadata = { title: "Proposal editor", description: "Edit, validate, version and explicitly publish a proposal." };
export default async function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><PageHeader eyebrow="Proposal Builder" title="Proposal editor" description="Pricing and terms remain under human control. Every save creates an immutable version." actions={[{ label: "All proposals", href: "/proposals", tone: "secondary" }]} /><ProposalEditorView proposalId={id} /></>;
}
