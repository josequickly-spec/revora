"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Swords, Trophy } from "lucide-react";
import type { FunnelSpyAnalysis } from "@/lib/funnelspy";

export default function FunnelSpyComparePage() {
  const [domains, setDomains] = useState("stripe.com\npaypal.com");
  const [analyses, setAnalyses] = useState<FunnelSpyAnalysis[]>([]);
  const [winner, setWinner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function compare() {
    const urls = domains.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    if (urls.length < 2) return setError("Agrega al menos dos dominios.");
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/funnelspy/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo comparar.");
      setAnalyses(data.analyses); setWinner(data.winner);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo comparar."); }
    finally { setLoading(false); }
  }
  return (
    <main className="min-h-screen bg-[#07090f] px-5 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/funnelspy" className="flex items-center gap-2 text-sm text-violet-300"><ArrowLeft className="size-4" />FunnelSpy</Link>
        <section className="mt-8 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-cyan-400/[.04] p-7">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-violet-300"><Swords className="size-4" />Battlecard</div><h1 className="mt-3 text-4xl font-black">Compara competidores</h1><p className="mt-3 max-w-2xl text-slate-400">Introduce entre dos y cinco dominios, uno por línea. El análisis compara estructura, captación, tracking y rendimiento.</p>
          <textarea value={domains} onChange={(event) => setDomains(event.target.value)} className="mt-6 min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 p-4 font-mono text-sm outline-none focus:border-violet-400/40" />
          <button onClick={compare} disabled={loading} className="mt-4 flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-950 disabled:opacity-50">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Swords className="size-4" />}{loading ? "Comparando sitios..." : "Crear comparación"}</button>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </section>
        {analyses.length > 0 && <section className="mt-8 overflow-x-auto rounded-3xl border border-white/[.08]">
          <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `180px repeat(${analyses.length}, minmax(180px, 1fr))` }}>
            <div className="border-b border-white/[.08] bg-white/[.03] p-5 text-xs uppercase text-slate-500">Dimensión</div>
            {analyses.map((item) => <div key={item.domain} className="border-b border-l border-white/[.08] bg-white/[.03] p-5"><strong>{item.domain}</strong>{item.domain === winner && <Trophy className="ml-2 inline size-4 text-amber-300" />}</div>)}
            {[
              ["Funnel score", (item: FunnelSpyAnalysis) => item.score],
              ["Páginas", (item: FunnelSpyAnalysis) => item.totals.pages],
              ["CTAs", (item: FunnelSpyAnalysis) => item.totals.ctas],
              ["Formularios", (item: FunnelSpyAnalysis) => item.totals.forms],
              ["Píxeles", (item: FunnelSpyAnalysis) => item.totals.pixels],
              ["Performance", (item: FunnelSpyAnalysis) => item.performance.performance ?? "—"],
            ].map(([label, getter]) => <div key={label as string} className="contents"><div className="border-b border-white/[.06] p-5 text-sm text-slate-500">{label as string}</div>{analyses.map((item) => <div key={`${label}-${item.domain}`} className="border-b border-l border-white/[.06] p-5 text-2xl font-black">{(getter as (item: FunnelSpyAnalysis) => string | number)(item)}</div>)}</div>)}
          </div>
        </section>}
      </div>
    </main>
  );
}
