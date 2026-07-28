"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Clock3, ExternalLink } from "lucide-react";
import type { Opportunity } from "@/lib/opportunity-engine/contracts";

type AuditSummary = {
  id: string; domain: string; score: number; scoreLabel: string;
  totals: { pages: number; ctas: number; forms: number }; createdAt: string;
  shareToken: string; hasReport: boolean; businessId: number | null;
  businessName: string | null; storageMode: "postgres" | "memory";
  status: string; opportunityCount: number;
};
type AuditDetail = {
  id: string; domain: string; createdAt: string; shareToken: string;
  report: { primaryObjective?: string; executiveSummary?: string } | null;
  businessId: number | null; businessName: string | null; storageMode: "postgres" | "memory";
  analysis: {
    origin: string; score: number; scoreLabel: string;
    totals: { pages: number; ctas: number; forms: number; pixels: number; technologies: number };
    funnelStages: Array<{ name: string; status: string; evidence: string }>;
    technologies: string[]; pixels: string[];
    pages: Array<{ url: string; title: string; kind: string; ctas: string[]; forms: number; evidence: Array<{ type: string; value: string }> }>;
    performance: { status: string; performance: number | null; accessibility: number | null; seo: number | null; bestPractices: number | null; lcp: string | null };
    domainIntel: { status: string; registrar: string | null; createdAt: string | null; ageYears: number | null; nameservers: string[] };
    discovery: { robotsAllowed: boolean | null; sitemapUrls: number; renderedWithBrowser: boolean };
    warnings: string[];
  };
};
type OpportunityResult = { opportunities: Opportunity[]; warnings: string[]; rulesVersion: string };
type ConsultantReport = { id: string; status: string; objective: string; createdAt: string };
type ProposalSummary = { id: string; title: string; status: string };

export default function AuditsView({ selectedId }: { selectedId?: string }) {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [opportunityResult, setOpportunityResult] = useState<OpportunityResult | null>(null);
  const [consultantReports, setConsultantReports] = useState<ConsultantReport[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(selectedId ? `/api/funnelspy/history?id=${encodeURIComponent(selectedId)}` : "/api/funnelspy/history")
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Audit data is unavailable.");
        if (selectedId) { setDetail(data.audit || null); setOpportunityResult(data.opportunityResult || null); }
        else { setAudits(data.audits || []); setWarnings(data.warnings || []); }
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load audits."))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    Promise.all([
      fetch(`/api/ai-consultant?auditId=${encodeURIComponent(selectedId)}`).then(response => response.ok ? response.json() : { reports: [] }),
      fetch(`/api/proposals?auditId=${encodeURIComponent(selectedId)}`).then(response => response.ok ? response.json() : { proposals: [] }),
    ]).then(([consultantData, proposalData]) => {
      setConsultantReports(consultantData.reports || []);
      setProposals(proposalData.proposals || []);
    }).catch(() => { setConsultantReports([]); setProposals([]); });
  }, [selectedId]);

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-white/[.05]" aria-label="Loading audits" />;
  if (error) return <Notice>{error} No substitute audit data is shown.</Notice>;
  if (selectedId) {
    if (!detail) return <Notice>Audit {selectedId} was not found.</Notice>;
    return <div className="space-y-6">
      <section className="rounded-3xl border border-white/[.07] bg-white/[.03] p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div><span className="text-xs font-bold uppercase tracking-[.16em] text-violet-300">FunnelSpy audit</span><h2 className="mt-2 text-3xl font-black text-white">{detail.domain}</h2><p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Clock3 className="size-3" />{new Date(detail.createdAt).toLocaleString()}</p><p className="mt-2 text-xs text-slate-500">{detail.businessName ? `Business: ${detail.businessName}` : "Unassociated historical audit"} · storage: {detail.storageMode}</p></div><div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] px-6 py-4 text-center"><strong className="block text-4xl font-black text-cyan-300">{detail.analysis.score}</strong><span className="text-xs text-slate-500">{detail.analysis.scoreLabel}</span></div></div>
        <div className="mt-6 grid gap-3 border-t border-white/[.07] pt-6 sm:grid-cols-3 lg:grid-cols-5">{Object.entries(detail.analysis.totals).map(([label, value]) => <Fact key={label} label={label} value={value} />)}</div>
      </section>
      {detail.storageMode === "memory" && <Notice>This audit is held in non-durable memory storage and can disappear after a restart.</Notice>}
      <Section title="Observed funnel stages"><ul className="space-y-3">{detail.analysis.funnelStages.map(stage => <li key={stage.name} className="rounded-xl border border-white/[.06] bg-black/15 p-4"><div className="flex justify-between gap-3"><strong className="text-sm text-slate-200">{stage.name}</strong><span className="text-xs uppercase text-cyan-300">{stage.status}</span></div><p className="mt-2 text-xs text-slate-500">{stage.evidence}</p></li>)}</ul></Section>
      <Section title="Pages, CTAs, forms and evidence"><ul className="space-y-3">{detail.analysis.pages.map(page => <li key={page.url} className="rounded-xl bg-black/20 p-4"><a href={page.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-cyan-300">{page.title}</a><p className="mt-1 text-xs text-slate-500">{page.kind} · {page.ctas.length} CTAs · {page.forms} forms</p><p className="mt-2 text-xs text-slate-400">{page.evidence.length ? page.evidence.slice(0, 5).map(item => `${item.type}: ${item.value}`).join(" · ") : "No element evidence recorded."}</p></li>)}</ul></Section>
      <div className="grid gap-5 lg:grid-cols-2"><Section title="PageSpeed and discovery"><dl className="grid grid-cols-2 gap-3">{Object.entries(detail.analysis.performance).map(([key, value]) => <Fact key={key} label={key} value={value ?? "unavailable"} />)}</dl><p className="mt-4 text-xs text-slate-500">robots: {String(detail.analysis.discovery.robotsAllowed ?? "not_checked")} · sitemap URLs: {detail.analysis.discovery.sitemapUrls} · browser: {String(detail.analysis.discovery.renderedWithBrowser)}</p></Section><Section title="RDAP, technology and tracking"><p className="text-sm text-slate-300">Registrar: {detail.analysis.domainIntel.registrar || "unavailable"} · age: {detail.analysis.domainIntel.ageYears ?? "unavailable"}</p><p className="mt-3 text-xs text-slate-500">Technologies: {detail.analysis.technologies.join(", ") || "none detected"}</p><p className="mt-2 text-xs text-slate-500">Tracking: {detail.analysis.pixels.join(", ") || "none detected"}</p></Section></div>
      <Section title={`Derived opportunities · ${opportunityResult?.rulesVersion || ""}`}>{opportunityResult?.opportunities.length ? <ul className="space-y-3">{opportunityResult.opportunities.map(item => <li key={item.id} className="rounded-xl bg-black/20 p-4"><strong className="text-sm text-white">{item.title}</strong><span className="ml-2 text-xs uppercase text-cyan-300">{item.priority}</span><p className="mt-2 text-xs text-slate-400">{item.evidence.map(evidence => `${evidence.fact}: ${String(evidence.value)}`).join(" · ")}</p><p className="mt-2 text-xs text-slate-300">{item.recommendedAction}</p></li>)}</ul> : <p className="text-sm text-slate-500">No supported opportunity was derived.</p>}{opportunityResult?.warnings.map(warning => <p key={warning} className="mt-3 text-xs text-amber-200">{warning}</p>)}</Section>
      {!!detail.analysis.warnings.length && <Section title="Warnings and limitations"><ul className="list-disc space-y-2 pl-5 text-sm text-amber-100">{detail.analysis.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></Section>}
      {detail.report && <Section title={detail.report.primaryObjective || "Existing AI report"}><p className="text-sm text-slate-400">{detail.report.executiveSummary}</p></Section>}
      <Section title="AI Consultant reports"><p className="text-sm text-slate-500">AI-generated strategy is advisory and remains separate from deterministic opportunities.</p>{consultantReports.length ? <ul className="mt-3 space-y-2">{consultantReports.map(item => <li key={item.id}><Link href={`/consultant/${item.id}`} className="flex justify-between rounded-xl bg-violet-400/[.06] p-3 text-sm text-violet-100"><span>{item.objective.replaceAll("_", " ")} · {new Date(item.createdAt).toLocaleString()}</span><span>{item.status}</span></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No consultant report exists for this audit.</p>}</Section>
      <Section title="Proposals">{proposals.length ? <ul className="space-y-2">{proposals.map(proposal => <li key={proposal.id}><Link href={`/proposals/${proposal.id}`} className="flex items-center justify-between rounded-xl bg-black/20 p-3 text-sm"><span>{proposal.title}</span><span className="text-violet-200">{proposal.status}</span></Link></li>)}</ul> : <p className="text-sm text-slate-500">No proposal is associated with this audit. Viewing an audit never creates one.</p>}</Section>
      <div className="flex flex-wrap gap-2"><Link href={`/shared/funnelspy/${detail.shareToken}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-200">Shared report <ExternalLink className="size-4" /></Link><a href={`/api/funnelspy/export?id=${detail.id}&format=csv`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300">Export CSV</a><button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-violet-300/20 px-4 py-2.5 text-sm font-bold text-violet-200">Regenerate opportunities</button><Link href={`/funnelspy?url=${encodeURIComponent(detail.domain)}${detail.businessId ? `&businessId=${detail.businessId}` : ""}`} className="rounded-xl border border-cyan-300/20 px-4 py-2.5 text-sm font-bold text-cyan-200">Run fresh audit</Link>{detail.businessId ? <><Link href={`/businesses/${detail.businessId}/consultant?auditId=${detail.id}`} className="rounded-xl bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-200">Generate AI Strategy</Link><Link href={`/proposals/new?businessId=${detail.businessId}&auditId=${detail.id}`} className="rounded-xl border border-cyan-300/20 px-4 py-2.5 text-sm font-bold text-cyan-200">Create Proposal Draft</Link></> : <span className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-600">Associate this audit with a business to continue</span>}</div>
    </div>;
  }
  if (!audits.length) return <Notice>No audits have been saved. Start a FunnelSpy audit explicitly to create the first evidence record.</Notice>;
  return <div className="space-y-4">{warnings.map(warning => <Notice key={warning}>{warning}</Notice>)}<section className="overflow-hidden rounded-3xl border border-white/[.07] bg-white/[.025]"><ul className="divide-y divide-white/[.06]">{audits.map(audit => <li key={audit.id}><Link href={`/audits/${audit.id}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[.04]"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-400/[.08] text-violet-300"><BarChart3 className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{audit.domain}</strong><span className="mt-1 block text-xs text-slate-500">{new Date(audit.createdAt).toLocaleString()} · {audit.totals.pages} pages · {audit.businessName || "unassociated"} · {audit.opportunityCount} opportunities</span>{audit.storageMode === "memory" && <span className="text-xs text-amber-300">Non-durable storage</span>}</span><span className="text-right"><strong className="block text-lg text-cyan-300">{audit.score}</strong><span className="text-xs text-slate-500">{audit.status}</span></span><ArrowRight className="size-4 text-slate-700" /></Link></li>)}</ul></section></div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl border border-white/[.07] bg-white/[.025] p-6"><h2 className="mb-4 font-black text-white">{title}</h2>{children}</section>; }
function Fact({ label, value }: { label: string; value: unknown }) { return <div className="rounded-xl bg-black/20 p-3"><strong className="block text-lg text-white">{String(value)}</strong><span className="text-xs capitalize text-slate-500">{label}</span></div>; }
function Notice({ children }: { children: React.ReactNode }) { return <div role="status" className="rounded-3xl border border-white/[.08] bg-white/[.03] p-8 text-sm leading-6 text-slate-400">{children}</div>; }
