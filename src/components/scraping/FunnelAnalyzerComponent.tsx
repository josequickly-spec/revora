"use client";

import { useState } from "react";
import { Eye, Zap, AlertCircle } from "lucide-react";
import ScrapingJobMonitor from "./ScrapingJobMonitor";

interface FunnelAnalyzerComponentProps {
  defaultUrl?: string;
  businessId?: number;
  onResults?: (results: any) => void;
}

export default function FunnelAnalyzerComponent({
  defaultUrl = "",
  businessId,
  onResults,
}: FunnelAnalyzerComponentProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "funnel-analysis",
          params: { url, businessId },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start analysis");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
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
            Analyze Another URL
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleAnalyze} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-violet-300">
        <Eye className="size-4" />
        Funnel Deep Analysis
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block">
            Landing Page URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/funnel"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-300 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-violet-300 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Funnel"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Analyzes headlines, CTAs, offers, hero images, and page structure. Identifies
        conversion elements and recommends best practices.
      </p>
    </form>
  );
}
