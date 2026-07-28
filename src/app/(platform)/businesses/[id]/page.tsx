import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import BusinessesView from "@/components/platform/BusinessesView";

export const metadata: Metadata = {
  title: "Business profile",
  description: "Business intelligence, contacts and generated funnel assets.",
};

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  return (
    <>
      <PageHeader
        eyebrow="Business Intelligence"
        title={Number.isFinite(numericId) ? `Business #${numericId}` : "Business profile"}
        description="A consolidated view over the existing business, contact and funnel records."
        actions={[
          { label: "All businesses", href: "/businesses", tone: "secondary" },
          { label: "Generate AI Strategy", href: `/businesses/${numericId}/consultant` },
        ]}
      />
      <BusinessesView selectedId={numericId} />
    </>
  );
}
