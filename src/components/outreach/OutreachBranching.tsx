"use client";

import { useState } from "react";
import NextFollowUp from "@/components/outreach/NextFollowUp";
import type { BranchingState } from "@/lib/outreach/branching";

interface OutreachBranchingProps {
  businessId: number;
  businessName: string;
  initialState?: BranchingState;
}

export default function OutreachBranching({ 
  businessId, 
  businessName, 
  initialState 
}: OutreachBranchingProps) {
  const [state, setState] = useState<BranchingState>(
    initialState || {
      businessId,
      currentStep: "email_1",
      responded: false,
      lastSentAt: new Date().toISOString(),
    }
  );

  const handleSendNext = () => {
    // In real implementation, this would call the API to send the email
    console.log("Sending follow-up:", state.currentStep);
    
    // Simulate moving to next step
    const nextStep = state.currentStep === "email_1" ? "email_2" : 
                    state.currentStep === "email_2" ? "email_3" :
                    state.currentStep === "email_3" ? "email_4" :
                    state.currentStep === "email_4" ? "email_5" : "closed";

    setState(prev => ({
      ...prev,
      currentStep: nextStep as any,
      lastSentAt: new Date().toISOString(),
    }));
  };

  const handleResponded = () => {
    setState(prev => ({ ...prev, responded: true }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[.14em] text-orange-300">Outreach Flow</div>
          <h3 className="font-black text-2xl text-white">Follow-up Sequence</h3>
        </div>
        <button
          onClick={handleResponded}
          className="rounded-xl border border-emerald-400/30 px-4 py-2 text-sm font-bold text-emerald-300 hover:bg-emerald-400/[.05]"
        >
          Marcar como respondido
        </button>
      </div>

      <NextFollowUp 
        state={state} 
        businessName={businessName} 
        onSendNext={handleSendNext} 
      />

      <div className="text-xs text-slate-500">
        Current step: <span className="font-mono text-orange-300">{state.currentStep}</span>
      </div>
    </div>
  );
}
