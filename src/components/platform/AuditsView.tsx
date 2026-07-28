"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Clock3, ExternalLink } from "lucide-react";

type AuditSummary = {
  id: string;
  domain: string;
  score: number;
  scoreLabel: string;
  totals: { pages: number; ctas: number; forms: number };
  createdAt: string;
  shareToken: string;
  hasReport: boolean;
};

type AuditDetail = {
  id: string;
  domain: string;
  createdAt: string;
  shareToken: string;
  report: { primaryObjective?: string; executiveSummary?: string } | null;
  analysis: {
    score: number;
    scoreLabel: string;
    totals: { pages: number; ctas: number; forms: number; pixels: number; technologies: number };
    funnelStages: Array<{ name: string; status: string; evidence: string }>;
    technologies: string[];
    pixels: string[];
  };
};

export default function AuditsView({ selectedId }: { selectedId?: string }) {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = selectedId ? `/api/funnelspy/history?id=${encodeURIComponent(selectedId)}` : "/api/funnelspy/history";
    fetch(url)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Audit data is unavailable.");
        if (selectedId) setDetail(data.audit || null);
        else setAudits(data.audits || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load audits."))
      .finally(() => setLoading(false));
  }, [selectedId]);

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-white/[.05]" aria-label="Loading audits" />;
  if (error) return <Notice>{error} No substitute audit data is shown.</Notice>;

  if (selectedId) {
    if (!detail) return <Notice>Audit {selectedId} was not found.</Notice>;
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/[.07] bg-white/[.03] p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.16em] text-violet-300">FunnelSpy audit</span>
              <h2 className="mt-2 text-3xl font-black text-white">{detail.domain}</h2>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Clock3 className="size-3" />{new Date(detail.createdAt).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] px-6 py-4 text-center">
              <strong className="block text-4xl font-black text-cyan-300">{detail.analysis.score}</strong>
              <span className="text-xs text-slate-500">{detail.analysis.scoreLabel}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-white/[.07] pt-6 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(detail.analysis.totals).map(([label, value]) => <div key={label} className="rounded-xl bg-black/20 p-3"><strong className="block text-lg text-white">{value}</strong><span className="text-xs capitalize text-slate-500">{label}</span></div>)}
          </div>
        </section>

        {detail.report && (
          <section className="rounded-3xl border border-violet-400/15 bg-violet-400/[.05] p-6">
            <h2 className="text-xl font-black text-white">{detail.report.primaryObjective || "AI consultant report"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{detail.report.executiveSummary || "The report is attached to this audit."}</p>
          </section>
        )}

        <section className="rounded-3xl border border-white/[.07] bg-white/[.025] p-6">
          <h2 className="font-black text-white">Observed funnel stages</h2>
          <ul className="mt-4 space-y-3">
            {detail.analysis.funnelStages.map((stage) => <li key={stage.name} className="rounded-xl border border-white/[.06] bg-black/15 p-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-slate-200">{stage.name}</strong><span className="text-xs uppercase text-cyan-300">{stage.status}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{stage.evidence}</p></li>)}
          </ul>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link href={`/shared/funnelspy/${detail.shareToken}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-200 outline-none hover:bg-violet-400/15 focus-visible:ring-2 focus-visible:ring-violet-300">Shared report <ExternalLink className="size-4" /></Link>
          <a href={`/api/funnelspy/export?id=${detail.id}&format=csv`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 outline-none hover:bg-white/[.06] focus-visible:ring-2 focus-visible:ring-cyan-300">Export CSV</a>
        </div>
      </div>
    );
  }

  if (!audits.length) return <Notice>No audits have been saved. Start a FunnelSpy audit to create the first evidence record.</Notice>;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[.07] bg-white/[.025]">
      <ul className="divide-y divide-white/[.06]">
        {audits.map((audit) => (
          <li key={audit.id}>
            <Link href={`/audits/${audit.id}`} className="group flex items-center gap-4 px-5 py-4 outline-none hover:bg-white/[.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-400/[.08] text-violet-300"><BarChart3 className="size-5" /></span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{audit.domain}</strong><span className="mt-1 block text-xs text-slate-500">{new Date(audit.createdAt).toLocaleString()} · {audit.totals.pages} pages</span></span>
              <span className="text-right"><strong className="block text-lg text-cyan-300">{audit.score}</strong><span className="hidden text-xs text-slate-500 sm:block">{audit.scoreLabel}</span></span>
              <ArrowRight className="size-4 shrink-0 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div role="status" className="rounded-3xl border border-white/[.08] bg-white/[.03] p-8 text-sm leading-6 text-slate-400">{children}</div>;
}
