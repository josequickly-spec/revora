import type { Metadata } from "next";
import PageHeader from "@/components/app-shell/PageHeader";
import RecordsView from "@/components/platform/RecordsView";

export const metadata: Metadata = {
  title: "Outreach",
  description: "Persisted outreach drafts and delivery state.",
};

export default function OutreachPage() {
  return (
    <>
      <PageHeader
        eyebrow="Outreach"
        title="Outreach"
        description="Review real outreach records. Draft generation and sending remain in the current workspace until their later consolidation."
        actions={[{ label: "Open current outreach", href: "/legacy" }]}
      />
      <RecordsView type="outreach" />
    </>
  );
}
