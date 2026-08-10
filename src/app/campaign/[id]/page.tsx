import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/postgres";

export const dynamic = "force-dynamic";

export default async function CampaignDossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await pool.query("SELECT * FROM campaigns WHERE id=$1", [id]);
  const campaign = result.rows[0];
  if (!campaign) notFound();
  const analysis = campaign.analysis || {};
  const audit = analysis.audit || {};
  const landing = campaign.landing_page || {};
  const emails = campaign.email_sequence || [];
  const video = campaign.video_script || {};
  const ads = campaign.ads_strategy || {};
  const projections = campaign.projections || {};

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-xs font-bold uppercase">Persisted live dossier</p>
            <h1 className="text-3xl font-black">{campaign.business_name}</h1>
            <p className="text-slate-400 text-sm">Campaign {campaign.id} · {campaign.status}</p>
          </div>
          <Link href="/" className="bg-slate-800 px-4 py-2 rounded-xl h-fit">Back to EcoScale Partner</Link>
        </div>

        <section className="grid md:grid-cols-4 gap-4">
          <Kpi label="Technical SEO" value={`${analysis.seoScore ?? 0}/100`} />
          <Kpi label="Web response" value={audit.responseTimeMs ? `${audit.responseTimeMs} ms` : "Not measured"} />
          <Kpi label="Platform" value={audit.platform || "Not detected"} />
          <Kpi label="Estimated ROI" value={projections.expectedROI == null ? "Missing data" : `${projections.expectedROI}%`} />
        </section>

        <Section title="Observed site audit">
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <Fact label="Audited URL" value={audit.url} />
            <Fact label="Title" value={audit.title} />
            <Fact label="Meta description" value={audit.description} />
            <Fact label="H1" value={audit.h1?.join(" | ")} />
            <Fact label="Images" value={audit.imageCount} />
            <Fact label="Images without ALT" value={audit.imagesWithoutAlt} />
            <Fact label="Sitemap" value={audit.hasSitemap ? "Yes" : "No"} />
            <Fact label="Structured data" value={audit.hasStructuredData ? "Yes" : "No"} />
          </div>
          <List title="Detected issues" items={audit.issues} />
          <List title="Opportunities" items={analysis.opportunities} />
          <List title="Proposed keywords" items={analysis.keywords} />
        </Section>

        <Section title="Generated landing page">
          <h3 className="text-2xl font-black">{landing.headline}</h3>
          <p className="text-slate-300">{landing.subheadline}</p>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Fact label="Problem" value={landing.painPoint} />
            <Fact label="Solution" value={landing.solution} />
            <Fact label="Proof" value={landing.proof} />
            <Fact label="CTA" value={landing.cta} />
          </div>
        </Section>

        <Section title={`Outreach sequence (${emails.length})`}>
          <div className="space-y-3">
            {emails.map((email: { number?: number; subject?: string; body?: string; delay?: number }, index: number) => (
              <details key={index} className="bg-slate-950 border border-slate-700 rounded-xl p-4">
                <summary className="cursor-pointer font-bold">Email {email.number || index + 1}: {email.subject}</summary>
                <p className="whitespace-pre-wrap text-sm text-slate-300 mt-3">{email.body}</p>
                <p className="text-xs text-slate-500 mt-2">Wait: {email.delay || 0} days</p>
              </details>
            ))}
          </div>
        </Section>

        <Section title="Video script">
          <h3 className="font-bold">{video.title}</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-300 mt-2">{video.script}</p>
          <p className="text-xs text-purple-300 mt-2">Duration: {video.duration}</p>
        </Section>

        <Section title="Ad strategy">
          <List title="Google keywords" items={ads.google?.keywords} />
          <List title="Google copy" items={ads.google?.copy} />
          <List title="Meta copy" items={ads.facebook?.copy} />
          <List title="Audience" items={ads.facebook?.audience} />
          <p className="text-amber-300 text-xs mt-4">Strategy generated. Not published until OAuth, account, budget, and approval are configured.</p>
        </Section>

        <Section title="Projection based on entered data">
          <div className="grid md:grid-cols-3 gap-3">
            <Fact label="Current revenue" value={money(projections.monthlyRevenue)} />
            <Fact label="Projected revenue" value={money(projections.projectedRevenue)} />
            <Fact label="Estimated increase" value={money(projections.incrementalRevenue)} />
            <Fact label="Average order value" value={money(projections.averageOrderValue)} />
            <Fact label="Ad spend" value={money(projections.monthlyAdSpend)} />
            <Fact label="Conversion used" value={`${projections.conversionRate || 0}%`} />
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7"><h2 className="text-xl font-black mb-4">{title}</h2>{children}</section>;
}
function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><p className="text-xs text-slate-400">{label}</p><p className="text-xl font-black mt-1">{value}</p></div>;
}
function Fact({ label, value }: { label: string; value: unknown }) {
  return <div className="bg-slate-950/70 rounded-lg p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-sm mt-1 break-words">{value == null || value === "" ? "Not available" : String(value)}</p></div>;
}
function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <div className="mt-4"><p className="text-xs font-bold text-slate-400">{title}</p><ul className="list-disc ml-5 mt-2 text-sm text-slate-300 space-y-1">{items.map((item, i) => <li key={i}>{item}</li>)}</ul></div>;
}
function money(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(number) : "No data";
}
