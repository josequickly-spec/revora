"use client";

import type { BranchingState } from "@/lib/outreach/branching";

interface CampaignPipelineProps {
  businesses: Array<{
    id: number;
    name: string;
    status: string;
    branching?: BranchingState;
  }>;
}

export default function CampaignPipeline({ businesses }: CampaignPipelineProps) {
  const getStepColor = (step: string) => {
    if (step === "responded") return "bg-emerald-500";
    if (step === "closed") return "bg-slate-600";
    return "bg-orange-500";
  };

  return (
    <div className="rounded-3xl border border-white/[.07] bg-white/[.02] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xs font-black uppercase tracking-[.14em] text-cyan-300">CRM Pipeline</div>
          <h3 className="font-black text-xl text-white">Active Outreach Campaigns</h3>
        </div>
        <span className="text-xs text-slate-500">{businesses.length} businesses</span>
      </div>

      <div className="space-y-3">
        {businesses.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">No active campaigns</div>
        )}

        {businesses.map((biz) => {
          const step = biz.branching?.currentStep || "email_1";
          const responded = biz.branching?.responded;

          return (
            <div key={biz.id} className="flex items-center justify-between rounded-2xl border border-white/[.07] bg-black/20 p-4">
              <div>
                <div className="font-bold text-white">{biz.name}</div>
                <div className="text-xs text-slate-500">{biz.status}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-black text-white ${getStepColor(step)}`}>
                  {responded ? "Responded" : step.replace("_", " ")}
                </div>
                <button className="text-xs font-bold text-orange-300 hover:text-orange-200">View</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
