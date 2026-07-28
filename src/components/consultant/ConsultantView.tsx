"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, FileSearch, LoaderCircle, Sparkles } from "lucide-react";
import type { AIConsultantReportRecord } from "@/lib/ai-consultant/contracts";

type AuditSummary = {
  id: string; domain: string; score: number; createdAt: string; businessId: number | null; opportunityCount: number;
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/[.08] bg-white/[.03] p-5 ${className}`}>{children}</section>;
}

function Status({ status }: { status: string }) {
  const tone = status === "completed" ? "text-emerald-300 bg-emerald-400/10" : status === "failed" ? "text-rose-300 bg-rose-400/10" : "text-amber-300 bg-amber-400/10";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{status}</span>;
}

export function ConsultantListView() {
  const [reports, setReports] = useState<AIConsultantReportRecord[]>([]);
  const [status, setStatus] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (businessId) query.set("businessId", businessId);
    fetch(`/api/ai-consultant?${query}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setReports(data.reports);
      })
      .catch(cause => { if (cause.name !== "AbortError") setError(cause.message || "Unable to load reports."); });
    return () => controller.abort();
  }, [status, businessId]);

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Business ID<input value={businessId} onChange={event => setBusinessId(event.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none focus:border-cyan-300" placeholder="All businesses" /></label>
          <label className="text-sm text-slate-300">Status<select value={status} onChange={event => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] px-3 py-2 outline-none focus:border-cyan-300"><option value="">All statuses</option><option>completed</option><option>failed</option><option>generating</option><option>pending</option></select></label>
        </div>
      </Card>
      {error && <Card className="border-rose-400/20 text-rose-200">{error}</Card>}
      {!error && reports.length === 0 && <Card><p className="text-slate-400">No AI Consultant reports match these filters. Reports are generated only after an explicit action from a business or audit.</p></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map(report => (
          <Link key={report.id} href={`/consultant/${report.id}`} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5 outline-none transition hover:border-cyan-300/30 focus-visible:ring-2 focus-visible:ring-cyan-300">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wider text-violet-300">Business #{report.businessId}</span><Status status={report.status} /></div>
            <h2 className="mt-4 text-lg font-black text-white">{report.objective.replaceAll("_", " ")}</h2>
            <p className="mt-2 text-sm text-slate-500">Audit {report.auditId.slice(0, 8)} · {new Date(report.createdAt).toLocaleString()}</p>
            <p className="mt-2 text-xs text-slate-500">{report.provider || "Provider pending"} · {report.model || "Model pending"} · {report.promptVersion}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BusinessConsultantView({ businessId, initialAuditId }: { businessId: number; initialAuditId?: string }) {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [reports, setReports] = useState<AIConsultantReportRecord[]>([]);
  const [auditId, setAuditId] = useState(initialAuditId || "");
  const [objective, setObjective] = useState("general_growth_strategy");
  const [reportStyle, setReportStyle] = useState("standard");
  const [locale, setLocale] = useState("en");
  const [instructions, setInstructions] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Array<{ id: string; title: string; priority: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(() => fetch(`/api/businesses/${businessId}/consultant-reports`).then(response => response.json()).then(data => setReports(data.reports || [])), [businessId]);
  useEffect(() => {
    Promise.all([
      fetch(`/api/funnelspy/history?businessId=${businessId}`).then(response => response.json()),
      loadReports(),
    ]).then(([auditData]) => {
      const associated = (auditData.audits || []) as AuditSummary[];
      setAudits(associated);
      setAuditId(current => current || associated[0]?.id || "");
    }).catch(() => setError("Business consultant data is temporarily unavailable."));
  }, [businessId, loadReports]);
  useEffect(() => {
    if (!auditId) return;
    fetch(`/api/opportunities?auditId=${auditId}&businessId=${businessId}`)
      .then(response => response.json()).then(data => {
        setOpportunities(data.opportunities || []);
        setSelected((data.opportunities || []).map((item: { id: string }) => item.id));
      }).catch(() => setError("Unable to load deterministic opportunities."));
  }, [auditId, businessId]);

  async function generate(regenerate = false) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/ai-consultant/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, auditId, objective, locale, reportStyle, selectedOpportunityIds: selected, userInstructions: instructions || undefined, regenerate }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      await loadReports();
      window.location.assign(`/consultant/${data.report.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Generation failed.");
      await loadReports();
    } finally { setLoading(false); }
  }

  const selectedAudit = useMemo(() => audits.find(item => item.id === auditId), [audits, auditId]);
  return (
    <div className="space-y-5">
      <Card className="border-violet-400/20 bg-violet-400/[.05]">
        <div className="flex gap-3"><Bot className="mt-1 size-5 shrink-0 text-violet-300" /><div><h2 className="font-black text-white">AI-generated advisory content</h2><p className="mt-1 text-sm leading-6 text-slate-400">This strategy is generated, advisory, evidence-grounded and subject to review. FunnelSpy evidence and deterministic opportunities remain separate sources of truth.</p></div></div>
      </Card>
      {audits.length === 0 ? (
        <Card><FileSearch className="size-6 text-slate-500" /><h2 className="mt-3 font-black">A persisted audit is required</h2><p className="mt-2 text-sm text-slate-400">AI Consultant never runs FunnelSpy automatically.</p><Link href={`/funnelspy?businessId=${businessId}`} className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">Run Funnel Audit</Link></Card>
      ) : (
        <>
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">Persisted audit<select value={auditId} onChange={event => setAuditId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] px-3 py-2"><option value="">Select audit</option>{audits.map(audit => <option key={audit.id} value={audit.id}>{new Date(audit.createdAt).toLocaleDateString()} · score {audit.score}</option>)}</select></label>
              <label className="text-sm text-slate-300">Objective<select value={objective} onChange={event => setObjective(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] px-3 py-2">{["general_growth_strategy","improve_lead_generation","improve_conversion","improve_local_visibility","improve_tracking","improve_mobile_experience","improve_trust","prepare_sales_proposal"].map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
              <label className="text-sm text-slate-300">Report style<select value={reportStyle} onChange={event => setReportStyle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] px-3 py-2"><option>concise</option><option>standard</option><option>detailed</option></select></label>
              <label className="text-sm text-slate-300">Language<select value={locale} onChange={event => setLocale(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] px-3 py-2"><option value="en">English</option><option value="es">Español</option></select></label>
            </div>
            <label className="mt-4 block text-sm text-slate-300">Optional instructions<textarea value={instructions} onChange={event => setInstructions(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" placeholder="Additional emphasis; cannot override evidence and safety rules." /></label>
          </Card>
          <Card>
            <div className="flex items-center justify-between gap-4"><div><h2 className="font-black text-white">Deterministic opportunities</h2><p className="mt-1 text-sm text-slate-500">Rule-derived from audit {selectedAudit?.id.slice(0, 8)}. These are not AI recommendations.</p></div><span className="text-xs text-slate-500">{selected.length}/{opportunities.length} selected</span></div>
            <div className="mt-4 space-y-2">{opportunities.map(item => <label key={item.id} className="flex items-start gap-3 rounded-xl border border-white/[.06] p-3 text-sm"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])} className="mt-1" /><span><strong className="text-white">{item.title}</strong><span className="ml-2 text-xs uppercase text-amber-300">{item.priority}</span></span></label>)}</div>
          </Card>
          {error && <Card className="border-rose-400/20"><div className="flex gap-2 text-rose-200"><AlertTriangle className="size-5 shrink-0" />{error}</div></Card>}
          <button onClick={() => generate(false)} disabled={loading || !auditId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">{loading ? <LoaderCircle className="size-5 animate-spin" /> : <Sparkles className="size-5" />}{loading ? "Generating validated strategy…" : "Generate AI Strategy"}</button>
        </>
      )}
      {reports.length > 0 && <Card><h2 className="font-black text-white">Report history</h2><div className="mt-3 space-y-2">{reports.map(report => <Link key={report.id} href={`/consultant/${report.id}`} className="flex items-center justify-between rounded-xl border border-white/[.06] p-3 text-sm hover:border-cyan-300/30"><span>{report.objective.replaceAll("_", " ")} · {new Date(report.createdAt).toLocaleString()}</span><Status status={report.status} /></Link>)}</div></Card>}
    </div>
  );
}

export function ConsultantDetailView({ reportId }: { reportId: string }) {
  const [record, setRecord] = useState<AIConsultantReportRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/ai-consultant/${reportId}`).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setRecord(data.report);
    }).catch(cause => setError(cause.message || "Unable to load report."));
  }, [reportId]);
  if (error) return <Card className="border-rose-400/20 text-rose-200">{error}</Card>;
  if (!record) return <Card><LoaderCircle className="size-5 animate-spin text-cyan-300" /></Card>;
  if (record.status !== "completed" || !record.report) return <Card><Status status={record.status} /><p className="mt-4 text-slate-300">{record.errorMessage || "The report is still being generated."}</p><Link href={`/businesses/${record.businessId}/consultant?auditId=${record.auditId}`} className="mt-4 inline-flex text-cyan-300">Return to generation settings</Link></Card>;
  const report = record.report;
  const groups = [
    ["Top priorities", report.topPriorities], ["Funnel strategy", report.funnelStrategy],
    ["Offer strategy", report.offerStrategy], ["Lead capture", report.leadCaptureStrategy],
    ["Tracking strategy", report.trackingStrategy], ["Trust strategy", report.trustStrategy],
    ["Quick wins", report.quickWins], ["Longer-term actions", report.longerTermActions],
  ] as const;
  return (
    <div className="space-y-5">
      <Card className="border-violet-400/20"><div className="flex items-center gap-2 text-violet-200"><Bot className="size-5" /><strong>AI-generated · advisory · evidence-grounded · review required</strong></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>{record.provider}</span><span>· {record.model}</span><span>· {record.promptVersion}</span><span>· {new Date(record.completedAt || record.createdAt).toLocaleString()}</span></div></Card>
      <Card><h2 className="text-lg font-black text-white">Executive summary</h2><p className="mt-3 leading-7 text-slate-300">{report.executiveSummary}</p><h3 className="mt-6 font-black text-white">Current situation</h3><p className="mt-2 leading-7 text-slate-400">{report.currentSituation}</p></Card>
      {groups.filter(([, items]) => items.length).map(([title, items]) => <Card key={title}><h2 className="text-lg font-black text-white">{title}</h2><div className="mt-4 grid gap-3">{items.map((item, index) => <article key={`${title}-${index}`} className="rounded-xl border border-white/[.06] bg-black/10 p-4"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{item.title}</h3><span className="text-xs uppercase text-cyan-300">{item.priority}</span><span className="text-xs uppercase text-slate-500">effort {item.effort}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{item.rationale}</p><p className="mt-3 text-sm text-slate-200"><strong>Action:</strong> {item.recommendedAction}</p><div className="mt-3 flex flex-wrap gap-2">{item.evidenceReferenceIds.map(id => <code key={id} className="rounded bg-violet-400/10 px-2 py-1 text-[11px] text-violet-200">{id}</code>)}</div></article>)}</div></Card>)}
      <Card><h2 className="text-lg font-black text-white">Implementation roadmap</h2><ol className="mt-4 space-y-3">{report.implementationRoadmap.map((step, index) => <li key={`${step.phase}-${index}`} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan-300 font-black text-slate-950">{index + 1}</span><div><strong className="text-white">{step.phase}</strong><p className="mt-1 text-sm text-slate-400">{step.action}</p></div></li>)}</ol></Card>
      <div className="grid gap-5 lg:grid-cols-3">{[["Risks", report.risks], ["Assumptions", report.assumptions], ["Limitations", report.limitations]].map(([title, items]) => <Card key={title as string}><h2 className="font-black text-white">{title as string}</h2><ul className="mt-3 space-y-2 text-sm text-slate-400">{(items as string[]).map(item => <li key={item}>• {item}</li>)}</ul></Card>)}</div>
      <Card><h2 className="flex items-center gap-2 text-lg font-black text-white"><CheckCircle2 className="size-5 text-emerald-300" />Evidence used</h2><div className="mt-4 space-y-3">{report.evidenceReferences.map(reference => <article id={reference.id} key={reference.id} className="rounded-xl border border-white/[.06] p-3"><code className="text-xs text-violet-200">{reference.id}</code><h3 className="mt-2 font-bold text-white">{reference.label}</h3><p className="mt-1 text-sm text-slate-400">{reference.fact}</p><p className="mt-2 text-xs text-slate-600">{reference.sourceType} · {reference.sourceVersion}</p></article>)}</div></Card>
      <Card><div className="flex flex-wrap gap-3"><Link href={`/businesses/${record.businessId}/consultant?auditId=${record.auditId}`} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">Regenerate with review</Link><Link href={`/proposals/new?businessId=${record.businessId}&auditId=${record.auditId}&consultantReportId=${record.id}`} className="rounded-xl border border-violet-300/20 px-4 py-2 text-sm font-bold text-violet-200">Create Proposal Draft</Link></div></Card>
    </div>
  );
}
