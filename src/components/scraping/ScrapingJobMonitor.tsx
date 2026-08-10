"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader, Zap, Download } from "lucide-react";
import { downloadJSON, downloadCSV } from "@/lib/scrapling/export-utils";
import { pushToOtom } from "@/lib/scrapling/otom-bridge";
import type { ScrapingJob } from "@/lib/scrapling/scraper-config";

interface ScrapingJobMonitorProps {
  jobId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
  autoClose?: boolean;
}

export default function ScrapingJobMonitor({
  jobId,
  onComplete,
  onError,
  autoClose = true,
}: ScrapingJobMonitorProps) {
  const [job, setJob] = useState<ScrapingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    let notFoundCount = 0;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/scrapling/execute?jobId=${jobId}`);
        const data = await response.json();

        if (data.success && data.job) {
          notFoundCount = 0;
          setJob(data.job);
          setLoading(false);

          if (data.job.status === "completed") {
            onComplete?.(data.job.results);
            if (autoClose) {
              setTimeout(() => setClosed(true), 3000);
            }
          } else if (data.job.status === "failed") {
            onError?.(data.job.error);
          }
        } else {
          notFoundCount++;
          if (notFoundCount >= 3) {
            setLoading(false);
            onError?.("Job not found or expired. Try running again.");
          }
        }
      } catch (error) {
        setLoading(false);
        onError?.(error instanceof Error ? error.message : "Failed to fetch job status");
      }
    };

    fetchJobStatus();
    interval = setInterval(fetchJobStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  if (closed) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-blue-300/20 bg-blue-300/[.07] p-4">
        <div className="flex items-center gap-3">
          <Loader className="size-5 animate-spin text-blue-300" />
          <span className="text-sm text-blue-200">Loading job status...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-xl border border-red-300/20 bg-red-300/[.07] p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-5 text-red-300" />
          <span className="text-sm text-red-200">Job not found</span>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { color: "bg-yellow-300/[.07] border-yellow-300/20", icon: "⏳", text: "Pending" },
    running: { color: "bg-blue-300/[.07] border-blue-300/20", icon: "🔄", text: "Running" },
    completed: {
      color: "bg-green-300/[.07] border-green-300/20",
      icon: "✓",
      text: "Completed",
    },
    failed: { color: "bg-red-300/[.07] border-red-300/20", icon: "✗", text: "Failed" },
  };

  const config = statusConfig[job.status];

  return (
    <div className={`rounded-xl border p-4 ${config.color}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {job.status === "running" ? (
              <Loader className="size-5 animate-spin text-blue-300" />
            ) : job.status === "completed" ? (
              <CheckCircle2 className="size-5 text-green-300" />
            ) : (
              <AlertCircle className="size-5 text-red-300" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {job.type}
              </p>
              <p className="font-semibold text-white">{config.text}</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">{job.progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full bg-gradient-to-r from-cyan-300 to-blue-300 transition-all duration-300"
            style={{ width: `${job.progress}%` }}
          />
        </div>

        {/* Error message */}
        {job.error && (
          <p className="text-xs text-red-200">
            <strong>Error:</strong> {job.error}
          </p>
        )}

        {/* Results summary */}
        {job.results && (
          <div className="mt-3 space-y-2">
            <button
              onClick={() => pushToOtom(job.type, job.results)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition hover:from-amber-400 hover:to-orange-400"
            >
              <Zap className="size-3.5" />
              Generate OTOM Plan with AI
            </button>
            <div className="rounded-lg bg-black/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-300">Results:</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => downloadJSON(job.results, `${job.type}-${job.id}`)}
                    className="flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/[.07] px-2 py-1 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/[.15]"
                  >
                    <Download className="size-3" />
                    JSON
                  </button>
                  <button
                    onClick={() => downloadCSV(job.results, `${job.type}-${job.id}`)}
                    className="flex items-center gap-1 rounded-md border border-green-400/20 bg-green-400/[.07] px-2 py-1 text-[10px] font-bold text-green-300 transition hover:bg-green-400/[.15]"
                  >
                    <Download className="size-3" />
                    CSV
                  </button>
                </div>
              </div>
              <pre className="text-xs text-slate-300 overflow-auto max-h-48">
                {JSON.stringify(job.results, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex gap-4 text-[10px] text-slate-400">
          <span>Created: {new Date(job.createdAt).toLocaleTimeString()}</span>
          {job.completedAt && (
            <span>Completed: {new Date(job.completedAt).toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
