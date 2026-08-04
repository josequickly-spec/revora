"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Globe2, Mail, Network, Plus, Search, Trash2, X } from "lucide-react";

type Business = {
  id: number;
  name: string;
  domain: string;
  country: string;
  city?: string | null;
  businessType: string;
  niche: string;
  platform: string;
  status: string;
  createdAt?: string;
  technologyData?: {
    checkedAt?: string;
    technologies?: Array<{ name: string; category?: string | null }>;
  } | null;
};
type Contact = { id: number; businessId: number | null; name: string; role: string; email: string; linkedinUrl?: string | null; confidenceScore?: number | null; status: string | null };
type Funnel = { id: number; businessId: number | null; funnelName: string; slug: string; viewCount: number | null };
type Audit = { id: string; businessId: number | null; domain: string; score: number; createdAt: string; opportunityCount: number };
type ConsultantReport = {
  id: string;
  status: string;
  objective: string;
  createdAt: string;
  provider?: string | null;
  model?: string | null;
  report?: {
    executiveSummary: string;
    topPriorities: Array<{ title: string; priority: string; recommendedAction: string }>;
  } | null;
};
type ProposalSummary = { id: string; title: string; status: string };
type CampaignSummary = { id: string; name: string; status: string };

export default function BusinessesView({ selectedId }: { selectedId?: number }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [consultantReports, setConsultantReports] = useState<ConsultantReport[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [deletingFunnelId, setDeletingFunnelId] = useState<number | null>(null);
  const [pendingDeleteFunnelId, setPendingDeleteFunnelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/businesses"), fetch("/api/contacts"), fetch("/api/funnels")])
      .then(async ([businessResponse, contactResponse, funnelResponse]) => {
        if (!businessResponse.ok || !contactResponse.ok || !funnelResponse.ok) throw new Error("Business intelligence data is unavailable.");
        const [businessData, contactData, funnelData] = await Promise.all([businessResponse.json(), contactResponse.json(), funnelResponse.json()]);
        setBusinesses(businessData.businesses || []);
        setContacts(contactData.contacts || []);
        setFunnels(funnelData.funnels || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load business intelligence."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    Promise.all([
      fetch(`/api/funnelspy/history?businessId=${selectedId}`).then(response => response.ok ? response.json() : Promise.reject(new Error("Audit history unavailable"))),
      fetch(`/api/businesses/${selectedId}/consultant-reports`).then(response => response.ok ? response.json() : { reports: [] }),
      fetch(`/api/proposals?businessId=${selectedId}`).then(response => response.ok ? response.json() : { proposals: [] }),
      fetch(`/api/outreach/campaigns?businessId=${selectedId}`).then(response => response.ok ? response.json() : { campaigns: [] }),
    ]).then(([auditData, consultantData, proposalData, campaignData]) => {
      setAudits(auditData.audits || []);
      setConsultantReports(consultantData.reports || []);
      setProposals(proposalData.proposals || []);
      setCampaigns(campaignData.campaigns || []);
    }).catch(() => { setAudits([]); setConsultantReports([]); setProposals([]); setCampaigns([]); });
  }, [selectedId]);

  const selected = useMemo(() => businesses.find((business) => business.id === selectedId), [businesses, selectedId]);

  async function deleteFunnel(funnel: Funnel) {
    if (deletingFunnelId !== null) return;
    setDeletingFunnelId(funnel.id);
    try {
      const response = await fetch("/api/funnels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: funnel.id, confirmation: `BORRAR EMBUDO ${funnel.id}` }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "The funnel could not be deleted.");
      setFunnels(current => current.filter(item => item.id !== funnel.id));
      setPendingDeleteFunnelId(null);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "The funnel could not be deleted.");
    } finally {
      setDeletingFunnelId(null);
    }
  }

  if (loading) return <div className="h-72 animate-pulse rounded-3xl bg-white/[.05]" aria-label="Loading businesses" />;
  if (error) return <Notice>{error} No substitute business data is shown.</Notice>;
  if (selectedId && !selected) return <Notice>Business #{selectedId} was not found in the current workspace.</Notice>;

  if (selected) {
    const businessContacts = contacts.filter((contact) => contact.businessId === selected.id);
    const businessFunnels = funnels.filter((funnel) => funnel.businessId === selected.id);
    return (
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-3xl border border-white/[.07] bg-white/[.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">{selected.status}</span>
              <h2 className="mt-2 text-2xl font-black text-white">{selected.name}</h2>
              <a href={`https://${selected.domain}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300">
                <Globe2 className="size-4" />{selected.domain}
              </a>
            </div>
            <Link href={`/funnelspy?url=${encodeURIComponent(selected.domain)}&businessId=${selected.id}`} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 outline-none hover:bg-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300">Run Funnel Audit</Link>
          </div>
          <dl className="mt-8 grid gap-4 border-t border-white/[.07] pt-6 sm:grid-cols-2">
            {[
              ["Location", [selected.city, selected.country].filter(Boolean).join(", ") || "Not recorded"],
              ["Business type", selected.businessType || "Not recorded"],
              ["Niche", selected.niche || "Not recorded"],
              ["Platform", selected.platform || "Not detected"],
            ].map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-wider text-slate-600">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-200">{value}</dd></div>)}
          </dl>
          <section className="mt-8 border-t border-white/[.07] pt-6">
            <h3 className="font-black text-white">Enrichment status</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Status label="Website" value={selected.domain ? "available" : "unavailable"} />
              <Status label="BuiltWith" value={selected.technologyData ? "success" : "unavailable"} />
              <Status label="Hunter" value={businessContacts.some(contact => ["verified", "discovered"].includes(contact.status || "")) ? "success" : "unavailable"} />
              <Status label="LinkedIn" value={businessContacts.some(contact => Boolean(contact.linkedinUrl)) ? "profile saved" : "research available"} />
              <Status label="Audit summary" value="not persisted" />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Provider values reflect persisted evidence only. Missing audit details are not reconstructed or estimated.
              {selected.createdAt ? ` Business saved ${new Date(selected.createdAt).toLocaleString()}.` : ""}
              {selected.technologyData?.checkedAt ? ` Technology checked ${new Date(selected.technologyData.checkedAt).toLocaleString()}.` : ""}
            </p>
          </section>
          <section className="mt-6 border-t border-white/[.07] pt-6">
            <h3 className="font-black text-white">Technologies</h3>
            {selected.technologyData?.technologies?.length
              ? <ul className="mt-3 flex flex-wrap gap-2">{selected.technologyData.technologies.map(technology => <li key={technology.name} className="rounded-lg bg-white/[.05] px-3 py-1.5 text-xs text-slate-300">{technology.name}{technology.category ? ` · ${technology.category}` : ""}</li>)}</ul>
              : <p className="mt-3 text-sm text-slate-500">Technology evidence is unavailable.</p>}
          </section>
          <section className="mt-6 border-t border-white/[.07] pt-6">
            <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white">Outreach campaigns</h3><Link href={`/outreach/campaigns/new?businessId=${selected.id}`} className="text-xs font-bold text-cyan-300">Create draft</Link></div>
            <p className="mt-2 text-xs text-slate-500">{businessContacts.length} contact candidates · verification and suppression are rechecked before approval.</p>
            {campaigns.length ? <ul className="mt-3 space-y-2">{campaigns.map(item => <li key={item.id}><Link href={`/outreach/campaigns/${item.id}`} className="flex justify-between rounded-xl bg-black/20 p-3 text-sm"><span>{item.name}</span><span className="text-cyan-200">{item.status}</span></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No campaign drafts. Opening this profile does not create one.</p>}
          </section>
          <section className="mt-6 border-t border-white/[.07] pt-6">
            <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white">AI Consultant</h3><Link href={`/businesses/${selected.id}/consultant`} className="text-xs font-bold text-violet-300">Report history</Link></div>
            {consultantReports[0]?.status === "completed" && consultantReports[0].report
              ? <div className="mt-3 rounded-2xl border border-violet-300/15 bg-violet-400/[.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-violet-300">Latest generated strategy</span><span className="text-[10px] text-slate-500">{consultantReports[0].provider} · {consultantReports[0].model}</span></div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{consultantReports[0].report.executiveSummary}</p>
                  <div className="mt-4 space-y-2">{consultantReports[0].report.topPriorities.slice(0, 3).map((priority) => <div key={priority.title} className="rounded-xl border border-white/[.06] bg-black/15 p-3"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-white">{priority.title}</strong><span className="text-[9px] font-black uppercase text-cyan-300">{priority.priority}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{priority.recommendedAction}</p></div>)}</div>
                  <Link href={`/consultant/${consultantReports[0].id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-200">Open complete strategy <ArrowRight className="size-4" /></Link>
                </div>
              : consultantReports[0]
                ? <Link href={`/consultant/${consultantReports[0].id}`} className="mt-3 flex items-center justify-between rounded-xl bg-violet-400/[.06] p-3 text-sm"><span className="text-slate-300">{consultantReports[0].objective.replaceAll("_", " ")} · {new Date(consultantReports[0].createdAt).toLocaleString()}</span><span className="text-violet-200">{consultantReports[0].status}</span></Link>
                : <p className="mt-3 text-sm text-slate-500">{audits.length ? "No AI strategy has been generated. Opening this profile never calls AI." : "A persisted associated audit is required before strategy generation."}</p>}
            <Link href={audits.length ? `/businesses/${selected.id}/consultant?auditId=${audits[0].id}` : `/funnelspy?url=${encodeURIComponent(selected.domain)}&businessId=${selected.id}`} className="mt-3 inline-flex rounded-xl border border-violet-300/20 px-4 py-2 text-sm font-bold text-violet-200">{audits.length ? "Generate AI Strategy" : "Run Funnel Audit"}</Link>
          </section>
          <section className="mt-6 border-t border-white/[.07] pt-6">
            <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white">Funnel audits</h3><Link href={`/businesses/${selected.id}/opportunities`} className="text-xs font-bold text-violet-300">View opportunities</Link></div>
            {audits.length ? <ul className="mt-3 space-y-2">{audits.map(audit => <li key={audit.id}><Link href={`/audits/${audit.id}`} className="flex items-center justify-between rounded-xl bg-black/20 p-3 text-sm"><span className="text-slate-300">{new Date(audit.createdAt).toLocaleString()}</span><span className="text-cyan-300">{audit.score} score · {audit.opportunityCount} opportunities</span></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No associated audit. Opening this profile does not run one automatically.</p>}
          </section>
          <section className="mt-6 border-t border-white/[.07] pt-6">
            <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white">Proposals</h3><Link href={audits[0] ? `/proposals/new?businessId=${selected.id}&auditId=${audits[0].id}` : `/funnelspy?url=${encodeURIComponent(selected.domain)}&businessId=${selected.id}`} className="text-xs font-bold text-cyan-300">{audits.length ? "Create draft" : "Audit required"}</Link></div>
            {proposals.length ? <ul className="mt-3 space-y-2">{proposals.map(proposal => <li key={proposal.id}><Link href={`/proposals/${proposal.id}`} className="flex items-center justify-between rounded-xl bg-black/20 p-3 text-sm"><span className="text-slate-300">{proposal.title}</span><span className="text-violet-200">{proposal.status}</span></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No proposal drafts. Opening this profile never creates one automatically.</p>}
          </section>
        </section>
        <div className="space-y-6">
          <ContactsPanel
            business={selected}
            contacts={businessContacts}
            onCreated={(contact) => setContacts((current) => [contact, ...current])}
          />
          <RelatedList title="Funnels" icon={Network} empty="No funnels recorded." items={businessFunnels.map((funnel) => ({
            id: funnel.id,
            title: funnel.funnelName,
            detail: `${funnel.viewCount || 0} views`,
            href: `/es/funnel/${funnel.slug}`,
            onDelete: () => setPendingDeleteFunnelId(funnel.id),
            onConfirmDelete: () => deleteFunnel(funnel),
            onCancelDelete: () => setPendingDeleteFunnelId(null),
            confirming: pendingDeleteFunnelId === funnel.id,
            deleting: deletingFunnelId === funnel.id,
          }))} />
        </div>
      </div>
    );
  }

  if (!businesses.length) return <Notice>No businesses have been saved. Use the existing Lead Finder workspace to discover the first business.</Notice>;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[.07] bg-white/[.025]">
      <ul className="divide-y divide-white/[.06]">
        {businesses.map((business) => {
          const contactCount = contacts.filter((contact) => contact.businessId === business.id).length;
          const funnelCount = funnels.filter((funnel) => funnel.businessId === business.id).length;
          return (
            <li key={business.id}>
              <Link href={`/businesses/${business.id}`} className="group flex items-center gap-4 px-5 py-4 outline-none transition hover:bg-white/[.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-300/[.08] text-cyan-300"><Building2 className="size-5" /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{business.name}</strong><span className="mt-1 block truncate text-xs text-slate-500">{business.domain} · {business.businessType}</span></span>
                <span className="hidden text-xs text-slate-500 sm:block">{contactCount} contacts · {funnelCount} funnels</span>
                <ArrowRight className="size-4 shrink-0 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function contactReadiness(contact: Contact) {
  const role = contact.role.toLowerCase();
  const localPart = contact.email.split("@")[0]?.toLowerCase() || "";
  const reasons: string[] = [];
  let score = 0;
  if (/founder|co-founder|owner|ceo|fundador|propietario/.test(role)) { score += 35; reasons.push("senior decision-maker role"); }
  else if (/director|head|vp|chief/.test(role)) { score += 30; reasons.push("department leadership role"); }
  else if (/manager|gerente|lead/.test(role)) { score += 20; reasons.push("management role"); }
  else { score += 8; reasons.push("role recorded"); }
  if (contact.linkedinUrl) { score += 25; reasons.push("LinkedIn profile saved"); }
  if (contact.status === "verified") { score += 30; reasons.push("email verified"); }
  else if (contact.status === "discovered") { score += 15; reasons.push("email discovered; verification pending"); }
  else { score += 5; reasons.push("manual email; verification pending"); }
  if (localPart && !/^(info|hello|hola|contact|sales|ventas|marketing|admin|support|soporte)$/.test(localPart)) {
    score += 10;
    reasons.push("person-like mailbox");
  }
  return { score: Math.min(score, 100), reasons };
}

function ContactsPanel({ business, contacts, onCreated }: { business: Business; contacts: Contact[]; onCreated: (contact: Contact) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState({ name: "", role: "", email: "", linkedinUrl: "" });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSavedMessage("");
  }

  async function addContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, ...form }),
      });
      const data = await response.json();
      if (!response.ok || !data.contact) throw new Error(data.error || "The contact could not be saved.");
      onCreated(data.contact);
      setForm({ name: "", role: "", email: "", linkedinUrl: "" });
      setOpen(false);
      setSavedMessage(`${data.contact.name} was added as a manual contact.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The contact could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/[.07] bg-white/[.025] p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-black text-white"><Mail className="size-4 text-cyan-300" />Contacts</h2>
        <button
          type="button"
          onClick={() => { setOpen((current) => !current); setError(""); setSavedMessage(""); }}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-2 text-xs font-black text-cyan-200 outline-none hover:bg-cyan-300/[.12] focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          {open ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {open ? "Cancel" : "Add manually"}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-400/[.05] p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#0a66c2] text-white"><Network className="size-4" /></span>
          <div>
            <h3 className="text-sm font-black text-white">Decision-maker research</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Open focused LinkedIn searches, confirm the person, then save the verified profile and email. EcoScale does not claim an identity until you save evidence.</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(`${business.name} ${business.domain}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/20 px-3 py-2.5 text-xs font-bold text-blue-200"><Search className="size-3.5" />Find company</a>
          <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${business.name} founder CEO owner`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/20 px-3 py-2.5 text-xs font-bold text-blue-200"><Search className="size-3.5" />Founder / CEO / Owner</a>
          <a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${business.name} ecommerce director marketing growth`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/20 px-3 py-2.5 text-xs font-bold text-blue-200"><Search className="size-3.5" />Ecommerce / Marketing</a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${business.name}" (founder OR CEO OR director OR ecommerce OR marketing)`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-bold text-slate-300"><Search className="size-3.5" />Search public profiles</a>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-600">Suggested order: Founder/CEO/Owner for small owner-led businesses; Ecommerce/Marketing/Growth leadership when that responsibility is publicly documented.</p>
      </div>

      {open && (
        <form onSubmit={addContact} className="mt-4 space-y-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ContactField label="Full name" value={form.name} onChange={(value) => updateField("name", value)} autoComplete="name" placeholder="Jane Smith" required />
            <ContactField label="Role" value={form.role} onChange={(value) => updateField("role", value)} autoComplete="organization-title" placeholder="Marketing Director" required />
          </div>
          <ContactField label="Email" value={form.email} onChange={(value) => updateField("email", value)} type="email" autoComplete="email" placeholder="jane@company.com" required />
          <ContactField label="LinkedIn URL (optional)" value={form.linkedinUrl} onChange={(value) => updateField("linkedinUrl", value)} type="url" autoComplete="url" placeholder="https://www.linkedin.com/in/jane-smith" />
          <p className="text-[11px] leading-5 text-slate-500">Manual contacts are saved as unverified until a verification provider confirms the address.</p>
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[.07] px-3 py-2 text-xs text-red-200">{error}</p>}
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 outline-none hover:bg-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving contact…" : "Save contact"}
          </button>
        </form>
      )}

      {savedMessage && <p role="status" className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] px-3 py-2 text-xs text-emerald-200">{savedMessage}</p>}
      {contacts.length
        ? <ul className="mt-4 space-y-3">{contacts.map((contact) => {
            const readiness = contactReadiness(contact);
            return <li key={contact.id} className="rounded-xl border border-white/[.05] bg-black/15 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-200">{contact.name}</div>
                  <a href={`mailto:${contact.email}`} className="mt-1 block truncate text-xs text-cyan-300 hover:text-cyan-200">{contact.email}</a>
                  <div className="mt-1 text-xs text-slate-500">{contact.role || "Role not recorded"}</div>
                  {contact.linkedinUrl && <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-blue-200"><Network className="size-3.5" />Open LinkedIn profile</a>}
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{contact.status || "unknown"}</span>
                  <div className="mt-2 text-xs font-black text-lime-300">{readiness.score}/100</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-600">readiness</div>
                </div>
              </div>
              <p className="mt-3 border-t border-white/[.05] pt-2 text-[10px] leading-4 text-slate-600">Based on: {readiness.reasons.join(" · ")}. This is evidence readiness, not a predicted reply rate.</p>
            </li>;
          })}</ul>
        : !open && <p className="mt-4 text-sm text-slate-500">No contacts recorded. Add the first one manually.</p>}
    </section>
  );
}

function ContactField({ label, value, onChange, type = "text", autoComplete, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-slate-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#090e19] px-3 py-2.5 text-sm font-normal text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
      />
    </label>
  );
}

function RelatedList({ title, icon: Icon, items, empty }: { title: string; icon: typeof Mail; items: Array<{ id: number; title: string; detail: string; href?: string; onDelete?: () => void; onConfirmDelete?: () => void; onCancelDelete?: () => void; confirming?: boolean; deleting?: boolean }>; empty: string }) {
  return (
    <section className="rounded-3xl border border-white/[.07] bg-white/[.025] p-5">
      <h2 className="flex items-center gap-2 font-black text-white"><Icon className="size-4 text-cyan-300" />{title}</h2>
      {items.length ? <ul className="mt-4 space-y-3">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 text-sm"><div className="min-w-0"><div className="truncate font-semibold text-slate-200">{item.href ? <Link href={item.href} target="_blank" className="hover:text-cyan-300">{item.title}</Link> : item.title}</div><div className="mt-1 text-xs text-slate-500">{item.detail}</div></div>{item.confirming ? <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={item.onCancelDelete} disabled={item.deleting} className="rounded-lg border border-white/10 px-2.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">Cancel</button><button type="button" onClick={item.onConfirmDelete} disabled={item.deleting} className="rounded-lg bg-red-500 px-2.5 py-2 text-xs font-black text-white disabled:opacity-40">{item.deleting ? "Deleting…" : `Delete #${item.id}`}</button></div> : item.onDelete && <button type="button" onClick={item.onDelete} disabled={item.deleting} aria-label={`Delete ${item.title} #${item.id}`} className="shrink-0 rounded-lg border border-red-400/20 p-2 text-red-300 outline-none hover:bg-red-400/10 focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40"><Trash2 className="size-4" aria-hidden="true" /></button>}</li>)}</ul> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div role="status" className="rounded-3xl border border-white/[.08] bg-white/[.03] p-8 text-sm leading-6 text-slate-400">{children}</div>;
}

function Status({ label, value }: { label: string; value: string }) {
  return <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-slate-300">{label}: {value}</span>;
}
