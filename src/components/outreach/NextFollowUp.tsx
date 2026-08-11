"use client";

import type { BranchingState, OutreachStep } from "@/lib/outreach/branching";
import { FOLLOW_UP_TEMPLATES } from "@/lib/outreach/branching";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface NextFollowUpProps {
  state: BranchingState;
  businessName: string;
  onSendNext: () => void;
}

export default function NextFollowUp({ state, businessName, onSendNext }: NextFollowUpProps) {
  const template = FOLLOW_UP_TEMPLATES[state.currentStep];
  const isResponded = state.responded;
  const isClosed = state.currentStep === "closed";

  if (isResponded) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.05] p-5">
        <div className="flex items-center gap-3 text-emerald-300">
          <CheckCircle2 className="size-5" />
          <div>
            <div className="font-black">Campaña en pausa</div>
            <div className="text-sm text-emerald-400/80">El prospecto respondió. Se detuvo la secuencia automática.</div>
          </div>
        </div>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
        <div className="flex items-center gap-3 text-slate-400">
          <XCircle className="size-5" />
          <div>
            <div className="font-black">Campaña cerrada</div>
            <div className="text-sm">Se enviaron los 5 emails sin respuesta.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-orange-400/20 bg-[#0a1220] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[.14em] text-orange-300">Próximo paso</div>
          <div className="font-black text-xl text-white">{template.subject.replace("{{businessName}}", businessName)}</div>
        </div>
        <div className="flex items-center gap-2 text-orange-300">
          <Clock className="size-4" />
          <span className="text-sm font-bold">En {template.daysToWait} días</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[.07] bg-black/30 p-4 text-sm text-slate-300 whitespace-pre-line mb-5">
        {template.body.replace(/{{businessName}}/g, businessName).replace(/{{contactName}}/g, "contacto")}
      </div>

      <button
        onClick={onSendNext}
        className="w-full rounded-2xl bg-orange-400 py-3 text-sm font-black text-black hover:bg-orange-300 transition"
      >
        Enviar {state.currentStep.replace("_", " ")}
      </button>
    </div>
  );
}
