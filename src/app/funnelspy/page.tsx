"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  CircleAlert,
  Code2,
  CircleDollarSign,
  ExternalLink,
  FileSearch,
  Gauge,
  Globe2,
  LayoutDashboard,
  LayoutTemplate,
  LoaderCircle,
  Radar,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import type { FunnelSpyAnalysis } from "@/lib/funnelspy";
import type { FunnelAIReport } from "@/lib/funnelspy-ai";
import { ScrapingQuickButton } from "@/components/scraping/QuickAccessButtons";

function Stat({
  value,
  label,
  tone = "violet",
}: {
  value: string | number;
  label: string;
  tone?: "violet" | "cyan" | "lime";
}) {
  const colors = {
    violet: "text-violet-300",
    cyan: "text-cyan-300",
    lime: "text-lime-300",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
      <div className={`text-3xl font-black tracking-tight ${colors[tone]}`}>
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-[.16em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="relative grid size-36 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#a3e635 ${score * 3.6}deg, rgba(255,255,255,.08) 0)`,
      }}
    >
      <div className="grid size-[122px] place-items-center rounded-full bg-[#0b0e16]">
        <div className="text-center">
          <strong className="block text-4xl font-black text-white">
            {score}
          </strong>
          <span className="text-[10px] uppercase tracking-[.2em] text-slate-500">
            Funnel score
          </span>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-slate-300">
      {children}
    </span>
  );
}

export default function FunnelSpyPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [businessId, setBusinessId] = useState<number | undefined>();
  const [analysis, setAnalysis] = useState<FunnelSpyAnalysis | null>(null);
  const [report, setReport] = useState<FunnelAIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditId, setAuditId] = useState("");
  const [shareToken, setShareToken] = useState("");
  const [monitoring, setMonitoring] = useState(false);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [funnelError, setFunnelError] = useState("");
  const [createdFunnel, setCreatedFunnel] = useState<{
    es: string | null;
    en: string | null;
  } | null>(null);
  const [auditNotice, setAuditNotice] = useState("");
  const autoFlowRef = useRef(false);
  const autoAnalyzeStartedRef = useRef(false);
  const autoAdvanceRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setUrl(params.get("url") || "");
      const candidateBusinessId = Number(params.get("businessId"));
      setBusinessId(
        Number.isInteger(candidateBusinessId) && candidateBusinessId > 0
          ? candidateBusinessId
          : undefined,
      );
      autoFlowRef.current = params.get("flow") === "1" || params.get("autoFlow") === "1";
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const generateReport = useCallback(async (currentAnalysis: FunnelSpyAnalysis, currentAuditId: string) => {
    setAiLoading(true);
    setError("");
    try {
      const response = await fetch("/api/funnelspy/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: currentAnalysis,
          auditId: currentAuditId,
          language: "en",
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not generate the report.");
      setReport(data.report);
      return data.report as FunnelAIReport;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not generate the report.";
      setError(message);
      throw cause;
    } finally {
      setAiLoading(false);
    }
  }, []);

  const handoffToOtom = useCallback((
    currentAnalysis: FunnelSpyAnalysis,
    currentReport: FunnelAIReport,
    currentAuditId: string,
    currentBusinessId?: number,
  ) => {
    window.sessionStorage.setItem(
      "revora-otom-context",
      JSON.stringify({
        businessId: currentBusinessId,
        businessName: currentAnalysis.pages.find((page) => page.kind === "home")?.title || currentAnalysis.domain,
        businessType: currentReport.funnelType,
        targetAudience: currentReport.targetAudience,
        currentOffer: currentReport.valueProposition,
        currentPrice: 0,
        primaryObjective: currentReport.primaryObjective,
        valueProposition: currentReport.valueProposition,
        weaknesses: currentReport.weaknesses,
        recommendations: currentReport.recommendations.map((item) => item.action),
        evidence: currentAnalysis.pages.slice(0, 8).map((page) => `${page.kind}: ${page.title} — ${page.description}`),
        auditId: currentAuditId,
        sourceUrl: currentAnalysis.origin,
        visualIdentity: currentAnalysis.visualIdentity,
      }),
    );
    router.push("/otom?flow=1");
  }, [router]);

  const analyze = useCallback(async (target = url, forceRefresh = false, overrideBusinessId = businessId) => {
    if (!target.trim()) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    setReport(null);
    setAuditId("");
    setShareToken("");
    try {
      const response = await fetch("/api/funnelspy/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, businessId: overrideBusinessId, forceRefresh }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not analyze the site.");
      setAnalysis(data.analysis);
      setAuditId(data.audit?.id || "");
      setShareToken(data.audit?.shareToken || "");
      setAuditNotice(
        [
          data.reused
            ? `Reused a completed audit from ${new Date(data.audit.createdAt).toLocaleString()}.`
            : "Fresh audit completed.",
          ...(data.warnings || []),
        ].join(" "),
      );
      if (autoFlowRef.current && !autoAdvanceRef.current) {
        autoAdvanceRef.current = true;
        const reportData = await generateReport(data.analysis, data.audit?.id || "");
        handoffToOtom(data.analysis, reportData, data.audit?.id || "", data.businessId || overrideBusinessId);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not analyze the site.",
      );
    } finally {
      setLoading(false);
    }
  }, [businessId, generateReport, handoffToOtom, url]);

  useEffect(() => {
    if (!autoFlowRef.current || autoAnalyzeStartedRef.current || loading) return;
    if (!url.trim()) return;
    autoAnalyzeStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void analyze(url, false, businessId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [analyze, businessId, loading, url]);

  async function analyzeWithAI() {
    if (!analysis) return;
    await generateReport(analysis, auditId);
  }

  async function activateMonitor() {
    if (!analysis) return;
    setMonitoring(true);
    setError("");
    try {
      const response = await fetch("/api/funnelspy/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: analysis.domain,
          frequency: "weekly",
          businessId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not activate.");
    } catch (cause) {
      setMonitoring(false);
      setError(cause instanceof Error ? cause.message : "Could not activate.");
    }
  }

  async function createFunnelFromReport() {
    if (!analysis || !report) return;
    setFunnelLoading(true);
    setFunnelError("");
    setCreatedFunnel(null);
    try {
      const response = await fetch("/api/funnelspy/create-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, report, auditId: auditId || undefined, languageMode: "en" }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not create the funnel.");
      setCreatedFunnel(data.previewUrls);
    } catch (cause) {
      setFunnelError(
        cause instanceof Error
          ? cause.message
          : "Could not create the funnel.",
      );
    } finally {
      setFunnelLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07090f] text-slate-100 selection:bg-violet-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(124,58,237,.22),transparent_33%),radial-gradient(circle_at_90%_20%,rgba(34,211,238,.12),transparent_28%)]" />
      <header className="relative z-20 border-b border-white/[.07] bg-[#07090f]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/funnelspy" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20">
              <Radar className="size-5" />
            </span>
            <div>
              <div className="text-lg font-black tracking-tight">
                Funnel<span className="text-violet-400">Spy</span>
              </div>
              <div className="text-[9px] uppercase tracking-[.28em] text-slate-500">
                Competitive intelligence
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <Link
              href="/"
              className="font-bold text-cyan-300 hover:text-cyan-200"
            >
              Command Center
            </Link>
            <a href="#scanner" className="hover:text-white">
              Analyze
            </a>
            <Link href="/funnelspy/compare" className="hover:text-white">
              Compare
            </Link>
            <Link href="/funnelspy/history" className="hover:text-white">
              History
            </Link>
          </nav>
          <a
            href="#scanner"
            className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-200"
          >
            New audit
          </a>
        </div>
      </header>

      <main className="relative z-10">
        {!analysis && (
          <>
            <section className="mx-auto max-w-7xl px-5 pb-20 pt-20 text-center md:pt-28">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-violet-200">
                <Sparkles className="size-3.5" />
                AI-powered funnel intelligence
              </div>
              <h1 className="mx-auto max-w-5xl text-5xl font-black leading-[.98] tracking-[-.055em] text-white md:text-8xl">
                Discover the strategy behind{" "}
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  any site.
                </span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
                Map pages, CTAs, forms, technologies, and performance.
                FunnelSpy turns public evidence into an actionable conversion
                plan.
              </p>
              <form
                id="scanner"
                onSubmit={(event) => {
                  event.preventDefault();
                  analyze();
                }}
                className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/[.055] p-2 shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:flex-row"
              >
                <div className="flex flex-1 items-center gap-3 px-3">
                  <Globe2 className="size-5 text-slate-500" />
                  <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    className="h-14 w-full bg-transparent text-base text-white outline-none placeholder:text-slate-600"
                    placeholder="https://competitor.com"
                  />
                </div>
                <button
                  disabled={loading || !url.trim()}
                  className="flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 font-black text-white shadow-lg shadow-violet-600/20 transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    <ScanLine className="size-5" />
                  )}
                  {loading ? "Crawling..." : "Analyze funnel"}
                </button>
              </form>
              {error && (
                <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  <CircleAlert className="size-4" />
                  {error}
                </div>
              )}
              <div className="mx-auto mt-8 max-w-2xl">
                <ScrapingQuickButton variant="funnel" />
              </div>
            </section>
            <section
              id="features"
              className="mx-auto grid max-w-7xl gap-4 px-5 pb-24 md:grid-cols-3"
            >
              {[
                [
                  FileSearch,
                  "Smart crawling",
                  "Discover key paths and classify journey pages without submitting forms.",
                ],
                [
                  Activity,
                  "Technical signals",
                  "Identify technologies, pixels, forms, performance, and domain age.",
                ],
                [
                  Bot,
                  "AI strategy",
                  "Turn findings into strengths, gaps, ads, and prioritized actions.",
                ],
              ].map(([Icon, title, copy]) => {
                const FeatureIcon = Icon as typeof FileSearch;
                return (
                  <article
                    key={title as string}
                    className="group rounded-3xl border border-white/[.08] bg-white/[.025] p-7 transition hover:border-violet-400/30 hover:bg-white/[.04]"
                  >
                    <FeatureIcon className="size-7 text-violet-300" />
                    <h2 className="mt-8 text-xl font-black">
                      {title as string}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {copy as string}
                    </p>
                  </article>
                );
              })}
            </section>
          </>
        )}

        {analysis && (
          <div className="mx-auto max-w-7xl px-5 py-10">
            <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <button
                  onClick={() => {
                    setAnalysis(null);
                    setReport(null);
                    setError("");
                  }}
                  className="mb-4 text-xs font-bold uppercase tracking-[.15em] text-violet-300"
                >
                  ← New audit
                </button>
                <div className="flex items-center gap-3">
                  <span className="size-2 animate-pulse rounded-full bg-lime-400 shadow-[0_0_14px_#a3e635]" />
                  <span className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">
                    Audit completed
                  </span>
                </div>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                  {analysis.domain}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Analyzed {new Date(analysis.analyzedAt).toLocaleString("en-US")}{" "}
                  ·{" "}
                  {analysis.discovery.renderedWithBrowser
                    ? "Playwright"
                    : "HTML"}{" "}
                  · {analysis.discovery.sitemapUrls} URLs in sitemap
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={analysis.origin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Visit <ExternalLink className="size-3" />
                </a>
                {auditId && (
                  <a
                    href={`/api/funnelspy/export?id=${auditId}&format=csv`}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Export CSV
                  </a>
                )}
                {auditId && (
                  <a
                    href={`/api/funnelspy/export?id=${auditId}&format=json`}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    JSON
                  </a>
                )}
                {shareToken && (
                  <a
                    href={`/shared/funnelspy/${shareToken}`}
                    target="_blank"
                    className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-200"
                  >
                    Share
                  </a>
                )}
                <button
                  onClick={() => analyze(url, true)}
                  disabled={loading}
                  className="rounded-xl border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-2 text-xs text-cyan-200"
                >
                  Run fresh audit
                </button>
                <button
                  onClick={activateMonitor}
                  disabled={monitoring}
                  className="rounded-xl border border-lime-400/20 bg-lime-400/[.06] px-3 py-2 text-xs text-lime-200"
                >
                  {monitoring ? "Monitoring active" : "Monitor weekly"}
                </button>
              </div>
            </div>
            {auditNotice && (
              <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06] p-4 text-sm text-cyan-100">
                {auditNotice}
              </div>
            )}
            {error && (
              <div className="mb-5 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                <CircleAlert className="size-4" />
                {error}
              </div>
            )}

            <section className="grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
              <article className="flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/15 to-cyan-400/[.04] p-7 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <div className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">
                    FunnelSpy Diagnosis
                  </div>
                  <h2 className="mt-3 text-3xl font-black">
                    {analysis.scoreLabel}
                  </h2>
                  <p className="mt-3 leading-7 text-slate-400">
                    The score combines public structure, CTAs, capture,
                    tracking, and signals from the detected journey.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {analysis.technologies.slice(0, 5).map((item) => (
                      <Pill key={item}>{item}</Pill>
                    ))}
                  </div>
                </div>
                <ScoreRing score={analysis.score} />
              </article>
              <div className="grid grid-cols-2 gap-4">
                <Stat value={analysis.totals.pages} label="Pages" />
                <Stat value={analysis.totals.ctas} label="CTAs" tone="cyan" />
                <Stat
                  value={analysis.totals.forms}
                  label="Forms"
                  tone="lime"
                />
                <Stat value={analysis.totals.pixels} label="Pixels" />
              </div>
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-7">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">
                      Journey map
                    </span>
                    <h3 className="mt-2 text-xl font-black">Estimated funnel</h3>
                  </div>
                  <Target className="text-slate-600" />
                </div>
                <div className="space-y-2">
                  {analysis.funnelStages.map((stage, index) => (
                    <div
                      key={stage.name}
                      className="flex items-center gap-4 rounded-2xl border border-white/[.06] bg-black/15 p-4"
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black ${stage.status === "detected" ? "bg-lime-400/10 text-lime-300" : stage.status === "probable" ? "bg-amber-400/10 text-amber-300" : "bg-slate-500/10 text-slate-500"}`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong>{stage.name}</strong>
                          <span className="text-[10px] uppercase text-slate-600">
                            {stage.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {stage.evidence}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-slate-700" />
                    </div>
                  ))}
                </div>
              </article>
              <article className="overflow-hidden rounded-3xl border border-white/[.08] bg-white/[.025]">
                <div className="border-b border-white/[.07] p-6">
                  <span className="text-xs font-bold uppercase tracking-[.16em] text-violet-300">
                    Public snapshot
                  </span>
                  <h3 className="mt-2 text-xl font-black">Site view</h3>
                </div>
                {/* eslint-disable @next/next/no-img-element -- dynamic third-party audit screenshots cannot use a fixed host allowlist */}
                <div className="grid bg-gradient-to-br from-slate-900 to-violet-950 sm:grid-cols-2">
                  <div className="relative aspect-video sm:aspect-auto sm:min-h-64">
                    {/* Screenshot URLs are dynamic, third-party audit evidence and cannot use a fixed Next Image host allowlist. */}
                    {analysis.screenshot ? (
                      <img
                        src={analysis.screenshot}
                        alt={`Public screenshot of ${analysis.domain}`}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-center">
                        <LayoutDashboard className="mx-auto size-10 text-slate-700" />
                        <p className="mt-3 text-xs text-slate-600">
                          No public screenshot available
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="relative hidden min-h-64 border-l border-white/[.06] sm:block">
                    {analysis.screenshotMobile ? (
                      <img
                        src={analysis.screenshotMobile}
                        alt={`Mobile view of ${analysis.domain}`}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-slate-600">
                        Mobile view not available
                      </div>
                    )}
                  </div>
                </div>
                {/* eslint-enable @next/next/no-img-element */}
                <div className="grid grid-cols-2 gap-px bg-white/[.06]">
                  <div className="bg-[#0b0e16] p-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">
                      Performance
                    </span>
                    <strong className="mt-1 block text-xl">
                      {analysis.performance.performance ?? "—"}
                    </strong>
                  </div>
                  <div className="bg-[#0b0e16] p-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">
                      SEO
                    </span>
                    <strong className="mt-1 block text-xl">
                      {analysis.performance.seo ?? "—"}
                    </strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="mt-5 rounded-3xl border border-white/[.08] bg-white/[.025] p-7">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">
                    Page gallery
                  </span>
                  <h3 className="mt-2 text-xl font-black">
                    Detected surfaces
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {analysis.pages.length} URLs audited
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analysis.pages.map((page) => (
                  <article
                    key={page.url}
                    className="rounded-2xl border border-white/[.07] bg-black/20 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-violet-400/10 px-2 py-1 text-[10px] font-bold uppercase text-violet-300">
                        {page.kind}
                      </span>
                      <a href={page.url} target="_blank" rel="noreferrer">
                        <ArrowUpRight className="size-4 text-slate-600 hover:text-white" />
                      </a>
                    </div>
                    <h4 className="mt-4 line-clamp-1 font-bold">
                      {page.title}
                    </h4>
                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                      {page.description}
                    </p>
                    <div className="mt-5 flex items-center gap-4 border-t border-white/[.06] pt-4 text-xs text-slate-500">
                      <span>{page.ctas.length} CTAs</span>
                      <span>{page.forms} forms</span>
                      <span>{page.evidence.length} evidence points</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-r from-violet-600/15 to-cyan-400/[.06] p-7">
              <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-violet-300">
                    <Bot className="size-4" />
                    FunnelSpy AI
                  </div>
                  <h3 className="mt-3 text-2xl font-black">
                    Turn signals into strategy
                  </h3>
                  <p className="mt-2 leading-7 text-slate-400">
                    Interprets objective, audience, value proposition,
                    friction, and opportunities using only the collected evidence.
                  </p>
                </div>
                <button
                  onClick={analyzeWithAI}
                  disabled={aiLoading}
                  className="flex min-h-13 shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-violet-100 disabled:opacity-60"
                >
                  {aiLoading ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                  {aiLoading
                    ? "Interpreting..."
                    : report
                      ? "Regenerate report"
                      : "Analyze with AI"}
                </button>
              </div>
            </section>

            {report && (
              <section className="mt-5 space-y-5">
                <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-7">
                  <div className="flex flex-col justify-between gap-5 md:flex-row">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[.16em] text-lime-300">
                        Strategic report
                      </span>
                      <h2 className="mt-3 text-3xl font-black">
                        {report.primaryObjective}
                      </h2>
                      <p className="mt-4 max-w-4xl leading-7 text-slate-400">
                        {report.executiveSummary}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-lime-400/15 bg-lime-400/[.06] p-5 text-center">
                      <strong className="text-3xl text-lime-300">
                        {report.confidence}%
                      </strong>
                      <span className="mt-1 block text-[10px] uppercase text-slate-500">
                        Confidence
                      </span>
                    </div>
                  </div>
                </article>
                <div className="grid gap-5 lg:grid-cols-2">
                  {[
                    ["Strengths", report.strengths, Check, "text-lime-300"],
                    [
                      "Weaknesses",
                      report.weaknesses,
                      CircleAlert,
                      "text-amber-300",
                    ],
                  ].map(([title, items, Icon, color]) => {
                    const ListIcon = Icon as typeof Check;
                    return (
                      <article
                        key={title as string}
                        className="rounded-3xl border border-white/[.08] bg-white/[.025] p-7"
                      >
                        <h3 className="text-xl font-black">
                          {title as string}
                        </h3>
                        <div className="mt-5 space-y-3">
                          {(items as string[]).map((item) => (
                            <div
                              key={item}
                              className="flex gap-3 text-sm leading-6 text-slate-400"
                            >
                              <ListIcon
                                className={`mt-1 size-4 shrink-0 ${color}`}
                              />
                              {item}
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-7">
                  <h3 className="text-xl font-black">Optimization plan</h3>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {report.recommendations.map((item, index) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/[.07] bg-black/20 p-5"
                      >
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span
                            className={
                              item.priority === "high"
                                ? "text-rose-300"
                                : item.priority === "medium"
                                  ? "text-amber-300"
                                  : "text-cyan-300"
                            }
                          >
                            {item.priority}
                          </span>
                          <span className="text-slate-700">0{index + 1}</span>
                        </div>
                        <h4 className="mt-4 font-black">{item.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {item.action}
                        </p>
                        <div className="mt-4 border-t border-white/[.06] pt-4 text-xs text-slate-500">
                          <Zap className="mr-2 inline size-3 text-violet-300" />
                          {item.expectedImpact}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-violet-500/[.08] to-transparent p-7">
                  <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="max-w-3xl">
                      <span className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">
                        Funnel Builder
                      </span>
                      <h3 className="mt-3 text-2xl font-black">
                        Create a new funnel from this report
                      </h3>
                      <p className="mt-2 leading-7 text-slate-400">
                        Generates a connected experience with visual identity,
                        core offer, upsell, downsell, journey,
                        form, and tracking. Landing, OTOM, and Web Builder
                        all start from the same evidence.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/otom"
                        onClick={() =>
                          window.sessionStorage.setItem(
                            "revora-otom-context",
                            JSON.stringify({
                              businessName:
                                analysis.pages.find((page) => page.kind === "home")
                                  ?.title || analysis.domain,
                              businessType: report.funnelType,
                              targetAudience: report.targetAudience,
                              currentOffer: report.valueProposition,
                              currentPrice: 0,
                              primaryObjective: report.primaryObjective,
                              valueProposition: report.valueProposition,
                              weaknesses: report.weaknesses,
                              recommendations: report.recommendations.map(
                                (item) => item.action,
                              ),
                              evidence: analysis.pages.slice(0, 8).map(
                                (page) =>
                                  `${page.kind}: ${page.title} — ${page.description}`,
                              ),
                              auditId,
                              sourceUrl: analysis.origin,
                              visualIdentity: analysis.visualIdentity,
                            }),
                          )
                        }
                        className="flex min-h-13 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-300 px-6 py-3 font-black text-slate-950 shadow-lg shadow-orange-500/20"
                      >
                        <CircleDollarSign className="size-5" />
                        Generate OTOM with this audit
                      </Link>
                      <Link
                        href="/web-builder"
                        onClick={() =>
                          window.sessionStorage.setItem(
                            "revora-web-builder-context",
                            JSON.stringify({
                              businessName:
                                analysis.pages.find((page) => page.kind === "home")
                                  ?.title || analysis.domain,
                              businessType: report.funnelType,
                              targetAudience: report.targetAudience,
                              currentOffer: report.valueProposition,
                              currentPrice: 0,
                              primaryObjective: report.primaryObjective,
                              valueProposition: report.valueProposition,
                              weaknesses: report.weaknesses,
                              recommendations: report.recommendations.map(
                                (item) => item.action,
                              ),
                              evidence: analysis.pages.slice(0, 8).map(
                                (page) => `${page.kind}: ${page.title} - ${page.description}`,
                              ),
                              auditId,
                              sourceUrl: analysis.origin,
                              visualIdentity: analysis.visualIdentity,
                            }),
                          )
                        }
                        className="flex min-h-13 shrink-0 items-center gap-2 rounded-xl border border-orange-300/25 bg-orange-300/[.06] px-6 py-3 font-black text-orange-200 transition hover:bg-orange-300/[.12]"
                      >
                        <LayoutTemplate className="size-5" />
                        Create full web preview
                      </Link>
                      <button
                        onClick={createFunnelFromReport}
                        disabled={funnelLoading}
                        className="flex min-h-13 shrink-0 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[.06] px-6 py-3 font-black text-cyan-200 transition hover:bg-cyan-300/[.12] disabled:opacity-60"
                      >
                        {funnelLoading ? (
                          <LoaderCircle className="size-5 animate-spin" />
                        ) : (
                          <Sparkles className="size-5" />
                        )}
                        {funnelLoading
                          ? "Creating funnel..."
                          : "Create full experience"}
                      </button>
                    </div>
                  </div>
                  {funnelError && (
                    <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                      {funnelError}
                    </p>
                  )}
                  {createdFunnel && (
                    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/[.07] p-5">
                      <Check className="size-5 text-lime-300" />
                      <strong className="text-lime-200">
                        Funnel created successfully
                      </strong>
                      {createdFunnel.es && (
                        <a
                          href={createdFunnel.es}
                          target="_blank"
                          className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950"
                        >
                          Open ES
                        </a>
                      )}
                      {createdFunnel.en && (
                        <a
                          href={createdFunnel.en}
                          target="_blank"
                          className="rounded-xl border border-white/15 px-4 py-2 text-xs font-black text-white"
                        >
                          Open EN
                        </a>
                      )}
                    </div>
                  )}
                </article>
              </section>
            )}

            <section className="mt-5 grid gap-5 md:grid-cols-3">
              <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6">
                <Gauge className="text-cyan-300" />
                <h3 className="mt-5 font-black">Technical quality</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-400">
                  <div className="flex justify-between">
                    <span>Accessibility</span>
                    <strong>{analysis.performance.accessibility ?? "—"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Best practices</span>
                    <strong>{analysis.performance.bestPractices ?? "—"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>LCP</span>
                    <strong>{analysis.performance.lcp ?? "—"}</strong>
                  </div>
                </div>
              </article>
              <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6">
                <Code2 className="text-violet-300" />
                <h3 className="mt-5 font-black">Detected stack</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.technologies.length ? (
                    analysis.technologies.map((item) => (
                      <Pill key={item}>{item}</Pill>
                    ))
                  ) : (
                    <span className="text-sm text-slate-600">
                      No clear public signatures.
                    </span>
                  )}
                </div>
              </article>
              <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6">
                <ShieldCheck className="text-lime-300" />
                <h3 className="mt-5 font-black">Domain</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-400">
                  <div className="flex justify-between gap-4">
                    <span>Age</span>
                    <strong>
                      {analysis.domainIntel.ageYears !== null
                        ? `${analysis.domainIntel.ageYears} years`
                        : "—"}
                    </strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Registrar</span>
                    <strong className="truncate">
                      {analysis.domainIntel.registrar ?? "—"}
                    </strong>
                  </div>
                </div>
              </article>
            </section>
          </div>
        )}
      </main>
      <footer className="relative z-10 border-t border-white/[.06] py-8 text-center text-xs text-slate-600">
        FunnelSpy analyzes public information only. Findings are
        estimates, not internal access.
      </footer>
    </div>
  );
}
