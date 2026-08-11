"use client";

import { useState } from "react";
import { Zap, AlertCircle } from "lucide-react";
import ScrapingJobMonitor from "./ScrapingJobMonitor";

// Data Enrichment Component
export function DataEnrichmentComponent({ businessId, onResults }: any) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleEnrich = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!domain.trim()) {
      setError("Enter a valid domain");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "data-enrichment",
          params: { domain, businessId },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start enrichment");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start enrichment");
      setLoading(false);
    }
  };

  if (jobId) {
    return (
      <div className="space-y-3">
        <ScrapingJobMonitor
          jobId={jobId}
          autoClose={false}
          onComplete={(results) => {
            setLoading(false);
            setCompleted(true);
            onResults?.(results);
          }}
          onError={(err) => {
            setError(err);
            setLoading(false);
            setJobId(null);
          }}
        />
        {completed && (
          <button
            onClick={() => { setJobId(null); setCompleted(false); }}
            className="w-full rounded-lg border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/[.07] hover:text-white"
          >
            Enrich Another Domain
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleEnrich} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-emerald-300">
        <Zap className="size-4" />
        Data Enrichment
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-300 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading ? "Enriching..." : "Enrich Data"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Enriches business data: company size, founding year, revenue, tech stack, reviews.
      </p>
    </form>
  );
}

// Contact Extractor Component
export function ContactExtractorComponent({ businessId, onResults }: any) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleExtract = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!domain.trim()) {
      setError("Enter a valid domain");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact-extraction",
          params: { domain, businessId },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start extraction");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start extraction");
      setLoading(false);
    }
  };

  if (jobId) {
    return (
      <div className="space-y-3">
        <ScrapingJobMonitor
          jobId={jobId}
          autoClose={false}
          onComplete={(results) => {
            setLoading(false);
            setCompleted(true);
            onResults?.(results);
          }}
          onError={(err) => {
            setError(err);
            setLoading(false);
            setJobId(null);
          }}
        />
        {completed && (
          <button
            onClick={() => { setJobId(null); setCompleted(false); }}
            className="w-full rounded-lg border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/[.07] hover:text-white"
          >
            Extract From Another Domain
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleExtract} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-pink-300">
        <Zap className="size-4" />
        Contact Extraction
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-pink-300 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-pink-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-pink-300 disabled:opacity-50"
        >
          {loading ? "Extracting..." : "Extract Contacts"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Extracts employee info, decision-makers, emails, phone numbers, and social profiles.
      </p>
    </form>
  );
}

// Proposal Personalizer Component
export function ProposalPersonalizerComponent({ businessId, domain: defaultDomain, onResults }: any) {
  const [domain, setDomain] = useState(defaultDomain || "");
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handlePersonalize = async (e: any) => {
    e?.preventDefault();

    if (!domain.trim()) {
      setError("Enter a valid domain");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "proposal-generation",
          params: { domain, businessId },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start personalization");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start personalization");
      setLoading(false);
    }
  };

  if (jobId) {
    return (
      <div className="space-y-3">
        <ScrapingJobMonitor
          jobId={jobId}
          autoClose={false}
          onComplete={(results) => {
            setLoading(false);
            setCompleted(true);
            onResults?.(results);
          }}
          onError={(err) => {
            setError(err);
            setLoading(false);
            setJobId(null);
          }}
        />
        {completed && (
          <button
            onClick={() => { setJobId(null); setCompleted(false); }}
            className="w-full rounded-lg border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/[.07] hover:text-white"
          >
            Generate Another Proposal
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handlePersonalize} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-lime-300">
        <Zap className="size-4" />
        Proposal Personalization
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-lime-300 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-lime-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-lime-300 disabled:opacity-50"
        >
          {loading ? "Personalizing..." : "Generate Personalized Proposal"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Analyzes brand tone, pain points, marketing maturity, and suggests personalized services.
      </p>
    </form>
  );
}

export default { DataEnrichmentComponent, ContactExtractorComponent, ProposalPersonalizerComponent };
