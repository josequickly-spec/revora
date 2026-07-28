import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import { ConsultantListView } from "@/components/consultant/ConsultantView";

export const metadata: Metadata = { title: "AI Consultant", description: "Evidence-grounded strategic reports." };

export default function ConsultantPage() {
  return <><PageHeader eyebrow="AI Consultant" title="Strategic reports" description="AI-generated advisory strategy grounded in persisted audits and deterministic opportunities." /><ConsultantListView /></>;
}
