"use client";

import { useState } from "react";
import ApprovalGate from "@/components/outreach/ApprovalGate";
import type { SelectedInsight } from "@/lib/outreach/insights";

interface LegacyOutreachWithApprovalProps {
  businessId: number;
  businessName: string;
  selectedContact?: { name: string; role: string; email: string };
  onInsightsApproved: (insights: SelectedInsight[]) => void;
  onGenerateEmail: (insights: SelectedInsight[]) => void;
}

export default function LegacyOutreachWithApproval({
  businessId,
  businessName,
  selectedContact,
  onInsightsApproved,
  onGenerateEmail,
}: LegacyOutreachWithApprovalProps) {
  const [insights, setInsights] = useState<SelectedInsight[]>([
    {
      title: "Captación",
      observation: "Visitantes que abandonan sin dejar contacto tienen poca continuidad.",
      evidence: "No se detectó captura de email en navegación principal ni en páginas de producto.",
    },
    {
      title: "Descubrimiento de productos",
      observation: "Oportunidad de conectar productos principales con recomendaciones relevantes.",
      evidence: "Cross-sell y upsell aparecen tarde en el recorrido o de forma poco visible.",
    },
  ]);

  const handleApprove = (approvedInsights: SelectedInsight[]) => {
    setInsights(approvedInsights);
    onInsightsApproved(approvedInsights);
    onGenerateEmail(approvedInsights);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-5">
        <div className="text-xs font-black uppercase tracking-[.14em] text-orange-300 mb-1">Step 4 · Outreach</div>
        <h3 className="font-black text-xl text-white">Email + Loom for {businessName}</h3>
        {selectedContact && (
          <p className="text-sm text-slate-400 mt-1">
            To: {selectedContact.name} ({selectedContact.role}) — {selectedContact.email}
          </p>
        )}
      </div>

      <ApprovalGate
        businessId={businessId}
        businessName={businessName}
        generatedInsights={insights}
        onApprove={handleApprove}
        onEdit={(newInsights) => setInsights(newInsights)}
      />

      <div className="text-xs text-slate-500">
        These 2 insights will be used consistently in the email and the 90-second Loom video.
      </div>
    </div>
  );
}
