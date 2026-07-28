"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Building2, FileText, Mail, Network, Users } from "lucide-react";

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

const emptyData: OverviewData = {
  businesses: [],
  contacts: [],
  funnels: [],
  audits: [],
  campaigns: [],
  integrations: {},
};

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
      readJson("/api/businesses"),
      readJson("/api/contacts"),
      readJson("/api/funnels"),
      readJson("/api/funnelspy/history"),
      readJson("/api/campaigns"),
      readJson("/api/integrations"),
    ]).then((results) => {
      if (!active) return;
      const names = ["businesses", "contacts", "funnels", "audits", "campaigns", "integrations"];
      const failed = results.flatMap((result, index) => result.status === "rejected" ? [names[index]] : []);
      const value = (index: number) => results[index].status === "fulfilled" ? results[index].value : {};
      setData({
        businesses: value(0).businesses || [],
        contacts: value(1).contacts || [],
        funnels: value(2).funnels || [],
        audits: value(3).audits || [],
        campaigns: value(4).campaigns || [],
        integrations: value(5).integrations || {},
      });
      setUnavailable(failed);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const readyIntegrations = Object.values(data.integrations).filter((item) => item.ready).length;
  const totalIntegrations = Object.keys(data.integrations).length;
  const stats = [
    { label: "Businesses", value: data.businesses.length, href: "/businesses", icon: Building2 },
    { label: "Contacts", value: data.contacts.length, href: "/businesses", icon: Users },
    { label: "Funnels", value: data.funnels.length, href: "/legacy", icon: Network },
    { label: "Audits", value: data.audits.length, href: "/audits", icon: BarChart3 },
    { label: "Campaigns", value: data.campaigns.length, href: "/crm", icon: Mail },
    { label: "Integrations ready", value: totalIntegrations ? `${readyIntegrations}/${totalIntegrations}` : "—", href: "/settings/integrations", icon: FileText },
  ];

  if (loading) {
    return <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 rounded-2xl bg-white/[.05]" />)}</div>;
  }

  return (
    <div className="space-y-8">
      {unavailable.length > 0 && (
        <div role="status" className="rounded-2xl border border-amber-400/20 bg-amber-400/[.06] px-4 py-3 text-sm text-amber-100">
          Some live data is unavailable: {unavailable.join(", ")}. No substitute metrics are shown.
        </div>
      )}

      <section aria-labelledby="workspace-totals">
        <h2 id="workspace-totals" className="sr-only">Workspace totals</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="group rounded-2xl border border-white/[.07] bg-white/[.03] p-5 outline-none transition hover:border-cyan-300/25 hover:bg-white/[.05] focus-visible:ring-2 focus-visible:ring-cyan-300">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/[.08] text-cyan-300"><Icon className="size-5" /></span>
                  <ArrowRight className="size-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                </div>
                <strong className="mt-6 block text-3xl font-black text-white">{stat.value}</strong>
                <span className="mt-1 block text-sm text-slate-500">{stat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <RecentList
          title="Recent businesses"
          empty="No businesses have been saved."
          href="/businesses"
          items={data.businesses.slice(0, 5).map((business) => ({ id: String(business.id), title: business.name, detail: business.domain, href: `/businesses/${business.id}` }))}
        />
        <RecentList
          title="Recent audits"
          empty="No FunnelSpy audits have been saved."
          href="/audits"
          items={data.audits.slice(0, 5).map((audit) => ({ id: audit.id, title: audit.domain, detail: `${audit.score} · ${audit.scoreLabel}`, href: `/audits/${audit.id}` }))}
        />
        <RecentList
          title="Recent campaigns"
          empty="No campaigns have been saved."
          href="/crm"
          items={data.campaigns.slice(0, 5).map((campaign) => ({ id: campaign.id, title: campaign.business_name, detail: campaign.status, href: `/campaign/${campaign.id}` }))}
        />
      </div>
    </div>
  );
}

function RecentList({
  title,
  empty,
  href,
  items,
}: {
  title: string;
  empty: string;
  href: string;
  items: Array<{ id: string; title: string; detail: string; href: string }>;
}) {
  return (
    <section className="rounded-3xl border border-white/[.07] bg-white/[.025] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-white">{title}</h2>
        <Link href={href} className="text-xs font-bold text-cyan-300 outline-none hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300">View all</Link>
      </div>
      {items.length ? (
        <ul className="mt-4 divide-y divide-white/[.06]">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-center justify-between gap-3 rounded-lg py-3 outline-none hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300">
                <span className="min-w-0"><strong className="block truncate text-sm text-slate-200">{item.title}</strong><span className="mt-1 block truncate text-xs capitalize text-slate-500">{item.detail}</span></span>
                <ArrowRight className="size-4 shrink-0 text-slate-700" />
              </Link>
            </li>
          ))}
        </ul>
      ) : <p className="mt-8 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}
