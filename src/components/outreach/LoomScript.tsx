"use client";

import type { SelectedInsight } from "@/lib/outreach/insights";

interface LoomScriptProps {
  businessName: string;
  contactName?: string;
  insights: SelectedInsight[];
}

export default function LoomScript({ businessName, contactName, insights }: LoomScriptProps) {
  const segments = [
    {
      time: "0-15s",
      label: "Introducción",
      copy: `Hola ${contactName || "equipo de " + businessName}. Gracias por responder. Te muestro rápidamente lo que encontré revisando ${businessName}.`,
    },
    {
      time: "15-35s",
      label: insights[0]?.title || "Insight 1",
      copy: insights[0]?.observation || "Primera oportunidad detectada durante el análisis.",
    },
    {
      time: "35-55s",
      label: insights[1]?.title || "Insight 2",
      copy: insights[1]?.observation || "Segunda oportunidad detectada durante el análisis.",
    },
    {
      time: "55-75s",
      label: "Propuesta",
      copy: `A partir de estos dos puntos preparé una propuesta conceptual que muestra cómo podría resolverse. Te la comparto a continuación.`,
    },
    {
      time: "75-90s",
      label: "CTA",
      copy: "Si crees que puede tener sentido, podemos revisar las ideas juntos durante 15 minutos.",
    },
  ];

  return (
    <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-400/[.06] via-white/[.02] to-black/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[.14em] text-violet-300">90-second Loom</div>
          <h4 className="font-black text-white">Script personalizado</h4>
        </div>
        <span className="rounded-full border border-violet-300/20 bg-violet-300/[.07] px-3 py-1 text-[10px] font-black text-violet-200">90s</span>
      </div>

      <div className="space-y-4">
        {segments.map((seg, index) => (
          <div key={index} className="flex gap-4 rounded-2xl border border-white/[.07] bg-black/30 p-4">
            <div className="w-16 shrink-0 text-[10px] font-black uppercase tracking-wider text-violet-300 pt-1">{seg.time}</div>
            <div className="flex-1">
              <div className="font-bold text-sm text-white mb-1">{seg.label}</div>
              <div className="text-sm text-slate-300 leading-relaxed">{seg.copy}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 text-xs text-slate-500">
        Este script utiliza exactamente los mismos 2 insights que aparecerán en el email.
      </div>
    </div>
  );
}
