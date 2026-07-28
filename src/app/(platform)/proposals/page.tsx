import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import { ProposalListView } from "@/components/proposals/ProposalViews";
export const metadata: Metadata = { title: "Proposals", description: "Evidence-based versioned commercial proposals." };
export default function ProposalsPage() {
  return <><PageHeader eyebrow="Proposal Builder" title="Proposals" description="Human-controlled drafts, immutable versions and explicit publication." actions={[{ label: "Create Proposal", href: "/proposals/new" }]} /><ProposalListView /></>;
}
