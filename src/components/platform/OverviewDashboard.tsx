"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BarChart3, Bot, Building2, CheckCircle2, FileText,
  Mail, Network, Radar, Search, Send, Sparkles, Users, Zap,
} from "lucide-react";

type Business = { id: number; name: string; domain: string; status: string; createdAt?: string };
type Audit = { id: string; domain: string; score: number; scoreLabel: string; createdAt: string };
type Campaign = { id: string; business_name: string; status: string; created_at: string };
type Integration = { ready: boolean };

type OverviewData = {
  businesses: Business[];
  contacts: unknown[];
  funnels: unknown[];
  audits: Audit[];
  campaigns: Campaign[];
  integrations: Record<string, Integration>;
};

const emptyData: OverviewData = { businesses: [], contacts: [], funnels: [], audits: [], campaigns: [], integrations: {} };

async function readJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

export default function OverviewDashboard() {
  const [data, setData] = useState<OverviewData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      readJson("/api/businesses"), readJson("/api/contacts"), readJson("/api/funnels"),
      readJson("/api/funnelspy/history"), readJson("/api/campaigns"), readJson("/api/integrations"),
    ]).then((results) => {
      if (!active) return;
      const names = ["businesses", "contacts", "funnels", "audits", "campaigns", "integrations"];
      const failed = results.flatMap((result, index) => result.status === "rejected" ? [names[index]] : []);
      const value = (index: number) => results[index].status === "fulfilled" ? results[index].value : {};
      setData({
        businesses: value(0).businesses || [], contacts: value(1).contacts || [], funnels: value(2).funnels || [],
        audits: value(3).audits || [], campaigns: value(4).campaigns || [], integrations: value(5).integrations || {},
      });
      setUnavailable(failed);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const readyIntegrations = Object.values(data.integrations).filter((item) => item.ready).length;
  const totalIntegrations = Object.keys(data.integrations).length;
  const unauditedBusinesses = Math.max(0, data.businesses.length - data.audits.length);
  const pipeline = useMemo(() => [
    { label: "Leads", value: data.businesses.length, href: "/leads", icon: Search, color: "cyan" },
    { label: "Audits", value: data.audits.length, href: "/audits", icon: Radar, color: "violet" },
    { label: "Funnels", value: data.funnels.length, href: "/funnelspy", icon: Network, color: "fuchsia" },
    { label: "Campaigns", value: data.campaigns.length, href: "/outreach", icon: Send, color: "lime" },
  ], [data.audits.length, data.businesses.length, data.campaigns.length, data.funnels.length]);

  if (loading) return <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-36 rounded-3xl bg-white/[.05]" />)}</div>;

  return (
    <div className="space-y-6">
      {unavailable.length > 0 && <div role="status" className="rounded-2xl border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-sm text-amber-100">Live data unavailable: {unavailable.join(", ")}. No substitute metrics are shown.</div>}

      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#0a1220] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full border border-cyan-300/10" />
        <div className="pointer-events-none absolute right-10 top-10 size-44 rounded-full border border-violet-400/15" />
        <div className="relative grid gap-8 xl:grid-cols-[1.45fr_.8fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200"><Sparkles className="size-3.5" />AI-powered growth operations</div>
            <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">Your growth operation, <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">in one command center.</span></h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Move a business from evidence to strategy, proposal, approved outreach and CRM—without losing context between tools.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Action href="/leads" label="Find a lead" icon={Search} />
              <Action href="/funnelspy" label="Run FunnelSpy audit" icon={Radar} tone="secondary" />
            </div>
          </div>
          <div className="rounded-3xl border border-white/[.08] bg-black/20 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.16em] text-slate-500">System readiness</span><span className="flex items-center gap-1.5 text-xs font-bold text-lime-300"><CheckCircle2 className="size-3.5" />Live data</span></div>
            <strong className="mt-4 block text-4xl font-black text-white">{totalIntegrations ? `${readyIntegrations}/${totalIntegrations}` : "—"}</strong>
            <span className="mt-1 block text-sm text-slate-500">configured integrations</span>
            <Link href="/settings/integrations" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200">Review integrations <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="growth-pipeline" className="rounded-[2rem] border border-white/[.07] bg-white/[.025] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Growth pipeline</p><h2 id="growth-pipeline" className="mt-2 text-xl font-black text-white">From discovery to delivery</h2></div><span className="text-xs text-slate-500">Counts reflect saved workspace records.</span></div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pipeline.map((stage, index) => <PipelineStage key={stage.label} {...stage} index={index} />)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-[2rem] border border-white/[.07] bg-white/[.025] p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-violet-300">Next actions</p><h2 className="mt-2 text-xl font-black text-white">Keep the pipeline moving</h2></div><Bot className="size-6 text-violet-300" /></div>
          <div className="mt-5 space-y-3">
            <Priority href="/funnelspy" title={unauditedBusinesses ? `${unauditedBusinesses} business${unauditedBusinesses === 1 ? "" : "es"} may need an audit` : "Run a fresh FunnelSpy audit"} detail="Audits are explicit. A profile is never scanned automatically." action="Open FunnelSpy" />
            <Priority href="/opportunities" title="Review evidence-backed opportunities" detail="Prioritize verified findings before generating a strategy or proposal." action="Review opportunities" />
            <Priority href="/outreach" title="Approve outreach before delivery" detail="Drafts remain controlled until a sender and campaign are reviewed." action="Open outreach" />
            <Priority href="/legacy" title="Access Legacy Workspace" detail="Original EcoScale Partner workspace with revenue operations tools and 1-click blueprint." action="Open legacy" />
          </div>
        </section>
        <section className="rounded-[2rem] border border-white/[.07] bg-gradient-to-br from-violet-400/[.09] via-white/[.025] to-cyan-300/[.06] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Workspace signals</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Signal label="Businesses" value={data.businesses.length} icon={Building2} />
            <Signal label="Contacts" value={data.contacts.length} icon={Users} />
            <Signal label="Proposals" value="Open" icon={FileText} href="/proposals" />
            <Signal label="CRM" value="Active" icon={Mail} href="/crm" />
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">AI can prepare strategy and assets from saved evidence. Approval remains required for commercial and delivery actions.</p>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RecentList title="Recent businesses" empty="No businesses have been saved." href="/businesses" items={data.businesses.slice(0, 5).map((business) => ({ id: String(business.id), title: business.name, detail: business.domain, href: `/businesses/${business.id}?flow=1` }))} />
        <RecentList title="Recent audits" empty="No FunnelSpy audits have been saved." href="/audits" items={data.audits.slice(0, 5).map((audit) => ({ id: audit.id, title: audit.domain, detail: `${audit.score} · ${audit.scoreLabel}`, href: `/audits/${audit.id}` }))} />
        <RecentList title="Recent campaigns" empty="No campaigns have been saved." href="/outreach" items={data.campaigns.slice(0, 5).map((campaign) => ({ id: campaign.id, title: campaign.business_name, detail: campaign.status, href: `/campaign/${campaign.id}` }))} />
      </div>
    </div>
  );
}

function Action({ href, label, icon: Icon, tone = "primary" }: { href: string; label: string; icon: typeof Search; tone?: "primary" | "secondary" }) {
  return <Link href={href} className={tone === "primary" ? "inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200" : "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[.08]"}><Icon className="size-4" />{label}</Link>;
}

function PipelineStage({ label, value, href, icon: Icon, color, index }: { label: string; value: number; href: string; icon: typeof Search; color: string; index: number }) {
  const colors: Record<string, string> = { cyan: "text-cyan-300 bg-cyan-300/[.08]", violet: "text-violet-300 bg-violet-400/[.08]", fuchsia: "text-fuchsia-300 bg-fuchsia-400/[.08]", lime: "text-lime-300 bg-lime-400/[.08]" };
  return <Link href={href} className="group relative overflow-hidden rounded-2xl border border-white/[.07] bg-black/15 p-5 transition hover:-translate-y-0.5 hover:border-white/15"><span className="absolute right-4 top-3 text-[10px] font-black text-slate-700">0{index + 1}</span><span className={`grid size-10 place-items-center rounded-xl ${colors[color]}`}><Icon className="size-5" /></span><strong className="mt-7 block text-3xl font-black text-white">{value}</strong><span className="mt-1 block text-sm text-slate-500">{label}</span><ArrowRight className="absolute bottom-5 right-5 size-4 text-slate-700 transition group-hover:translate-x-1 group-hover:text-white" /></Link>;
}

function Priority({ href, title, detail, action }: { href: string; title: string; detail: string; action: string }) {
  return <Link href={href} className="group flex items-start gap-4 rounded-2xl border border-white/[.07] bg-black/15 p-4 transition hover:border-cyan-300/20 hover:bg-white/[.035]"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-cyan-300/[.08] text-xs font-black text-cyan-300">→</span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-100">{title}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-300">{action}<ArrowRight className="size-3" /></span></span></Link>;
}

function Signal({ label, value, icon: Icon, href }: { label: string; value: string | number; icon: typeof Building2; href?: string }) {
  const content = <><span className="grid size-9 place-items-center rounded-xl bg-white/[.06] text-violet-200"><Icon className="size-4" /></span><strong className="mt-5 block text-2xl font-black text-white">{value}</strong><span className="mt-1 block text-xs text-slate-500">{label}</span></>;
  return href ? <Link href={href} className="rounded-2xl border border-white/[.07] bg-black/15 p-4 transition hover:bg-white/[.04]">{content}</Link> : <div className="rounded-2xl border border-white/[.07] bg-black/15 p-4">{content}</div>;
}

function RecentList({ title, empty, href, items }: { title: string; empty: string; href: string; items: Array<{ id: string; title: string; detail: string; href: string }> }) {
  return <section className="rounded-[2rem] border border-white/[.07] bg-white/[.025] p-5"><div className="flex items-center justify-between"><h2 className="font-black text-white">{title}</h2><Link href={href} className="text-xs font-bold text-cyan-300 hover:text-cyan-200">View all</Link></div>{items.length ? <ul className="mt-4 divide-y divide-white/[.06]">{items.map((item) => <li key={item.id}><Link href={item.href} className="flex items-center justify-between gap-3 rounded-lg py-3 transition hover:text-cyan-200"><span className="min-w-0"><strong className="block truncate text-sm text-slate-200">{item.title}</strong><span className="mt-1 block truncate text-xs capitalize text-slate-500">{item.detail}</span></span><ArrowRight className="size-4 shrink-0 text-slate-700" /></Link></li>)}</ul> : <p className="mt-8 text-sm text-slate-500">{empty}</p>}</section>;
}
