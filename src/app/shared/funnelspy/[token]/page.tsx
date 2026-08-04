import { notFound } from "next/navigation";
import { getAudit } from "@/lib/funnelspy-store";
import FunnelSpyPrintButton from "@/components/FunnelSpyPrintButton";

export default async function SharedFunnelSpyReport({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await getAudit(token);
  if (!audit) notFound();
  return (
    <main className="min-h-screen bg-[#07090f] px-5 py-14 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4"><div className="text-xs font-black uppercase tracking-[.2em] text-violet-300">FunnelSpy · Informe compartido</div><FunnelSpyPrintButton /></div>
        <h1 className="mt-4 text-5xl font-black">{audit.domain}</h1>
        <p className="mt-3 text-slate-500">{new Date(audit.createdAt).toLocaleString("es")}</p>
        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[["Score", audit.analysis.score], ["Páginas", audit.analysis.totals.pages], ["CTAs", audit.analysis.totals.ctas], ["Forms", audit.analysis.totals.forms]].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><strong className="text-3xl">{value}</strong><span className="mt-2 block text-xs uppercase text-slate-500">{label}</span></article>
          ))}
        </section>
        {audit.report && <section className="mt-6 rounded-3xl border border-violet-400/20 bg-violet-500/[.08] p-8"><h2 className="text-2xl font-black">{audit.report.primaryObjective}</h2><p className="mt-4 leading-7 text-slate-300">{audit.report.executiveSummary}</p></section>}
        <section className="mt-6 space-y-3">{audit.analysis.pages.map((page) => <article key={page.url} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-5"><strong>{page.title}</strong><p className="mt-2 text-sm text-slate-500">{page.url}</p></article>)}</section>
      </div>
    </main>
  );
}
