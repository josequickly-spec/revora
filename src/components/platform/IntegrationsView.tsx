"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, PlugZap } from "lucide-react";

type Integration = { ready: boolean; required: string[]; missing: string[]; hasDefaultProject?: boolean; webhookProtected?: boolean };

export default function IntegrationsView() {
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/integrations")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Integration status is unavailable.");
        setIntegrations(data.integrations || {});
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load integration status."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid animate-pulse gap-4 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 rounded-2xl bg-white/[.05]" />)}</div>;
  if (error) return <div role="status" className="rounded-3xl border border-amber-400/20 bg-amber-400/[.06] p-6 text-sm text-amber-100">{error}</div>;

  return (
    <section aria-labelledby="integration-status">
      <h2 id="integration-status" className="sr-only">Integration status</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(integrations).map(([name, integration]) => (
          <article key={name} className="rounded-2xl border border-white/[.07] bg-white/[.03] p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-white/[.05] text-slate-300"><PlugZap className="size-5" /></span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${integration.ready ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
                {integration.ready ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}
                {integration.ready ? "Ready" : "Needs configuration"}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-black capitalize text-white">{name}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {integration.ready ? "Required environment configuration is present." : `Missing: ${integration.missing.join(", ") || "provider configuration"}`}
            </p>
            {name === "parseHub" && integration.ready && <p className="mt-2 text-xs leading-5 text-cyan-200/70">Default project: {integration.hasDefaultProject ? "configured" : "choose in operator"} · Webhook: {integration.webhookProtected ? "protected" : "secret required"}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
