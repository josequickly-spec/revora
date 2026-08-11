"use client";

import { calculateOpportunityScore, type OpportunityScoreInput } from "@/lib/opportunity/score";

interface OpportunityScoreBadgeProps {
  input: OpportunityScoreInput;
  showDetails?: boolean;
}

export default function OpportunityScoreBadge({ input, showDetails = false }: OpportunityScoreBadgeProps) {
  const result = calculateOpportunityScore(input);

  const getColor = (priority: string) => {
    if (priority === "A") return "bg-emerald-500 text-white";
    if (priority === "B") return "bg-lime-500 text-black";
    if (priority === "C") return "bg-amber-500 text-black";
    return "bg-slate-600 text-white";
  };

  return (
    <div className="rounded-2xl border border-white/[.08] bg-black/20 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[.14em] text-slate-500">Opportunity Score</div>
          <div className="text-3xl font-black text-white mt-1">{result.score}<span className="text-base align-super">/100</span></div>
        </div>
        <div className={`px-4 py-1 rounded-full text-sm font-black ${getColor(result.priority)}`}>
          Priority {result.priority}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="text-slate-400">{result.recommendation}</div>
          <ul className="text-xs text-slate-500 space-y-1">
            {result.reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
