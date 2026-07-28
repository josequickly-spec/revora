"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Opportunity } from "@/lib/opportunity-engine/contracts";

type AuditSummary = { id: string; businessId: number | null; domain: string; score: number; createdAt: string; storageMode: string };

export default function OpportunitiesView({ businessId }: { businessId?: number }) {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [effort, setEffort] = useState("");
  const [auditId, setAuditId] = useState("");

  useEffect(() => {
    fetch(`/api/opportunities${businessId ? `?businessId=${businessId}` : ""}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Opportunities are unavailable.");
        setItems(data.opportunities || []);
        setAudits((data.results || []).map((result: { audit: AuditSummary }) => result.audit));
        setWarnings(data.warnings || []);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Opportunities are unavailable."))
      .finally(() => setLoading(false));
  }, [businessId]);

  const filtered = useMemo(() => items.filter(item =>
    (!category || item.category === category) &&
    (!priority || item.priority === priority) &&
    (!effort || item.effort === effort) &&
    (!auditId || item.auditId === auditId)
  ), [items, category, priority, effort, auditId]);

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-white/[.05]" aria-label="Loading opportunities" />;
  if (error) return <Notice>{error} No inferred substitute results are shown.</Notice>;
  if (!audits.length) return <Notice>No associated persisted audits are available. Run a FunnelSpy audit explicitly before deriving opportunities.</Notice>;

  return <div className="space-y-5">
    {warnings.map(warning => <div key={warning} className="rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-sm text-amber-100">{warning}</div>)}
    <div className="grid gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-4 sm:grid-cols-4">
      <Filter label="Category" value={category} set={setCategory} options={[...new Set(items.map(item => item.category))]} />
      <Filter label="Priority" value={priority} set={setPriority} options={["critical", "high", "medium", "low"]} />
      <Filter label="Effort" value={effort} set={setEffort} options={["low", "medium", "high", "unknown"]} />
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit
        <select value={auditId} onChange={event => setAuditId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm normal-case text-white">
          <option value="">All audits</option>{audits.map(audit => <option key={audit.id} value={audit.id}>{audit.domain} · {new Date(audit.createdAt).toLocaleDateString()}</option>)}
        </select>
      </label>
    </div>
    {!filtered.length ? <Notice>No opportunities match these filters.</Notice> : <ul className="grid gap-4 lg:grid-cols-2">
      {filtered.map(item => <li key={item.id} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="rounded-full bg-cyan-300/10 px-2 py-1 text-cyan-200">{item.priority}</span><span className="text-slate-600">{item.category} · effort {item.effort}</span></div>
        <h2 className="mt-3 font-black text-white">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
        <div className="mt-4 rounded-xl bg-black/20 p-3 text-xs text-slate-400"><strong className="text-slate-300">Evidence:</strong> {item.evidence.map(evidence => `${evidence.fact}: ${String(evidence.value)}`).join(" · ")}</div>
        <p className="mt-3 text-xs text-slate-500">Audit date: {new Date(item.derivedAt).toLocaleString()} · Rule: {item.sourceRule}</p>
        <p className="mt-1 text-xs text-slate-500">Affected pages: {item.affectedPages.length ? item.affectedPages.join(", ") : "No page-specific evidence"}</p>
        <p className="mt-4 text-sm text-slate-300"><strong>Recommended:</strong> {item.recommendedAction}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600"><span>{item.rulesVersion} · {item.confidence} confidence</span><Link href={`/audits/${item.auditId}`} className="font-bold text-violet-300 hover:text-violet-200">Exact audit</Link></div>
      </li>)}
    </ul>}
  </div>;
}

function Filter({ label, value, set, options }: { label: string; value: string; set: (value: string) => void; options: string[] }) {
  return <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}<select value={value} onChange={event => set(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm normal-case text-white"><option value="">All</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>;
}
function Notice({ children }: { children: React.ReactNode }) { return <div role="status" className="rounded-3xl border border-white/[.08] bg-white/[.03] p-8 text-sm leading-6 text-slate-400">{children}</div>; }
