"use client";

import { useState } from "react";
import { Search, Zap, AlertCircle } from "lucide-react";
import ScrapingJobMonitor from "./ScrapingJobMonitor";

interface BusinessDiscoveryScraperProps {
  onResults?: (results: any) => void;
  onBusinessDiscovered?: (business: any) => void;
}

export default function BusinessDiscoveryScraper({
  onResults,
  onBusinessDiscovered,
}: BusinessDiscoveryScraperProps) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!keyword.trim() || !location.trim()) {
      setError("Enter both keyword and location");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "business-discovery",
          params: { keyword, location, limit: parseInt(limit.toString()) },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start scraping");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scraping");
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
            Search Again
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleScrape} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">
        <Zap className="size-4" />
        Business Discovery
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block">
            Keyword
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., restaurant, gym, salon"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Miami, FL"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block">
            Results Limit
          </label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Math.min(200, Math.max(1, parseInt(e.target.value))))}
            min="1"
            max="200"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-cyan-300 focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
          >
            {loading ? "Starting..." : "Scrape Businesses"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Scrapes from Google Maps, Yelp, BBB, and industry directories. Extracts contact
        information, addresses, and social media links.
      </p>
    </form>
  );
}
