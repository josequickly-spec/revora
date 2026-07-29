import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import { ConsultantListView } from "@/components/consultant/ConsultantView";

export const metadata: Metadata = { title: "AI Consultant", description: "Evidence-grounded strategic reports." };

export default async function ConsultantPage({ searchParams }: { searchParams: Promise<{ businessId?: string }> }) {
  const query = await searchParams;
  const businessId = query.businessId?.replace(/\D/g, "") || "";
  return <><PageHeader eyebrow="AI Consultant" title="Strategic reports" description="AI-generated advisory strategy grounded in persisted audits and deterministic opportunities." actions={[{ label: "Choose business", href: "/businesses", tone: "secondary" }]} /><ConsultantListView initialBusinessId={businessId} /></>;
}
