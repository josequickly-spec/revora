"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Archive, CheckCircle2, Copy, FileText, LoaderCircle, Plus, Save, Send } from "lucide-react";
import type { ProposalContent, ProposalPricingInput, ProposalRecord, ProposalTerms } from "@/lib/proposal-builder/contracts";
import { formatMoney } from "@/lib/proposal-builder/pricing";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/[.08] bg-white/[.03] p-5 ${className}`}>{children}</section>;
}

function Status({ value }: { value: string }) {
  return <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold uppercase text-cyan-200">{value}</span>;
}

export function ProposalListView() {
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [legacy, setLegacy] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/proposals").then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setProposals(data.proposals || []); setLegacy(data.legacyProposals || []); }).catch(cause => setError(cause.message));
  }, []);
  return <div className="space-y-5">
    {error && <Card className="border-rose-400/20 text-rose-200">{error}</Card>}
    {!error && !proposals.length && <Card><p className="text-slate-400">No evidence-based proposal drafts exist. Creation is always explicit.</p><Link href="/proposals/new" className="mt-4 inline-flex rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">Create Proposal Draft</Link></Card>}
    <div className="grid gap-4 lg:grid-cols-2">{proposals.map(proposal => <Link key={proposal.id} href={`/proposals/${proposal.id}`} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5 hover:border-cyan-300/30"><div className="flex justify-between gap-3"><span className="text-xs text-violet-300">Business #{proposal.businessId}</span><Status value={proposal.status} /></div><h2 className="mt-3 font-black text-white">{proposal.title}</h2><p className="mt-2 text-sm text-slate-500">{formatMoney(proposal.pricing.totalMinor, proposal.currency)} · Version {proposal.currentVersion} · {new Date(proposal.updatedAt).toLocaleString()}</p></Link>)}</div>
    {!!legacy.length && <Card><h2 className="font-black text-white">Legacy revenue-share records</h2><p className="mt-1 text-xs text-amber-200">Preserved as historical records; values are not reinterpreted as validated Phase 5 pricing.</p><ul className="mt-3 space-y-2">{legacy.map(item => <li key={String(item.id)} className="rounded-xl bg-black/20 p-3 text-sm text-slate-400">Legacy #{String(item.id)} · Business #{String(item.business_id || "unassigned")} · {String(item.status || "recorded")}</li>)}</ul></Card>}
  </div>;
}

type Business = { id: number; name: string; domain: string };
type Audit = { id: string; score: number; createdAt: string; businessId: number | null };
type Consultant = { id: string; status: string; objective: string };

export function NewProposalView({ initialBusinessId, initialAuditId, initialConsultantReportId, autoFlow = false }: { initialBusinessId?: number; initialAuditId?: string; initialConsultantReportId?: string; autoFlow?: boolean }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [businessId, setBusinessId] = useState(initialBusinessId || 0);
  const [auditId, setAuditId] = useState(initialAuditId || "");
  const [consultantReportId, setConsultantReportId] = useState(initialConsultantReportId || "");
  const [proposalType, setProposalType] = useState("funnel_optimization");
  const [creationMode, setCreationMode] = useState("evidence_assisted");
  const [locale, setLocale] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoCreateStartedRef = useRef(false);
  useEffect(() => { fetch("/api/businesses").then(response => response.json()).then(data => setBusinesses(data.businesses || [])); }, []);
  useEffect(() => {
    if (!businessId) return;
    Promise.all([
      fetch(`/api/funnelspy/history?businessId=${businessId}`).then(response => response.json()),
      fetch(`/api/businesses/${businessId}/consultant-reports`).then(response => response.json()),
    ]).then(([auditData, consultantData]) => {
      setAudits(auditData.audits || []); setConsultants((consultantData.reports || []).filter((item: Consultant) => item.status === "completed"));
      setAuditId(current => current || auditData.audits?.[0]?.id || "");
    });
  }, [businessId]);
  const createDraft = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          auditId,
          consultantReportId: consultantReportId || undefined,
          proposalType,
          creationMode,
          locale,
          currency: "USD",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign(`/proposals/${data.proposal.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create draft.");
      setLoading(false);
    }
  }, [auditId, businessId, consultantReportId, creationMode, locale, proposalType]);

  useEffect(() => {
    if (!autoFlow || autoCreateStartedRef.current || loading) return;
    if (!businessId || !auditId) return;
    autoCreateStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void createDraft();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoFlow, auditId, businessId, createDraft, loading]);
  return <div className="space-y-5">
    <Card className="border-cyan-300/20"><h2 className="font-black text-white">Explicit draft creation</h2><p className="mt-2 text-sm text-slate-400">This action creates an editable draft only. It does not call AI, publish, send outreach or change CRM state.</p></Card>
    <Card><div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm text-slate-300">Business<select value={businessId} onChange={event => { setBusinessId(Number(event.target.value)); setAuditId(""); setConsultantReportId(""); }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] p-3"><option value={0}>Select business</option>{businesses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm text-slate-300">Associated persisted audit<select value={auditId} onChange={event => setAuditId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] p-3"><option value="">Select audit</option>{audits.map(item => <option key={item.id} value={item.id}>{new Date(item.createdAt).toLocaleDateString()} · score {item.score}</option>)}</select></label>
      <label className="text-sm text-slate-300">Optional completed AI Consultant report<select value={consultantReportId} onChange={event => setConsultantReportId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] p-3"><option value="">Do not use AI advisory text</option>{consultants.filter(item => !auditId || true).map(item => <option key={item.id} value={item.id}>{item.objective.replaceAll("_", " ")}</option>)}</select></label>
      <label className="text-sm text-slate-300">Proposal type<select value={proposalType} onChange={event => setProposalType(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] p-3">{["funnel_optimization","website_redesign","lead_generation","local_seo","analytics_tracking","conversion_optimization","crm_setup","outreach_setup","custom"].map(item => <option key={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
      <label className="text-sm text-slate-300">Creation mode<select value={creationMode} onChange={event => setCreationMode(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] p-3"><option value="blank">Blank</option><option value="evidence_assisted">Evidence-assisted</option><option value="template">Template</option></select></label>
      <label className="text-sm text-slate-300">Language<select value={locale} onChange={event => setLocale(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] p-3"><option value="en">English</option></select></label>
    </div></Card>
    {!businessId || !auditId ? <Card><p className="text-amber-200">A valid associated persisted audit is required. No audit runs automatically.</p>{businessId > 0 && <Link href={`/funnelspy?businessId=${businessId}`} className="mt-3 inline-flex text-cyan-300">Run Funnel Audit</Link>}</Card> : null}
    {error && <Card className="border-rose-400/20 text-rose-200"><AlertTriangle className="mr-2 inline size-4" />{error}</Card>}
    <button onClick={createDraft} disabled={loading || !businessId || !auditId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-40">{loading ? <LoaderCircle className="size-5 animate-spin" /> : <Plus className="size-5" />}Create Proposal Draft</button>
  </div>;
}

export function ProposalEditorView({ proposalId }: { proposalId: string }) {
  const [proposal, setProposal] = useState<ProposalRecord | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ProposalContent | null>(null);
  const [terms, setTerms] = useState<ProposalTerms | null>(null);
  const [pricingInput, setPricingInput] = useState<ProposalPricingInput | null>(null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const load = useCallback(() => fetch(`/api/proposals/${proposalId}`).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); const p = data.proposal as ProposalRecord; setProposal(p); setTitle(p.title); setContent(p.content); setTerms(p.terms); setNotes(p.internalNotes); setPricingInput({ pricingModel: p.pricing.pricingModel, lineItems: p.pricing.lineItems, discount: p.pricing.discount, taxRateBasisPoints: p.pricing.taxRateBasisPoints, deposit: p.pricing.deposit, currency: p.pricing.currency }); }), [proposalId]);
  useEffect(() => { load().catch(cause => setMessage(cause.message)); }, [load]);
  if (!proposal || !content || !terms || !pricingInput) return <Card>{message || <LoaderCircle className="size-5 animate-spin" />}</Card>;
  const addLine = () => setPricingInput(current => current && ({ ...current, lineItems: [...current.lineItems, { id: crypto.randomUUID(), name: "New service", quantity: 1, unitAmountMinor: 0, recurringInterval: null, taxable: false }] }));
  const addService = () => setContent(current => current && ({ ...current, recommendedServices: [...current.recommendedServices, { id: crypto.randomUUID(), name: "New service", description: "", reason: "", deliverables: [], relatedOpportunityIds: [], evidenceReferenceIds: [], selected: true, taxable: false }] }));
  async function action(path: string, method = "POST", body?: unknown) {
    setMessage("");
    const response = await fetch(`/api/proposals/${proposalId}${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json(); if (!response.ok) { setMessage(data.error); return; }
    if (data.publicUrl) setPublicUrl(data.publicUrl);
    if (data.proposal) { await load(); setMessage("Action completed."); }
  }
  async function downloadExport(format: "json" | "html") {
    setMessage("");
    const response = await fetch(`/api/proposals/${proposalId}/export`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format }) });
    if (!response.ok) { const data = await response.json(); setMessage(data.error || "Export failed."); return; }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `proposal-${proposalId}.${format}`; anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Export downloaded.");
  }
  const save = () => action("", "PATCH", { expectedVersion: proposal.currentVersion, title, content, pricingInput, terms, internalNotes: notes });
  return <div className="space-y-5">
    <Card className="border-violet-400/20"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs text-violet-300">Evidence-based proposal</span><h2 className="mt-2 text-xl font-black text-white">{proposal.title}</h2></div><div className="flex items-center gap-2"><Status value={proposal.status} /><span className="text-xs text-slate-500">Version {proposal.currentVersion}{proposal.publishedVersion ? ` · published v${proposal.publishedVersion}` : ""}</span></div></div></Card>
    {message && <Card className={message.includes("completed") ? "border-emerald-400/20 text-emerald-200" : "border-amber-400/20 text-amber-200"}>{message}</Card>}
    {publicUrl && <Card className="border-emerald-400/20"><p className="text-sm text-emerald-200">Public token is shown only now. Copy and store the link safely.</p><a href={publicUrl} target="_blank" className="mt-2 block break-all text-cyan-300">{location.origin}{publicUrl}</a></Card>}
    <Card><label className="text-sm text-slate-300">Title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={240} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label><label className="mt-4 block text-sm text-slate-300">Executive summary<textarea value={content.executiveSummary} onChange={event => setContent({ ...content, executiveSummary: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label><label className="mt-4 block text-sm text-slate-300">Current situation<textarea value={content.currentSituation} onChange={event => setContent({ ...content, currentSituation: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label><label className="mt-4 block text-sm text-slate-300">Timeline<textarea value={content.timeline} onChange={event => setContent({ ...content, timeline: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label></Card>
    <Card><div className="flex justify-between"><h2 className="font-black text-white">Recommended services</h2><button onClick={addService} className="text-sm text-cyan-300"><Plus className="mr-1 inline size-4" />Service</button></div><div className="mt-4 space-y-3">{content.recommendedServices.map(service => <div key={service.id} className="rounded-xl border border-white/[.06] p-3"><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={service.selected} onChange={event => setContent({ ...content, recommendedServices: content.recommendedServices.map(item => item.id === service.id ? { ...item, selected: event.target.checked } : item) })} />Include</label><input aria-label={`${service.id} service name`} value={service.name} onChange={event => setContent({ ...content, recommendedServices: content.recommendedServices.map(item => item.id === service.id ? { ...item, name: event.target.value } : item) })} className="mt-2 w-full rounded-lg bg-black/20 p-2" /><textarea aria-label={`${service.id} service description`} value={service.description} onChange={event => setContent({ ...content, recommendedServices: content.recommendedServices.map(item => item.id === service.id ? { ...item, description: event.target.value } : item) })} rows={2} className="mt-2 w-full rounded-lg bg-black/20 p-2" /></div>)}</div></Card>
    <Card><div className="grid gap-4 md:grid-cols-2"><ListField label="Deliverables" values={content.deliverables} onChange={values => setContent({ ...content, deliverables: values })} /><ListField label="Assumptions" values={content.assumptions} onChange={values => setContent({ ...content, assumptions: values })} /><ListField label="Exclusions" values={content.exclusions} onChange={values => setContent({ ...content, exclusions: values })} /><ListField label="Next steps" values={content.nextSteps} onChange={values => setContent({ ...content, nextSteps: values })} /></div></Card>
    <Card><div className="flex justify-between"><h2 className="font-black text-white">Services and pricing</h2><button onClick={addLine} className="text-sm text-cyan-300"><Plus className="mr-1 inline size-4" />Line item</button></div><div className="mt-4 space-y-3">{pricingInput.lineItems.map((item, index) => <div key={item.id} className="grid gap-2 rounded-xl border border-white/[.06] p-3 sm:grid-cols-[1fr_100px_140px]"><input aria-label={`Line ${index + 1} name`} value={item.name} onChange={event => setPricingInput({ ...pricingInput, lineItems: pricingInput.lineItems.map(line => line.id === item.id ? { ...line, name: event.target.value } : line) })} className="rounded-lg bg-black/20 p-2" /><input aria-label={`Line ${index + 1} quantity`} type="number" min={1} value={item.quantity} onChange={event => setPricingInput({ ...pricingInput, lineItems: pricingInput.lineItems.map(line => line.id === item.id ? { ...line, quantity: Number(event.target.value) } : line) })} className="rounded-lg bg-black/20 p-2" /><input aria-label={`Line ${index + 1} amount in cents`} type="number" min={0} value={item.unitAmountMinor} onChange={event => setPricingInput({ ...pricingInput, lineItems: pricingInput.lineItems.map(line => line.id === item.id ? { ...line, unitAmountMinor: Number(event.target.value) } : line) })} className="rounded-lg bg-black/20 p-2" /></div>)}</div><p className="mt-3 text-xs text-slate-500">Amounts are integer minor units (for USD, 12500 = $125.00). No price is inferred automatically.</p></Card>
    <Card><label className="text-sm text-slate-300">Internal notes — never public<textarea value={notes} onChange={event => setNotes(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label></Card>
    <Card><div className="grid gap-4 md:grid-cols-2"><label className="text-sm text-slate-300">Payment terms<textarea value={terms.paymentTerms} onChange={event => setTerms({ ...terms, paymentTerms: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label><label className="text-sm text-slate-300">Cancellation terms<textarea value={terms.cancellationTerms} onChange={event => setTerms({ ...terms, cancellationTerms: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /></label></div></Card>
    <div className="flex flex-wrap gap-2"><button onClick={save} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"><Save className="mr-2 inline size-4" />Save new version</button><button onClick={() => action("/ready")} className="rounded-xl border border-emerald-300/20 px-4 py-2 text-sm text-emerald-200"><CheckCircle2 className="mr-2 inline size-4" />Mark ready</button><button onClick={() => action("/publish", "POST", {})} className="rounded-xl border border-violet-300/20 px-4 py-2 text-sm text-violet-200"><Send className="mr-2 inline size-4" />Publish explicitly</button><button onClick={() => action("/duplicate")} className="rounded-xl border border-white/10 px-4 py-2 text-sm"><Copy className="mr-2 inline size-4" />Duplicate</button><button onClick={() => action("/archive")} className="rounded-xl border border-rose-300/20 px-4 py-2 text-sm text-rose-200"><Archive className="mr-2 inline size-4" />Archive</button><button onClick={() => downloadExport("json")} className="rounded-xl border border-white/10 px-4 py-2 text-sm"><FileText className="mr-2 inline size-4" />Export JSON</button><button onClick={() => downloadExport("html")} className="rounded-xl border border-white/10 px-4 py-2 text-sm"><FileText className="mr-2 inline size-4" />Export HTML</button></div>
    <Card>{["published", "viewed"].includes(proposal.status) ? <><h2 className="font-black text-white">Outreach handoff</h2><p className="mt-2 text-sm text-slate-400">Creates a campaign draft with this published proposal preselected. It does not approve, schedule or send.</p><Link href={`/outreach/campaigns/new?businessId=${proposal.businessId}&proposalId=${proposal.id}&flow=1`} className="mt-3 inline-flex rounded-xl border border-cyan-300/20 px-4 py-2 text-sm font-bold text-cyan-200">Create Outreach Campaign</Link></> : <p className="text-sm text-slate-500">Publish explicitly before creating an outreach campaign. Draft proposal links are never exposed.</p>}</Card>
    <Card><h2 className="font-black text-white">Evidence snapshot</h2><div className="mt-3 space-y-2">{proposal.evidenceSnapshot.map(item => <div key={item.id} className="rounded-xl bg-black/20 p-3 text-sm"><strong className={item.advisory ? "text-violet-200" : "text-cyan-200"}>{item.advisory ? "AI advisory" : "Detected evidence"} · {item.label}</strong><p className="mt-1 text-slate-400">{item.fact}</p></div>)}</div></Card>
  </div>;
}

function ListField({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  return <label className="text-sm text-slate-300">{label}<textarea value={values.join("\n")} onChange={event => onChange(event.target.value.split("\n").map(item => item.trim()).filter(Boolean))} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" /><span className="mt-1 block text-xs text-slate-600">One item per line.</span></label>;
}
