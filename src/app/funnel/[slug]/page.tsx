"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, Sparkles, Clock, CheckCircle2, Star, Flame, ArrowRight, Gift, Lock, Heart, ChevronRight } from "lucide-react";

const INDUSTRY_ICONS: Record<string,string> = { ecommerce:"🛒", restaurant:"🍽️", gym:"💪", professional:"👨‍💼", healthcare:"🏥", saas:"💻", realestate:"🏠", coaching:"🎓", agency:"🚀" };

export default function PublicFunnelPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<any>(null);
  const [biz, setBiz] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(899);
  const [bonusAdded, setBonusAdded] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/funnels?slug=${encodeURIComponent(slug || "")}`);
        const j = await r.json();
        if (j.success) { setFunnel(j.funnel); setBiz(j.business); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  useEffect(() => { const t = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000); return () => clearInterval(t); }, []);
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const name = biz?.name || "Negocio";
  const offer = biz?.heroOffer || "Oferta Especial";
  const price = biz?.heroPrice || "Gratis";
  const color = funnel?.customPrimaryColor || biz?.brandColor || "#6366F1";
  const type = biz?.businessType || "ecommerce";
  const icon = INDUSTRY_ICONS[type] || "🏢";

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4" />
      <p className="text-slate-300 font-medium">Cargando embudo universal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Flash Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 text-white text-xs md:text-sm font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg">
        <Flame className="w-4 h-4 text-yellow-300 animate-bounce" /><span>{funnel?.offerBadge || "¡OFERTA ESPECIAL!"}</span>
        <span className="bg-black/30 px-2 py-0.5 rounded text-yellow-200 font-mono">Finaliza en {fmt(timeLeft)}</span>
      </div>

      {/* Agency Tag */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Embudo por Revora</span>
          <span className="hidden sm:inline text-slate-400">Diseñado para <strong className="text-white">{name}</strong></span>
        </div>
        <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition">Volver a la App <ChevronRight className="w-3.5 h-3.5" /></Link>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md" style={{ backgroundColor: color }}>{name.charAt(0)}</div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">{name}</h1>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {icon} Negocio Verificado • {biz?.niche}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-full">
            <Star className="w-3.5 h-3.5 fill-amber-400" /><span>4.9 / 5.0 (2,490+)</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Visual */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-800 shadow-2xl group">
              <div className="absolute top-4 left-4 z-10 bg-rose-600 text-white text-xs font-black uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-white" />OFERTA ESPECIAL
              </div>
              <div className="absolute top-4 right-4 z-10 bg-slate-950/80 backdrop-blur text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Disponible — {biz?.country}
              </div>
              <div className="h-80 sm:h-96 w-full bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-800 flex items-center justify-center p-8">
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl p-6 flex flex-col justify-between shadow-2xl border border-white/20 transform group-hover:scale-105 transition duration-500" style={{ background: `linear-gradient(135deg, ${color}dd 0%, #1e1b4b 100%)` }}>
                  <div className="flex justify-between items-center text-white/90">
                    <span className="text-xs font-bold tracking-wider uppercase">{name}</span>
                    <Heart className="w-5 h-5 text-rose-300 fill-rose-300" />
                  </div>
                  <div className="text-center my-auto">
                    <span className="text-5xl block mb-2">{icon}</span>
                    <p className="text-white font-black text-lg leading-tight drop-shadow">{offer}</p>
                    <p className="text-white/70 text-xs mt-1">{biz?.niche}</p>
                  </div>
                  <div className="bg-black/40 backdrop-blur rounded-lg p-2 text-center text-xs font-semibold text-emerald-300">Garantía Total</div>
                </div>
              </div>
            </div>
            {/* Testimonial */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                <span className="text-xs font-semibold text-slate-300">Reseñas Verificadas:</span>
                <span className="text-xs text-emerald-400 font-bold">100% Auténtico</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">SC</div>
                <div>
                  <p className="font-semibold text-white">Sara C. — <span className="text-slate-400 font-normal">{biz?.country}</span></p>
                  <p className="italic">&ldquo;Increíble experiencia con {name}. {offer} superó mis expectativas. 100% recomendado.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Funnel Offer */}
          <div className="lg:col-span-6 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />{funnel?.offerBadge || "OFERTA EXCLUSIVA"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">{funnel?.headline || `${offer} — Oferta Especial`}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{funnel?.subheadline || `Oportunidad única en ${name}.`}</p>
            </div>

            {/* Price */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Precio Oferta</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-white">{price.includes("/") ? price : `${price}€`}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Disponibilidad</span>
                <span className="text-sm font-bold text-rose-400 bg-rose-950/60 border border-rose-900 px-2 py-1 rounded inline-block mt-1 animate-pulse">Plazas Limitadas</span>
              </div>
            </div>

            {/* Bonus */}
            <div onClick={() => setBonusAdded(!bonusAdded)} className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${bonusAdded ? "border-amber-500 bg-amber-950/20 shadow-lg" : "border-slate-700/80 bg-slate-900/40 hover:border-slate-600"}`}>
              <input type="checkbox" checked={bonusAdded} onChange={() => {}} className="mt-1 w-4 h-4 rounded accent-amber-500" />
              <div className="flex-1">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> ¡SÍ! AÑADIR BONUS EXCLUSIVO
                </span>
                <p className="text-[11px] text-slate-300 mt-1">{funnel?.bonusOffer || "Beneficio adicional exclusivo para esta oferta."}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              {completed ? (
                <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-200 p-4 rounded-xl text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="font-bold text-sm">¡Acción Completada!</p>
                  <p className="text-xs text-slate-300">Así es como este embudo convierte visitantes en clientes.</p>
                </div>
              ) : (
                <button onClick={() => setCompleted(true)} className="w-full py-4 px-6 rounded-xl font-black text-white text-base tracking-wide shadow-xl flex items-center justify-center gap-3 transition transform active:scale-95 hover:opacity-95" style={{ backgroundColor: color, boxShadow: `0 10px 25px -5px ${color}66` }}>
                  <span>{funnel?.ctaText || "RESERVAR AHORA"}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> 100% Seguro</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-indigo-400" /> Garantía Total</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
