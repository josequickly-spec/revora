import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import RecordsView from "@/components/platform/RecordsView";

export const metadata: Metadata = {
  title: "Proposals",
  description: "Persisted proposal and revenue-share records.",
};

export default function ProposalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Proposal Generator"
        title="Proposals"
        description="Review proposal records already stored by the current revenue-share workflow."
        actions={[{ label: "Open current generator", href: "/legacy" }]}
      />
      <RecordsView type="proposals" />
    </>
  );
}
