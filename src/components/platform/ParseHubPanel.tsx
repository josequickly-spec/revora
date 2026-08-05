"use client";

import { useState } from "react";
import Link from "next/link";
import { DatabaseZap, LoaderCircle, Play, RefreshCw } from "lucide-react";

type Project = { token: string; title: string; mainSite?: string; lastRun?: { status?: string } };
type Candidate = { sourceId: string; name: string; website: string; email: string; phone: string; address: string; city: string; category: string; provenance: string };
type Run = { run_token: string; status: string; data_ready: boolean; pages?: number };

export default function ParseHubPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectToken, setProjectToken] = useState("");
  const [query, setQuery] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadProjects() {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/integrations/parsehub");
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "ParseHub projects are unavailable.");
      setProjects(data.projects || []);
      if (!projectToken && data.projects?.[0]?.token) setProjectToken(data.projects[0].token);
      setNotice(`${data.total || data.projects?.length || 0} ParseHub projects available.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "ParseHub projects are unavailable.");
    } finally { setBusy(false); }
  }

  async function startRun() {
    if (!projectToken) return setNotice("Choose a reviewed ParseHub project first.");
    setBusy(true); setNotice(""); setCandidates([]);
    try {
      const response = await fetch("/api/integrations/parsehub", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectToken, query, sendEmail: false }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "The ParseHub run could not start.");
      setRun(data.run);
      setNotice("Extraction started. ParseHub runs asynchronously; refresh the status before loading data.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The ParseHub run could not start.");
    } finally { setBusy(false); }
  }

  async function refreshRun(loadData = false) {
    if (!run?.run_token) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/integrations/parsehub/runs/${encodeURIComponent(run.run_token)}${loadData ? "?data=1" : ""}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "The ParseHub run is unavailable.");
      setRun(data.run);
      if (loadData) setCandidates(data.candidates || []);
      setNotice(data.run.data_ready
        ? loadData ? `${data.candidateCount || 0} candidates normalized for review.` : "Data is ready. Load the reviewed extraction."
        : `Current status: ${data.run.status}. Avoid frequent polling.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The ParseHub run is unavailable.");
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-8 rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[.06] to-violet-400/[.04] p-5 sm:p-6" aria-labelledby="parsehub-operator">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><span className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Public data source</span><h2 id="parsehub-operator" className="mt-2 text-2xl font-black text-white">ParseHub project operator</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Run an existing reviewed ParseHub project, pass a city or niche query, then inspect normalized public candidates. Nothing is saved or contacted automatically.</p></div>
        <button type="button" onClick={loadProjects} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-black text-slate-200 disabled:opacity-50"><DatabaseZap className="size-4" />Load projects</button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reviewed project<select value={projectToken} onChange={(event) => setProjectToken(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm normal-case text-white"><option value="">Select a ParseHub project</option>{projects.map((project) => <option key={project.token} value={project.token}>{project.title || project.mainSite || project.token}</option>)}</select></label>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Project query<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Miami ecommerce stores" maxLength={500} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm normal-case text-white" /></label>
        <button type="button" onClick={startRun} disabled={busy || !projectToken} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}Run project</button>
      </div>
      {run && <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[.08] bg-black/20 p-4 text-xs text-slate-400"><strong className="text-white">Run: {run.status}</strong><span>{run.pages || 0} pages</span><span>{run.data_ready ? "Data ready" : "Processing"}</span><button type="button" onClick={() => refreshRun(false)} disabled={busy} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-bold text-slate-200"><RefreshCw className="size-3.5" />Refresh status</button>{run.data_ready && <button type="button" onClick={() => refreshRun(true)} disabled={busy} className="rounded-lg bg-violet-400 px-3 py-2 font-black text-slate-950">Load data</button>}</div>}
      {notice && <p role="status" className="mt-4 text-sm text-amber-100">{notice}</p>}
      {!!candidates.length && <div className="mt-6 grid gap-3 md:grid-cols-2">{candidates.map((candidate) => <article key={candidate.sourceId} className="rounded-2xl border border-white/[.08] bg-slate-950/60 p-4"><h3 className="font-black text-white">{candidate.name || candidate.website}</h3><p className="mt-1 text-xs text-cyan-300">{candidate.category || candidate.city || "Public candidate"}</p><dl className="mt-3 space-y-1 text-xs text-slate-500"><div>Website: {candidate.website || "Not extracted"}</div><div>Email: {candidate.email || "Not extracted"}</div><div>Phone: {candidate.phone || "Not extracted"}</div><div>{candidate.provenance}</div></dl>{candidate.website && <Link href={`/funnelspy?url=${encodeURIComponent(candidate.website)}`} className="mt-4 inline-flex rounded-lg border border-violet-300/20 bg-violet-300/[.07] px-3 py-2 text-xs font-black text-violet-200">Review with FunnelSpy</Link>}</article>)}</div>}
    </section>
  );
}
