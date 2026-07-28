"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FileText, Mail, Send } from "lucide-react";

type RecordType = "proposals" | "outreach";

export default function RecordsView({ type }: { type: RecordType }) {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const endpoint = type === "proposals" ? "/api/proposals" : "/api/outreach";

  useEffect(() => {
    fetch(endpoint)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `${type} data is unavailable.`);
        setRecords(data[type] || data.messages || data.outreach || []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : `Unable to load ${type}.`))
      .finally(() => setLoading(false));
  }, [endpoint, type]);

  if (loading) return <div className="h-64 animate-pulse rounded-3xl bg-white/[.05]" aria-label={`Loading ${type}`} />;
  if (error) return <Notice>{error} No substitute records are shown.</Notice>;
  if (!records.length) {
    return (
      <Notice>
        No {type} have been saved. Existing generation remains available in the legacy workspace.
        <Link href="/legacy" className="ml-2 font-bold text-cyan-300 hover:text-cyan-200">Open legacy workspace</Link>
      </Notice>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[.07] bg-white/[.025]">
      <ul className="divide-y divide-white/[.06]">
        {records.map((record, index) => {
          const id = String(record.id ?? index);
          const business = String(record.business_name ?? record.businessName ?? `Business #${record.business_id ?? "unassigned"}`);
          const status = String(record.status ?? "recorded");
          const primary = type === "proposals"
            ? String(record.estimated_agency_fee ?? record.projected_extra_revenue ?? "Terms recorded")
            : String(record.email_subject ?? record.recipient_email ?? "Outreach message");
          const Icon = type === "proposals" ? FileText : Mail;
          return (
            <li key={id} className="flex items-center gap-4 px-5 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-300/[.08] text-cyan-300"><Icon className="size-5" /></span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{business}</strong><span className="mt-1 block truncate text-xs text-slate-500">{primary}</span></span>
              <span className="rounded-lg border border-white/[.08] px-2.5 py-1 text-xs capitalize text-slate-400">{status}</span>
              {type === "outreach" && status === "draft" && <Send className="size-4 text-slate-700" aria-label="Draft not sent" />}
              {type === "proposals" && <ArrowRight className="size-4 text-slate-700" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div role="status" className="rounded-3xl border border-white/[.08] bg-white/[.03] p-8 text-sm leading-6 text-slate-400">{children}</div>;
}
