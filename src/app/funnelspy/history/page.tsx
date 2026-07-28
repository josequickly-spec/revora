"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, ExternalLink, LoaderCircle } from "lucide-react";

type HistoryItem = {
  id: string; domain: string; score: number; scoreLabel: string;
  totals: { pages: number; ctas: number; forms: number };
  createdAt: string; shareToken: string; hasReport: boolean;
};

export default function FunnelSpyHistoryPage() {
  const [audits, setAudits] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/funnelspy/history").then((response) => response.json()).then((data) => setAudits(data.audits || [])).finally(() => setLoading(false));
  }, []);
  return (
    <main className="min-h-screen bg-[#07090f] px-5 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/funnelspy" className="flex items-center gap-2 text-sm text-violet-300"><ArrowLeft className="size-4" />FunnelSpy</Link>
        <div className="mt-8"><span className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Workspace</span><h1 className="mt-3 text-4xl font-black">Historial de auditorías</h1><p className="mt-3 text-slate-500">Revisa resultados, comparte informes y observa cambios de score por dominio.</p></div>
        {loading ? <div className="grid min-h-60 place-items-center"><LoaderCircle className="animate-spin text-violet-300" /></div> :
          <section className="mt-8 grid gap-4 md:grid-cols-2">{audits.map((audit) => <article key={audit.id} className="rounded-3xl border border-white/[.08] bg-white/[.03] p-6"><div className="flex justify-between"><div><h2 className="text-xl font-black">{audit.domain}</h2><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="size-3" />{new Date(audit.createdAt).toLocaleString("es")}</p></div><strong className="text-3xl text-lime-300">{audit.score}</strong></div><p className="mt-4 text-sm text-slate-400">{audit.scoreLabel}</p><div className="mt-5 flex gap-4 border-t border-white/[.06] pt-4 text-xs text-slate-500"><span>{audit.totals.pages} páginas</span><span>{audit.totals.ctas} CTAs</span><span>{audit.totals.forms} forms</span></div><div className="mt-5 flex gap-2"><a href={`/shared/funnelspy/${audit.shareToken}`} target="_blank" className="flex items-center gap-1 rounded-xl bg-violet-500/10 px-3 py-2 text-xs text-violet-200">Abrir informe <ExternalLink className="size-3" /></a><a href={`/api/funnelspy/export?id=${audit.id}&format=csv`} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400">CSV</a></div></article>)}</section>}
        {!loading && !audits.length && <div className="mt-10 rounded-3xl border border-dashed border-white/10 p-12 text-center text-slate-500">Todavía no hay auditorías guardadas.</div>}
      </div>
    </main>
  );
}
