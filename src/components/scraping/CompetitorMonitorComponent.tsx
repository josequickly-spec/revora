"use client";

import { useState } from "react";
import { Zap, AlertCircle, Plus, X } from "lucide-react";
import ScrapingJobMonitor from "./ScrapingJobMonitor";

interface CompetitorMonitorProps {
  onResults?: (results: any) => void;
}

export default function CompetitorMonitorComponent({ onResults }: CompetitorMonitorProps) {
  const [competitors, setCompetitors] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const addCompetitor = () => setCompetitors([...competitors, ""]);
  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validCompetitors = competitors.filter((c) => c.trim());
    if (validCompetitors.length < 2) {
      setError("Add at least 2 competitor URLs");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "competitor-monitoring",
          params: { competitors: validCompetitors },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start monitoring");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start monitoring");
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
            onClick={() => { setJobId(null); setCompleted(false); setCompetitors(["", ""]); }}
            className="w-full rounded-lg border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/[.07] hover:text-white"
          >
            Compare Other Competitors
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleMonitor} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-orange-300">
        <Zap className="size-4" />
        Competitor Analysis
      </div>

      <div className="space-y-3">
        {competitors.map((competitor, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={competitor}
              onChange={(e) => {
                const newCompetitors = [...competitors];
                newCompetitors[index] = e.target.value;
                setCompetitors(newCompetitors);
              }}
              placeholder="https://competitor.com"
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-300 focus:outline-none"
            />
            {competitors.length > 2 && (
              <button
                type="button"
                onClick={() => removeCompetitor(index)}
                className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addCompetitor}
          className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white"
        >
          <Plus className="size-4 inline mr-1" />
          Add Competitor
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-orange-300 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Competitors"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Analyzes pricing, features, positioning, and market presence. Identifies gaps and opportunities.
      </p>
    </form>
  );
}
