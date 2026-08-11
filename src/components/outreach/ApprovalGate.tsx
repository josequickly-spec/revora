"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { SelectedInsight } from "@/lib/outreach/insights";

interface OutreachApprovalGateProps {
  businessId: number;
  businessName: string;
  generatedInsights: SelectedInsight[];
  onApprove: (insights: SelectedInsight[]) => void;
  onEdit?: (insights: SelectedInsight[]) => void;
}

export default function OutreachApprovalGate({
  businessId,
  businessName,
  generatedInsights,
  onApprove,
  onEdit,
}: OutreachApprovalGateProps) {
  const [insights, setInsights] = useState<SelectedInsight[]>(generatedInsights);
  const [approved, setApproved] = useState(false);

  const handleApprove = () => {
    setApproved(true);
    onApprove(insights);
  };

  return (
    <div className="rounded-3xl border border-orange-400/20 bg-[#0a1220] p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="size-5 text-orange-400" />
        <div>
          <h3 className="font-black text-white">Approval Gate — Outreach</h3>
          <p className="text-xs text-slate-400">Review the 2 insights before generating the email for {businessName}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {insights.map((insight, index) => (
          <div key={index} className="rounded-2xl border border-white/[.08] bg-black/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[.14em] text-orange-300">Insight {index + 1}</span>
            </div>
            <div className="font-bold text-white mb-1">{insight.title}</div>
            <div className="text-sm text-slate-300 mb-2">{insight.observation}</div>
            <div className="text-[10px] text-slate-500">Evidence: {insight.evidence}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {onEdit && (
          <button
            onClick={() => onEdit(insights)}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/[.04]"
          >
            Edit Insights
          </button>
        )}
        <button
          onClick={handleApprove}
          disabled={approved}
          className="flex-1 rounded-xl bg-orange-400 px-4 py-3 text-sm font-black text-black disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {approved ? (
            <>Approved <CheckCircle2 className="size-4" /></>
          ) : (
            "Approve & Generate Email"
          )}
        </button>
      </div>

      {approved && (
        <div className="mt-4 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="size-4" /> These 2 insights will be used in Email + Loom for consistency.
        </div>
      )}
    </div>
  );
}
