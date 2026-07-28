"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, Sparkles, CheckCircle2, Flame, ArrowRight, Gift, Lock, Heart, ChevronRight } from "lucide-react";

const INDUSTRY_ICONS: Record<string,string> = { general:"🏢", ecommerce:"🛒", restaurant:"🍽️", gym:"💪", professional:"👨‍💼", healthcare:"🏥", saas:"💻", realestate:"🏠", coaching:"🎓", agency:"🚀" };

export default function PublicFunnelPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<any>(null);
  const [biz, setBiz] = useState<any>(null);
  const [bonusAdded, setBonusAdded] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/funnels?slug=${encodeURIComponent(slug || "")}`);
        const j = await r.json();
        if (j.success) { setFunnel(j.funnel); setBiz(j.business); }
        else setLoadError(j.error || "No se encontró este embudo");
      } catch (e) { console.error(e); setLoadError("No se pudo cargar el embudo"); }
      finally { setLoading(false); }
    })();
  }, [slug]);


  const submitLead = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    const response = await fetch("/api/funnel-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnelId: funnel?.id, name: leadName, email: leadEmail, phone: leadPhone, consent }),
    });
    const data = await response.json();
    if (!response.ok) {
      setSubmitError(data.error || "No se pudo registrar tu solicitud");
      return;
    }
    setCompleted(true);
  };

  const name = biz?.name || "Negocio";
  const offer = biz?.heroOffer || "Oferta Especial";
  const price = biz?.heroPrice || "Gratis";
  const color = funnel?.customPrimaryColor || biz?.brandColor || "#6366F1";
  const type = biz?.businessType || "general";
  const icon = INDUSTRY_ICONS[type] || "🏢";
  const content = funnel?.contentJson;

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4" />
      <p className="text-slate-300 font-medium">Cargando embudo universal...</p>
    </div>
  );

  if (loadError || !funnel || !biz) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
      <h1 className="text-2xl font-black">Embudo no disponible</h1>
      <p className="text-slate-400 mt-2">{loadError || "No se encontraron datos para este enlace."}</p>
      <Link href="/" className="mt-5 bg-emerald-600 px-5 py-3 rounded-xl font-bold">Volver a la aplicación</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Flash Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600 text-white text-xs md:text-sm font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-lg">
        <Flame className="w-4 h-4 text-yellow-300 animate-bounce" /><span>{funnel?.offerBadge || "¡OFERTA ESPECIAL!"}</span>
        <span className="bg-black/30 px-2 py-0.5 rounded text-yellow-200">Oferta publicada por el negocio</span>
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
          <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-slate-300">
            Visitas registradas: {funnel?.viewCount || 0}
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
                  <div className="bg-black/40 backdrop-blur rounded-lg p-2 text-center text-xs font-semibold text-emerald-300">Solicita información sin compromiso</div>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300">
              Esta página no publica reseñas, puntuaciones ni disponibilidad inventadas. Confirma los detalles directamente con {name}.
            </div>
          </div>

          {/* Right: Funnel Offer */}
          <div className="lg:col-span-6 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />{content?.eyebrow || funnel?.offerBadge || "INFORMACIÓN DEL SERVICIO"}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">{funnel?.headline || `${offer} — Oferta Especial`}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{funnel?.subheadline || `Oportunidad única en ${name}.`}</p>
            </div>

            {/* Price */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Precio Oferta</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-white">{/^\d+(?:[.,]\d+)?$/.test(price) ? `${price}€` : price}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Disponibilidad</span>
                <span className="text-sm font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-1 rounded inline-block mt-1">Consulta disponible</span>
              </div>
            </div>

            {/* Bonus */}
            <div onClick={() => setBonusAdded(!bonusAdded)} className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${bonusAdded ? "border-amber-500 bg-amber-950/20 shadow-lg" : "border-slate-700/80 bg-slate-900/40 hover:border-slate-600"}`}>
              <input type="checkbox" checked={bonusAdded} onChange={() => {}} className="mt-1 w-4 h-4 rounded accent-amber-500" />
              <div className="flex-1">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> ¡SÍ! AÑADIR BONUS EXCLUSIVO
                </span>
                <p className="text-[11px] text-slate-300 mt-1">{content?.leadMagnet?.deliveryPromise || funnel?.bonusOffer || "Beneficio adicional exclusivo para esta oferta."}</p>
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
                <form onSubmit={submitLead} className="space-y-3">
                  <input required value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Nombre" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3" />
                  <input required type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3" />
                  <input value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="Teléfono (opcional)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3" />
                  <label className="flex items-start gap-2 text-xs text-slate-300">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
                    Acepto que {name} me contacte sobre esta solicitud.
                  </label>
                  {submitError && <p className="text-xs text-red-400">{submitError}</p>}
                  <button type="submit" className="w-full py-4 px-6 rounded-xl font-black text-white text-base tracking-wide shadow-xl flex items-center justify-center gap-3 transition hover:opacity-95" style={{ backgroundColor: color, boxShadow: `0 10px 25px -5px ${color}66` }}>
                    <span>{funnel?.ctaText || "SOLICITAR INFORMACIÓN"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> 100% Seguro</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-indigo-400" /> Datos protegidos</span>
              </div>
            </div>
          </div>
        </div>
        {content && (
          <section className="mt-12 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <article className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-400">El reto</p>
                <h3 className="text-xl font-black mt-2">{content.painPoint}</h3>
                <p className="text-slate-300 mt-3 leading-relaxed">{content.agitationCopy}</p>
              </article>
              <article className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">La solución</p>
                <h3 className="text-xl font-black mt-2">{content.offer}</h3>
                <p className="text-slate-300 mt-3 leading-relaxed">{content.solutionCopy}</p>
              </article>
            </div>
            {(Array.isArray(content.fascinationBullets) || Array.isArray(content.benefits)) && (
              <div>
                <h3 className="text-2xl font-black text-center mb-2">{content.leadMagnet?.name || "Qué vas a descubrir"}</h3>
                <p className="text-slate-400 text-center mb-5">{content.leadMagnet?.format}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(content.fascinationBullets || content.benefits).map((benefit: string) => (
                    <div key={benefit} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/><span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(content.processSteps) && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 text-center">Cómo funciona</p>
                <h3 className="text-2xl font-black text-center mt-2 mb-5">Un proceso claro, paso a paso</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {content.processSteps.map((step: {title:string;description:string}, index: number) => (
                    <article key={`${step.title}-${index}`} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                      <span className="w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-black text-white" style={{backgroundColor: color}}>{index + 1}</span>
                      <h4 className="font-black text-lg mt-4">{step.title}</h4>
                      <p className="text-sm text-slate-300 mt-2 leading-relaxed">{step.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-xl font-black">Un siguiente paso transparente</h3>
              <p className="text-slate-300 mt-2">{content.proofCopy}</p>
              {Array.isArray(content.trustPoints) && (
                <ul className="grid sm:grid-cols-3 gap-3 mt-5">
                  {content.trustPoints.map((point: string) => (
                    <li key={point} className="bg-slate-900 rounded-xl p-3 flex gap-2 text-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>{point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {Array.isArray(content.objections) && (
              <div>
                <h3 className="text-2xl font-black text-center mb-5">Preguntas frecuentes</h3>
                <div className="space-y-3">
                  {content.objections.map((item: {question:string;answer:string}) => (
                    <article key={item.question} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                      <h4 className="font-bold">{item.question}</h4>
                      <p className="text-sm text-slate-300 mt-2">{item.answer}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
