import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import OpportunitiesView from "@/components/opportunities/OpportunitiesView";

export const metadata: Metadata = { title: "Business opportunities", description: "Evidence-based opportunities for a persisted business audit." };

export default async function BusinessOpportunitiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  return <>
    <PageHeader eyebrow="Opportunity Engine" title={`Business #${id} opportunities`} description="Derived from associated, persisted FunnelSpy evidence. No crawl or AI runs on this page." actions={[
      { label: "Business profile", href: `/businesses/${id}`, tone: "secondary" },
      { label: "All opportunities", href: "/opportunities" },
    ]} />
    {Number.isInteger(businessId) && businessId > 0 ? <OpportunitiesView businessId={businessId} /> : <div role="alert">Invalid business ID.</div>}
  </>;
}
