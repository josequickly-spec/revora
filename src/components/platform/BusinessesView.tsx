"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Globe2, Mail, Network } from "lucide-react";

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
type Contact = { id: number; businessId: number | null; name: string; email: string; status: string | null };
type Funnel = { id: number; businessId: number | null; funnelName: string; slug: string; viewCount: number | null };
type Audit = { id: string; businessId: number | null; domain: string; score: number; createdAt: string; opportunityCount: number };
type ConsultantReport = { id: string; status: string; objective: string; createdAt: string };
type ProposalSummary = { id: string; title: string; status: string };

export default function BusinessesView({ selectedId }: { selectedId?: number }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [consultantReports, setConsultantReports] = useState<ConsultantReport[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
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
    ]).then(([auditData, consultantData, proposalData]) => {
      setAudits(auditData.audits || []);
      setConsultantReports(consultantData.reports || []);
      setProposals(proposalData.proposals || []);
    }).catch(() => { setAudits([]); setConsultantReports([]); setProposals([]); });
  }, [selectedId]);

  const selected = useMemo(() => businesses.find((business) => business.id === selectedId), [businesses, selectedId]);

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
              <Status label="Hunter" value={businessContacts.length ? "success" : "unavailable"} />
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
            <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white">AI Consultant</h3><Link href={`/businesses/${selected.id}/consultant`} className="text-xs font-bold text-violet-300">Report history</Link></div>
            {consultantReports[0]
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
          <RelatedList title="Contacts" icon={Mail} empty="No contacts recorded." items={businessContacts.map((contact) => ({ id: contact.id, title: contact.name, detail: contact.email }))} />
          <RelatedList title="Funnels" icon={Network} empty="No funnels recorded." items={businessFunnels.map((funnel) => ({ id: funnel.id, title: funnel.funnelName, detail: `${funnel.viewCount || 0} views`, href: `/es/funnel/${funnel.slug}` }))} />
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

function RelatedList({ title, icon: Icon, items, empty }: { title: string; icon: typeof Mail; items: Array<{ id: number; title: string; detail: string; href?: string }>; empty: string }) {
  return (
    <section className="rounded-3xl border border-white/[.07] bg-white/[.025] p-5">
      <h2 className="flex items-center gap-2 font-black text-white"><Icon className="size-4 text-cyan-300" />{title}</h2>
      {items.length ? <ul className="mt-4 space-y-3">{items.map((item) => <li key={item.id} className="text-sm"><div className="font-semibold text-slate-200">{item.href ? <Link href={item.href} target="_blank" className="hover:text-cyan-300">{item.title}</Link> : item.title}</div><div className="mt-1 text-xs text-slate-500">{item.detail}</div></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div role="status" className="rounded-3xl border border-white/[.08] bg-white/[.03] p-8 text-sm leading-6 text-slate-400">{children}</div>;
}

function Status({ label, value }: { label: string; value: string }) {
  return <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-slate-300">{label}: {value}</span>;
}
