"use client";
import React, { useState } from "react";
import { Sparkles, AlertCircle, Loader, Copy, Check } from "lucide-react";

interface GeneratedFunnelContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  offer: string;
  offerBadge: string;
  bonusOffer: string;
  painPoint: string;
  agitationCopy: string;
  solutionCopy: string;
  proofCopy: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function FunnelGenerator({
  businessName,
  businessId,
  industryType,
  niche,
  painPoint,
}: {
  businessName: string;
  businessId?: number;
  industryType: string;
  niche: string;
  painPoint: string;
}) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedFunnelContent | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [languageMode, setLanguageMode] = useState<"es" | "en" | "bilingual">("bilingual");

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/funnels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          businessName,
          industryType,
          niche,
          painPoint,
          languageMode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setGenerated(data.generatedContent);
      } else {
        setError(data.error || "Error generando embudo");
      }
    } catch (err) {
      setError("Error conectando a la API");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!generated) {
    return (
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/40 rounded-2xl p-8 shadow-xl space-y-4">
        <div className="flex items-start gap-4">
          <Sparkles className="w-8 h-8 text-indigo-400 shrink-0" />
          <div className="flex-1">
            <h3 className="text-2xl font-black text-white mb-1">Generar Embudo con IA</h3>
            <p className="text-sm text-slate-300">
              Claude generará automaticamente titulares, copias y colores optimizados
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar Embudo Completo
            </>
          )}
        </button>

        <select
          value={languageMode}
          onChange={(e) => setLanguageMode(e.target.value as "es" | "en" | "bilingual")}
          className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
        >
          <option value="bilingual">Bilingüe — Español + English</option>
          <option value="es">Solo español</option>
          <option value="en">English only</option>
        </select>

        {error && (
          <div className="bg-red-950/60 border border-red-700/80 rounded-xl p-3 flex gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-white">Titular Principal</h3>
          <button
            onClick={() => copy(generated.headline)}
            className="text-slate-400 hover:text-slate-200"
          >
            {copied === generated.headline ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-2xl font-bold text-indigo-400">{generated.headline}</p>
        <p className="text-sm text-slate-300">{generated.subheadline}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-2xl p-4">
          <p className="text-xs text-emerald-300 font-semibold">OFERTA</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{generated.offer}</p>
        </div>
        <div className="bg-purple-950/60 border border-purple-700/80 rounded-2xl p-4">
          <p className="text-xs text-purple-300 font-semibold">BOTON CTA</p>
          <p className="text-lg font-bold text-purple-400 mt-1">{generated.ctaText}</p>
        </div>
      </div>

      <button
        onClick={() => setGenerated(null)}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
      >
        Generar Otra Version
      </button>
    </div>
  );
}
