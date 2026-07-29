"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Globe, Sparkles, Zap, Mail, Video, Calculator, ArrowRight, CheckCircle2, TrendingUp, ExternalLink, Flame, UserCheck, DollarSign, Copy, Send, Layers, Check, RefreshCw, Plus, Clock, Kanban, ShieldCheck, Filter, Target, BarChart3, Percent, Award, Trash2 } from "lucide-react";
import { INDUSTRY_LIST } from "@/lib/industries";
import type { IndustryConfig } from "@/lib/industries";
import { AutoDiscovery } from "@/components/AutoDiscovery";
import { LocalBusinessFinder } from "@/components/LocalBusinessFinder";

interface Business { id: number; name: string; domain: string; country: string; businessType: string; niche: string; monthlyRevenue: number; averageOrderValue?: number; conversionRate?: number; monthlyAdSpend?: number; platform: string; technologyData?: {technologies?: Array<{name:string}>; techSpendUsd?: number | null} | null; logoUrl?: string | null; brandColor?: string | null; brandAccent?: string | null; status: string; heroOffer?: string | null; heroPrice?: string | null; painPoint?: string | null; }
interface Funnel { id: number; businessId: number | null; funnelName: string; templateType: string; headline: string; subheadline: string; ctaText: string; offerBadge: string | null; bonusOffer: string | null; customPrimaryColor: string | null; slug: string; viewCount: number | null; }
interface Contact { id: number; businessId: number | null; name: string; role: string; email: string; linkedinUrl: string | null; confidenceScore: number | null; status: string | null; }

const ICONS: Record<string,string> = { general:"🏢", ecommerce:"🛒", restaurant:"🍽️", gym:"💪", professional:"👨‍💼", healthcare:"🏥", saas:"💻", realestate:"🏠", coaching:"🎓", agency:"🚀" };
const IND_MAP: Record<string,IndustryConfig> = {};
INDUSTRY_LIST.forEach(i => { IND_MAP[i.key] = i; });
function getInd(k: string) { return IND_MAP[k] || IND_MAP.general; }

export default function LegacyWorkspacePage() {
  const [bizs, setBizs] = useState<Business[]>([]);
  const [funs, setFuns] = useState<Funnel[]>([]);
  const [cons, setCons] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"autodiscover"|"discover"|"funnels"|"contacts"|"outreach"|"calculator"|"crm"|"autoanalyze">("autodiscover");
  const [autoCampaigns, setAutoCampaigns] = useState<any[]>([]);
  const [autoInput, setAutoInput] = useState("");
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any|null>(null);
  const [selId, setSelId] = useState<number|null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [autoRun, setAutoRun] = useState(false);
  const [autoStep, setAutoStep] = useState(0);
  const [autoName, setAutoName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [nName, setNName] = useState("");
  const [nDomain, setNDomain] = useState("");
  const [nType, setNType] = useState("general");
  const [nNiche, setNNiche] = useState("");
  const [nRev, setNRev] = useState(10000);
  const [nAov, setNAov] = useState(100);
  const [nConversion, setNConversion] = useState(2);
  const [nAdSpend, setNAdSpend] = useState(1000);
  const [nOffer, setNOffer] = useState("");
  const [nPrice, setNPrice] = useState("");
  const [nContact, setNContact] = useState("");
  const [calcRev, setCalcRev] = useState(15000);
  const [calcLift, setCalcLift] = useState(25);
  const [calcShare, setCalcShare] = useState(25);
  const [copied, setCopied] = useState<string|null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [outreachDraftId, setOutreachDraftId] = useState<number|null>(null);
  const [blueprintError, setBlueprintError] = useState("");
  const [blueprintCampaignId, setBlueprintCampaignId] = useState<string|null>(null);
  const [funnelGenerating, setFunnelGenerating] = useState(false);
  const [funnelError, setFunnelError] = useState("");
  const [deletingFunnels, setDeletingFunnels] = useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [bR, fR, cR] = await Promise.all([fetch("/api/businesses"), fetch("/api/funnels"), fetch("/api/contacts")]);
      const [bJ, fJ, cJ] = await Promise.all([bR.json(), fR.json(), cR.json()]);
      if (bJ.success) {
        setBizs(bJ.businesses);
        if (bJ.businesses.length) setSelId(current => current ?? bJ.businesses[0].id);
      }
      if (fJ.success) setFuns(fJ.funnels);
      if (cJ.success) setCons(cJ.contacts);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchAll(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAll]);

  const sel = bizs.find(b => b.id === selId) || bizs[0];
  const selFun = funs.find(f => f.businessId === sel?.id);
  const selCon = cons.find(c => c.businessId === sel?.id);
  const selInd = sel ? getInd(sel.businessType) : getInd("general");

  const filtered = bizs.filter(b => {
    if (typeFilter !== "all" && b.businessType !== typeFilter) return false;
    if (countryFilter !== "all" && !b.country.toLowerCase().includes(countryFilter.toLowerCase())) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.domain.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const hasActiveFilters = typeFilter !== "all" || countryFilter !== "all" || search.trim() !== "";
  const resetFilters = () => {
    setTypeFilter("all");
    setCountryFilter("all");
    setSearch("");
  };

  const runBlueprint = async (b: Business) => {
    setSelId(b.id); setAutoName(b.name); setAutoRun(true); setAutoStep(1);
    setBlueprintError("");
    try {
      const campaignId = `campaign_${Date.now()}`;
      const generatedResponse = await fetch("/api/campaign-auto-generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          businessName:b.name,website:b.domain,industry:b.businessType,
          monthlyRevenue:b.monthlyRevenue,averageOrderValue:b.averageOrderValue,
          conversionRate:b.conversionRate,monthlyAdSpend:b.monthlyAdSpend
        })
      });
      const generated = await generatedResponse.json();
      if (!generatedResponse.ok || !generated.success) throw new Error(generated.error || "Falló el análisis");
      setAutoStep(2);

      const saved = await fetch("/api/campaigns", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:campaignId,businessName:b.name,status:"ready",...generated.campaign})
      });
      if (!saved.ok) throw new Error("No se pudo guardar la campaña");
      setBlueprintCampaignId(campaignId);
      setAutoStep(3);

      const contact = cons.find(c => c.businessId === b.id);
      if (!contact?.email) throw new Error("No hay un contacto real para este negocio");
      const funnel = funs.find(f => f.businessId === b.id);
      setAutoStep(4);
      const outreachResponse = await fetch("/api/outreach/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          businessId:b.id,contactId:contact.id,campaignId,
          contactName:contact.name,businessName:b.name,recipientEmail:contact.email,
          offerHeadline:b.heroOffer,painPoint:b.painPoint,bonusOffer:funnel?.bonusOffer
        })
      });
      const outreach = await outreachResponse.json();
      if (!outreachResponse.ok || !outreach.success) throw new Error(outreach.error || "Falló el outreach");
      setOutreachDraftId(Number(outreach.outreach.id));

      const proposal = await fetch("/api/revenue-share", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({businessId:b.id,monthlyRevenue:b.monthlyRevenue,expectedLiftPercent:25,commissionPercentage:25})
      });
      if (!proposal.ok) throw new Error("No se pudo guardar la propuesta");
      setAutoStep(5);
      await fetchAll();
    } catch (error) {
      setBlueprintError(error instanceof Error ? error.message : "Falló el Blueprint");
    }
  };

  const sendCurrentOutreach = async () => {
    setEmailError("");
    setEmailSent(false);
    try {
      let draftId = outreachDraftId;
      if (!draftId) {
        if (!selCon?.email) throw new Error("No existe un contacto real para enviar");
        const generated = await fetch("/api/outreach/generate", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            businessId:sel.id,contactId:selCon.id,contactName:selCon.name,
            businessName:sel.name,recipientEmail:selCon.email,
            offerHeadline:sel.heroOffer,painPoint:sel.painPoint,bonusOffer:selFun?.bonusOffer
          })
        });
        const data = await generated.json();
        if (!generated.ok) throw new Error(data.error || "No se pudo crear el borrador");
        draftId = Number(data.outreach.id);
        setOutreachDraftId(draftId);
      }
      const response = await fetch("/api/outreach", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({outreachId:draftId})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo enviar");
      setEmailSent(true);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "No se pudo enviar");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nName) return;
    setFunnelGenerating(true);
    setFunnelError("");
    const ind = getInd(nType);
    try {
      const res = await fetch("/api/businesses", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name:nName, domain:nDomain||`${nName.toLowerCase().replace(/\s+/g,"")}.com`, businessType:nType, niche:nNiche||ind.defaultNiche, monthlyRevenue:nRev, averageOrderValue:nAov, conversionRate:nConversion, monthlyAdSpend:nAdSpend, heroOffer:nOffer||ind.defaultOffer, heroPrice:nPrice||ind.defaultPrice, painPoint:ind.defaultPainPoint, country:countryFilter==="all"?"España":countryFilter, contactName:nContact||"Director" }) });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "No se pudo guardar el negocio");
      const funnelRes = await fetch("/api/funnels/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({businessId:j.business.id,businessName:nName,industryType:nType,niche:nNiche||ind.defaultNiche,painPoint:ind.defaultPainPoint})
      });
      const funnelJson = await funnelRes.json();
      if (!funnelRes.ok || !funnelJson.success) throw new Error(funnelJson.error || "No se pudo generar el embudo");
      setAddOpen(false); setNName(""); setNDomain(""); setNOffer(""); setNPrice(""); setNContact("");
      await fetchAll(); setSelId(Number(j.business.id)); setTab("funnels");
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "No se pudo generar el embudo");
    } finally {
      setFunnelGenerating(false);
    }
  };

  const regenerateFunnel = async () => {
    if (!sel) return;
    setFunnelGenerating(true);
    setFunnelError("");
    try {
      const response = await fetch("/api/funnels/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({businessId:sel.id,businessName:sel.name,industryType:sel.businessType,niche:sel.niche,painPoint:sel.painPoint||selInd.defaultPainPoint})
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo generar el embudo");
      await fetchAll();
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "No se pudo generar el embudo");
    } finally {
      setFunnelGenerating(false);
    }
  };

  const deleteAllFunnels = async () => {
    if (!funs.length || deletingFunnels) return;
    const confirmed = window.confirm(
      `Vas a borrar ${funs.length} embudo(s) y todos sus leads capturados. Los negocios y contactos se conservarán. ¿Deseas continuar?`
    );
    if (!confirmed) return;
    const typed = window.prompt('Para confirmar, escribe exactamente: BORRAR TODOS LOS EMBUDOS');
    if (typed !== "BORRAR TODOS LOS EMBUDOS") {
      setFunnelError("El texto de confirmación no coincide. No se borró nada.");
      return;
    }
    setDeletingFunnels(true);
    setFunnelError("");
    try {
      const response = await fetch("/api/funnels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: typed }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudieron borrar los embudos");
      setFuns([]);
      await fetchAll();
      window.alert(`Se borraron ${data.deletedFunnels} embudo(s) y ${data.deletedLeads} lead(s).`);
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "No se pudieron borrar los embudos");
    } finally {
      setDeletingFunnels(false);
    }
  };

  const deleteSelectedFunnel = async () => {
    if (!selFun || deletingFunnels) return;
    const confirmed = window.confirm(
      `Vas a borrar únicamente "${selFun.funnelName}" y sus leads capturados. El negocio, contactos y auditorías se conservarán. ¿Deseas continuar?`,
    );
    if (!confirmed) return;
    const typed = window.prompt(`Para confirmar, escribe exactamente: BORRAR EMBUDO ${selFun.id}`);
    if (typed !== `BORRAR EMBUDO ${selFun.id}`) {
      setFunnelError("La confirmación no coincide. No se borró nada.");
      return;
    }
    setDeletingFunnels(true);
    setFunnelError("");
    try {
      const response = await fetch("/api/funnels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selFun.id, confirmation: typed }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "No se pudo borrar el embudo");
      setFuns(current => current.filter(funnel => funnel.id !== selFun.id));
      window.alert(`Se borró "${selFun.funnelName}" y ${data.deletedLeads || 0} lead(s).`);
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "No se pudo borrar el embudo");
    } finally {
      setDeletingFunnels(false);
    }
  };

  const copy = (t: string, l: string) => { navigator.clipboard.writeText(t); setCopied(l); setTimeout(() => setCopied(null), 2500); };

  const calcExtra = Math.round(calcRev * (calcLift / 100));
  const calcFee = Math.round(calcExtra * (calcShare / 100));
  const needClients = Math.max(1, Math.ceil(10000 / (calcFee || 1)));

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Status - Universal Revenue Focus */}
      <div className="bg-gradient-to-r from-emerald-900 via-purple-900 to-slate-900 border-b border-emerald-800/60 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
          <span className="font-semibold text-slate-200">Sistema Universal: <strong className="text-emerald-400">Cualquier Negocio · Cualquier Ingreso · Enfocado en Facturación Extra</strong></span>
        </div>
        <span className="bg-emerald-950 border border-emerald-700/60 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">Meta: +10.000€/mes (2-3 Deals)</span>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-purple-600 to-rose-500 flex items-center justify-center shadow-lg"><Target className="w-5 h-5 text-white" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tight text-white">EcoScale Partner</h1>
                <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Commerce Intelligence</span>
              </div>
              <p className="text-xs text-slate-400">Cualquier negocio. Cualquier ingreso. Embudos + Ads que generan facturación extra.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/funnelspy" className="bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 border border-violet-400/30 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5">
              <Search className="w-4 h-4" /><span>FunnelSpy</span>
            </Link>
            <button onClick={() => sel && runBlueprint(sel)} className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95">
              <Zap className="w-4 h-4 fill-white" /><span>Blueprint 1-Click</span>
            </button>
            <button onClick={() => setAddOpen(true)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" /><span className="hidden sm:inline">Añadir Negocio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Industry Selector - ALL INDUSTRIES VISIBLE */}
      <section className="bg-slate-900 border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2"><Filter className="w-3.5 h-3.5 text-emerald-400" /> Selecciona el tipo de negocio:</div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-9 gap-2">
            <button onClick={() => setTypeFilter("all")} className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition ${typeFilter==="all"?"bg-emerald-600 text-white border-emerald-500":"bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600"}`}>🌍 Todos ({bizs.length})</button>
            {INDUSTRY_LIST.map(ind => {
              const c = bizs.filter(b => b.businessType === ind.key).length;
              return <button key={ind.key} onClick={() => setTypeFilter(ind.key)} className={`px-2 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${typeFilter===ind.key?"text-white shadow":"text-slate-300 hover:text-white"}`} style={typeFilter===ind.key?{backgroundColor:ind.color,borderColor:ind.color}:{backgroundColor:"rgba(30,41,59,0.6)",borderColor:"#334155"}}><span>{ind.emoji}</span><span className="hidden sm:inline text-[10px]">{ind.label.split("·")[0].trim()}</span><span className="text-[9px] opacity-70">({c})</span></button>;
            })}
          </div>
        </div>
      </section>

      {/* 7-Step Progress */}
      <section className="bg-slate-950 border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {([
            {k:"autodiscover" as const,n:"0. Auto-Discovery",sub:"Hunter.io",icon:<Zap className="w-3.5 h-3.5 text-purple-400"/>},
            {k:"discover" as const,n:"1. Descubrir",sub:"Cualquier negocio",icon:<Globe className="w-3.5 h-3.5 text-amber-400"/>},
            {k:"funnels" as const,n:"2. Embudo Gratis",sub:"Adaptado al negocio",icon:<Layers className="w-3.5 h-3.5 text-indigo-400"/>},
            {k:"contacts" as const,n:"3. Contacto",sub:"Email del decisor",icon:<UserCheck className="w-3.5 h-3.5 text-emerald-400"/>},
            {k:"outreach" as const,n:"4. Pitch",sub:"Email + Loom 90s",icon:<Mail className="w-3.5 h-3.5 text-rose-400"/>},
            {k:"calculator" as const,n:"5. Rev-Share",sub:"Ads a % beneficio",icon:<Calculator className="w-3.5 h-3.5 text-amber-400"/>},
            {k:"autoanalyze" as const,n:"6. Auto-Analyze",sub:"Análisis 1-click",icon:<Sparkles className="w-3.5 h-3.5 text-cyan-400"/>},
          ]).map(s => (
            <button key={s.k} onClick={() => setTab(s.k)} className={`p-2.5 rounded-xl border text-left transition ${tab===s.k?"bg-indigo-950/60 border-indigo-500 shadow":"bg-slate-900/40 border-slate-800 hover:border-slate-700"}`}>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">{s.icon}{s.n}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </button>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* ===== TAB 0: AUTO-DISCOVER ===== */}
        {tab === "autodiscover" && (
          <AutoDiscovery />
        )}

        {/* ===== TAB 1: DISCOVER ===== */}
        {tab === "discover" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 border border-emerald-800/40 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-black text-white mb-1">Explorador Universal de Negocios</h2>
              <p className="text-sm text-slate-300">Descubre negocios de <strong>cualquier industria, tamaño o ingreso</strong>. Desde autónomos hasta grandes corporaciones. El embudo + ads funciona para todos.</p>
            </div>

            <LocalBusinessFinder onDiscovered={async (businessId) => {
              await fetchAll();
              setSelId(businessId);
              setTab("funnels");
            }} />

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Buscar negocio o dominio..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
                {["all","España","Canadá","Estados Unidos","México","Argentina","Colombia","Chile"].map(c => (
                  <button key={c} onClick={() => setCountryFilter(c)} className={`px-2.5 py-1 rounded-lg font-medium transition ${countryFilter===c?"bg-emerald-600 text-white":"text-slate-400 hover:text-white"}`}>{c==="all"?"🌍 Todos":c}</button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Limpiar búsqueda, país y tipo de negocio"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resetear filtros
              </button>
              <span className="text-xs text-slate-400 ml-auto hidden sm:inline">Mostrando <strong className="text-white">{filtered.length}</strong> negocios</span>
            </div>

            {/* Grid - ANY SIZE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(b => {
                const ind = getInd(b.businessType);
                const isSel = b.id === sel?.id;
                const extra = Math.round(b.monthlyRevenue * (ind.liftPercent / 100));
                const fee = Math.round(extra * 0.25);
                const revLabel = b.monthlyRevenue < 5000 ? "Micro (<5k)" : b.monthlyRevenue < 25000 ? "Pequeño (5k-25k)" : b.monthlyRevenue < 100000 ? "Mediano (25k-100k)" : "Grande (100k+)";
                return (
                  <div key={b.id} className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition group ${isSel?"border-emerald-500 shadow-xl ring-1 ring-emerald-500":"border-slate-800 hover:border-slate-700"}`}>
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md shrink-0" style={{backgroundColor:b.brandColor||ind.color}}>{ind.emoji}</div>
                          <div>
                            <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition">{b.name}</h3>
                            <p className="text-xs text-slate-400 flex items-center gap-1">{b.domain} <ExternalLink className="w-3 h-3"/></p>
                          </div>
                        </div>
                        <span className="bg-slate-800 border border-slate-700 text-[10px] font-bold px-2 py-1 rounded-full text-slate-300">{b.country}</span>
                      </div>
                      <div className="space-y-1.5 py-3 border-y border-slate-800/80 my-3 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Tipo:</span><span className="font-semibold" style={{color:ind.color}}>{ind.label.split("·")[0].trim()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Nicho:</span><span className="text-slate-200 font-medium">{b.niche}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Tecnología:</span><span className="text-cyan-300 font-medium">{b.platform || "Sitio web"}{b.technologyData?.technologies?.length ? ` · ${b.technologyData.technologies.length} señales` : ""}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Facturación:</span><span className="font-bold text-emerald-400">€{b.monthlyRevenue.toLocaleString()}/mes</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Tamaño:</span><span className="text-slate-300 font-mono text-[11px]">{revLabel}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Oferta:</span><span className="text-slate-200 truncate max-w-[170px]">{b.heroOffer}</span></div>
                      </div>
                      <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-2.5 text-xs text-emerald-200 flex items-start gap-2 mb-4">
                        <Flame className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                        <div><strong className="text-white block">{b.painPoint}</strong>
                        <span>Potencial extra: <strong className="text-amber-300">+€{extra.toLocaleString()}/mes</strong> · Tu comisión: <strong className="text-emerald-400">€{fee.toLocaleString()}/mes</strong></span></div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => {setSelId(b.id);setTab("funnels");}} className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400"/>Ver Embudo</button>
                        <button onClick={() => {setSelId(b.id);setTab("contacts");}} className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-400"/>Contacto</button>
                      </div>
                      <button onClick={() => runBlueprint(b)} className="w-full bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2">
                        <Zap className="w-3.5 h-3.5 fill-white"/>Blueprint Completo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TAB 2: FUNNELS ===== */}
        {tab === "funnels" && sel && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6 shadow-xl border" style={{background:`linear-gradient(135deg, ${sel.brandColor||"#6366F1"}22 0%, #0f172a 100%)`,borderColor:`${sel.brandColor||"#6366F1"}44`}}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:sel.brandColor||"#6366F1"}}>{selInd.emoji} Paso 2: Embudo Gratuito Universal</p>
                  <h2 className="text-2xl font-black text-white">Embudo para {sel.name} ({selInd.label.split("·")[0].trim()})</h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">Funciona para <strong>cualquier negocio y cualquier ingreso</strong>. El embudo está adaptado al sector y genera facturación extra inmediata.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selFun && <Link href={`/es/funnel/${selFun.slug}`} target="_blank" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap">
                    <ExternalLink className="w-4 h-4"/>Abrir Embudo en Vivo
                  </Link>}
                  {selFun && <button
                    type="button"
                    onClick={deleteSelectedFunnel}
                    disabled={deletingFunnels}
                    className="bg-red-950 hover:bg-red-900 disabled:opacity-40 border border-red-800 text-red-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4"/>
                    Borrar este embudo
                  </button>}
                  <button
                    type="button"
                    onClick={deleteAllFunnels}
                    disabled={!funs.length || deletingFunnels}
                    className="bg-red-950 hover:bg-red-900 disabled:opacity-40 border border-red-800 text-red-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4"/>
                    {deletingFunnels ? "Borrando..." : `Borrar todos (${funs.length})`}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400"/>Embudo Personalizado</h3>
                  <div><label className="text-xs text-slate-400 font-semibold block mb-1">Negocio:</label>
                    <select value={sel.id} onChange={e => setSelId(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-emerald-500">
                      {bizs.map(b => <option key={b.id} value={b.id}>{getInd(b.businessType).emoji} {b.name} (€{b.monthlyRevenue.toLocaleString()}/mes)</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-slate-400 font-semibold block mb-1">Titular generado:</label>
                    <textarea readOnly rows={2} value={selFun?.headline||selInd.funnelHeadline(sel.name, sel.heroOffer||"")} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3"/>
                  </div>
                  <div><label className="text-xs text-slate-400 font-semibold block mb-1">Oferta generada:</label>
                    <input readOnly type="text" value={selFun?.offerBadge||selInd.funnelBadge} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"/>
                  </div>
                  {funnelError && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-3">{funnelError}</p>}
                  <button onClick={regenerateFunnel} disabled={funnelGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4"/>{funnelGenerating ? "Generando con IA..." : selFun ? "Regenerar Embudo con IA" : "Generar Embudo con IA"}
                  </button>
                  <div className="bg-slate-950 border border-emerald-900/60 rounded-xl p-3.5 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">Enlace Público:</span>
                    <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs">
                      <span className="font-mono text-emerald-400 truncate">/funnel/{selFun?.slug||"funnel"}</span>
                      <button onClick={() => copy(`${typeof window!=="undefined"?window.location.origin:""}/es/funnel/${selFun?.slug}`,"url")} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 flex items-center gap-1">
                        {copied==="url"?<Check className="w-3 h-3"/>:<Copy className="w-3 h-3"/>}{copied==="url"?"Copiado":"Copiar"}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setTab("outreach")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                    Paso 4: Redactar Email <ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="lg:col-span-7">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500"/><span className="h-3 w-3 rounded-full bg-amber-500"/><span className="h-3 w-3 rounded-full bg-emerald-500"/><span className="text-xs text-slate-400 font-mono ml-2">Vista Previa</span></div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase border" style={{color:sel.brandColor||"#6366F1",borderColor:`${sel.brandColor||"#6366F1"}66`,backgroundColor:`${sel.brandColor||"#6366F1"}11`}}>{selInd.emoji} {selInd.label.split("·")[0].trim()}</span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-5">
                    <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-indigo-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg text-center flex items-center justify-center gap-2">
                      <Flame className="w-3.5 h-3.5 animate-pulse"/>{selFun?.offerBadge||selInd.funnelBadge}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:sel.brandColor||"#6366F1"}}>{sel.name.charAt(0)}</div>
                        <span className="font-bold text-white text-sm">{sel.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">{selInd.emoji} Verificado</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-lg text-white leading-tight">{selFun?.headline||selInd.funnelHeadline(sel.name,sel.heroOffer||"")}</h4>
                      <p className="text-xs text-slate-300">{selFun?.subheadline||selInd.funnelSubheadline(sel.name)}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div><span className="text-slate-400 block">Oferta Principal</span><span className="text-lg font-black text-white">{sel.heroOffer}</span></div>
                      <div className="text-right"><span className="text-slate-400 block">Precio</span><span className="font-bold text-emerald-400">{sel.heroPrice}</span></div>
                    </div>
                    {selFun && <Link href={`/es/funnel/${selFun.slug}`} target="_blank" className="w-full py-3 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg" style={{backgroundColor:sel.brandColor||"#6366F1"}}>
                      {selFun.ctaText||selInd.funnelCta} <ArrowRight className="w-4 h-4"/>
                    </Link>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 3: CONTACTS ===== */}
        {tab === "contacts" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-800/40 rounded-2xl p-6 shadow-xl">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">👤 Paso 3: Encontrar al Decisor</p>
              <h2 className="text-2xl font-black text-white">Directorio de Contactos Verificados</h2>
              <p className="text-sm text-slate-300 mt-1">Email del fundador, CEO o responsable de cualquier negocio. Score de verificación superior al 95%.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cons.map(c => {
                const biz = bizs.find(b => b.id === c.businessId);
                const ind = biz ? getInd(biz.businessType) : getInd("general");
                return (
                  <div key={c.id} className={`bg-slate-900/90 border rounded-2xl p-5 space-y-4 transition ${sel?.id===c.businessId?"border-emerald-500 shadow-xl ring-1 ring-emerald-500":"border-slate-800 hover:border-slate-700"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md" style={{backgroundColor:ind.color}}>{c.name.split(" ").map(n=>n[0]).join("")}</div>
                        <div><h3 className="font-bold text-white">{c.name}</h3><p className="text-xs font-semibold" style={{color:ind.color}}>{c.role}</p></div>
                      </div>
                      <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3"/>{c.confidenceScore}%</span>
                    </div>
                    <div className="space-y-1.5 py-3 border-y border-slate-800 text-xs">
                      <div className="flex justify-between"><span className="text-slate-400">Negocio:</span><span className="font-bold text-white">{ind.emoji} {biz?.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Industria:</span><span className="font-semibold" style={{color:ind.color}}>{ind.label.split("·")[0].trim()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="font-mono text-indigo-300 font-semibold">{c.email}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Facturación:</span><span className="font-bold text-emerald-400">€{biz?.monthlyRevenue.toLocaleString()||"0"}/mes</span></div>
                    </div>
                    <button onClick={() => {if(biz)setSelId(biz.id);setTab("outreach");}} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
                      <Mail className="w-3.5 h-3.5"/>Redactar Email
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TAB 4: OUTREACH ===== */}
        {tab === "outreach" && sel && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6 shadow-xl border" style={{background:`linear-gradient(135deg, ${sel.brandColor||"#E11D48"}15 0%, #0f172a 100%)`,borderColor:`${sel.brandColor||"#E11D48"}33`}}>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">✉️ Paso 4: Cold Outreach Universal</p>
              <h2 className="text-2xl font-black text-white">Email + Guión Loom para {sel.name}</h2>
              <p className="text-sm text-slate-300 mt-1">Email hiperpersonalizado + enlace al embudo gratuito. Funciona para <strong>cualquier negocio, cualquier ingreso</strong>.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-white text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-rose-400"/>Email para {selCon?.name?.split(" ")[0]||"Decisor"}</span>
                  <span className="text-xs text-slate-400">Para: <strong className="text-indigo-400">{selCon?.email||`info@${sel.domain}`}</strong></span>
                </div>
                <div><label className="text-xs text-slate-400 font-semibold block mb-1">Asunto:</label>
                  <input type="text" readOnly value={selInd.emailSubject(sel.name)} className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3.5 py-2.5"/>
                </div>
                <div><label className="text-xs text-slate-400 font-semibold block mb-1">Cuerpo:</label>
                  <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                    {selInd.emailBody(sel.name, selCon?.name?.split(" ")[0]||"", sel.heroOffer||selInd.defaultOffer, selFun?.slug||"funnel")}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button onClick={() => copy(selInd.emailBody(sel.name,selCon?.name?.split(" ")[0]||"",sel.heroOffer||"",selFun?.slug||""),"email")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2">
                    {copied==="email"?<Check className="w-3.5 h-3.5 text-emerald-400"/>:<Copy className="w-3.5 h-3.5"/>}{copied==="email"?"¡Copiado!":"Copiar Email"}
                  </button>
                  <button onClick={sendCurrentOutreach} className="bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg flex items-center gap-2">
                    <Send className="w-3.5 h-3.5"/>{emailSent?"¡Enviado!":"Enviar con Resend"}
                  </button>
                </div>
                {emailError && <p className="text-xs text-red-400">{emailError}</p>}
              </div>

              {/* Loom Script */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="font-bold text-white text-sm flex items-center gap-2"><Video className="w-4 h-4 text-purple-400"/>Guión Loom (90s)</span>
                  <span className="bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded">Universal</span>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    {t:"⏱️ 0:00 - 0:15 | Gancho:",c:selInd.loomHook(selCon?.name?.split(" ")[0]||"",sel.name,sel.heroOffer||""),clr:"text-amber-400"},
                    {t:"⏱️ 0:15 - 0:45 | Demo:",c:selInd.loomDemo(sel.name),clr:"text-indigo-400"},
                    {t:"⏱️ 0:45 - 1:15 | Oferta:",c:selInd.loomOffer(),clr:"text-emerald-400"},
                    {t:"⏱️ 1:15 - 1:30 | CTA:",c:selInd.loomCta(),clr:"text-rose-400"},
                  ].map((s,i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <span className={`${s.clr} font-bold block mb-1`}>{s.t}</span>
                      <p className="text-slate-300">{s.c}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab("calculator")} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2">
                  Paso 5: Calculadora <ArrowRight className="w-4 h-4 text-amber-400"/>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 5: CALCULATOR ===== */}
        {tab === "calculator" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 border border-amber-800/40 rounded-2xl p-6 shadow-xl">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">🚀 Paso 5: Modelo Rev-Share Universal</p>
              <h2 className="text-2xl font-black text-white">Calculadora de Facturación Extra y Comisiones</h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">Funciona para <strong>cualquier negocio y cualquier ingreso</strong>. Tú solo ganas cuando ellos facturan más. Con 2-3 negocios superas 10.000€/mes.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                <h3 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3"><DollarSign className="w-4 h-4 text-emerald-400"/>Parámetros del Negocio</h3>

                {/* Industry Presets */}
                <div><span className="text-xs text-slate-400 font-semibold block mb-2">Presets por Industria:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {INDUSTRY_LIST.map(ind => (
                      <button key={ind.key} onClick={() => setCalcLift(ind.liftPercent)} className="bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-xl p-2 text-center text-[10px] font-semibold text-slate-300 transition">
                        <span className="text-lg block">{ind.emoji}</span>{ind.label.split("·")[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-300 font-semibold">Facturación Mensual Actual:</span>
                    <span className="font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">€{calcRev.toLocaleString()}/mes</span>
                  </div>
                  <input type="range" min={1000} max={500000} step={500} value={calcRev} onChange={e => setCalcRev(parseInt(e.target.value))} className="w-full accent-emerald-500"/>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono"><span>1k€</span><span>250k€</span><span>500k€+</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-300 font-semibold">Incremento con Embudo + Ads:</span>
                    <span className="font-black text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-lg">+{calcLift}%</span>
                  </div>
                  <input type="range" min={10} max={60} step={1} value={calcLift} onChange={e => setCalcLift(parseInt(e.target.value))} className="w-full accent-indigo-500"/>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-300 font-semibold">Tu Comisión (%):</span>
                    <span className="font-black text-amber-400 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-lg">{calcShare}%</span>
                  </div>
                  <input type="range" min={15} max={40} step={1} value={calcShare} onChange={e => setCalcShare(parseInt(e.target.value))} className="w-full accent-amber-500"/>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6">
                <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Resultado por Negocio:</span>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                      <span className="text-[11px] text-slate-400 block">Facturación Extra para el Negocio:</span>
                      <span className="text-2xl font-black text-white block mt-1">+€{calcExtra.toLocaleString()}</span>
                      <span className="text-[10px] text-indigo-400">sin riesgo para ellos</span>
                    </div>
                    <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-xl p-4">
                      <span className="text-[11px] text-emerald-300 font-bold block">Tu Ganancia (MRR):</span>
                      <span className="text-3xl font-black text-emerald-400 block mt-1">€{calcFee.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-300 font-medium">al mes recurrente</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs"><Flame className="w-4 h-4"/>Fórmula 10.000€/mes:</div>
                    <p className="text-xs text-slate-300">Cobrando <strong className="text-emerald-400">€{calcFee.toLocaleString()}/mes</strong> por negocio, necesitas <strong className="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">{needClients} negocio{needClients>1?"s":""}</strong> para superar <strong className="text-white">10.000€/mes</strong>.</p>
                  </div>
                </div>

                {sel && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-emerald-400"/>Plataforma Recomendada para {selInd.emoji} {selInd.label.split("·")[0].trim()}:</span>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                    <span className="font-bold text-indigo-300 block mb-1">📢 {selInd.adPlatform}</span>
                    <p className="text-slate-300 italic">&ldquo;{selInd.adHook(sel.name,sel.heroOffer||"")}&rdquo;</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                    <span className="font-bold text-emerald-300 block mb-1">📝 Copy del Anuncio:</span>
                    <p className="text-slate-300 italic">&ldquo;{selInd.adCopy(sel.name,sel.heroOffer||"")}&rdquo;</p>
                  </div>
                </div>}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 6: CRM ===== */}
        {tab === "crm" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Pipeline CRM Universal</h2>
                <p className="text-xs text-slate-400">Seguimiento de negocios de cualquier industria. Enfocado en facturación extra.</p>
              </div>
              <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl">{bizs.length} Negocios</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {([
                {k:"discovered",t:"1. Descubierto",c:"border-amber-500"},
                {k:"funnel_ready",t:"2. Embudo Creado",c:"border-indigo-500"},
                {k:"contact_found",t:"3. Contacto Encontrado",c:"border-emerald-500"},
                {k:"pitch_sent",t:"4. Pitch Enviado",c:"border-purple-500"},
                {k:"closed_deal",t:"5. Deal Cerrado (€/mes)",c:"border-cyan-500"},
              ]).map(col => {
                const items = bizs.filter(b => col.k==="pitch_sent"?(b.status==="pitch_sent"||b.status==="call_booked"):b.status===col.k);
                return (
                  <div key={col.k} className={`bg-slate-900/80 border-t-4 ${col.c} border-x border-b border-slate-800 rounded-2xl p-4 space-y-3`}>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="font-bold text-xs text-white">{col.t}</h4>
                      <span className="bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded-full font-bold">{items.length}</span>
                    </div>
                    <div className="space-y-3">
                      {items.map(b => {
                        const ind = getInd(b.businessType);
                        return (
                          <div key={b.id} onClick={() => {setSelId(b.id);setTab("outreach");}} className="bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-xl p-3 space-y-2 cursor-pointer transition shadow">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs flex items-center gap-1">{ind.emoji} {b.name}</span>
                              <span className="text-[10px] text-slate-400">{b.country}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">{ind.label.split("·")[0].trim()}</span>
                              <span className="font-bold text-emerald-400">€{b.monthlyRevenue.toLocaleString()}/m</span>
                            </div>
                          </div>
                        );
                      })}
                      {items.length===0 && <p className="text-[11px] text-slate-500 text-center py-4 italic">Sin negocios</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TAB 7: AUTO-ANALYZE ===== */}
        {tab === "autoanalyze" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-purple-950/80 border border-cyan-500/40 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-black text-white mb-1">✨ Análisis Automático 1-Click</h2>
              <p className="text-sm text-slate-300">Escribe el nombre de cualquier negocio y EcoScale Partner generará automáticamente: análisis SEO, landing page, emails, video script, ads strategy y proyecciones de ingresos.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <label className="text-sm font-bold text-slate-300 block">Nombre del Negocio:</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Ej: Nike, Restaurant Milano, Gimnasio..." value={autoInput} onChange={(e) => setAutoInput(e.target.value)} disabled={autoAnalyzing} className="flex-1 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"/>
                <button onClick={async () => {if (!autoInput.trim()) return; setAutoAnalyzing(true); try {const res = await fetch("/api/campaign-auto-generate", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({businessName: autoInput})}); const data = await res.json(); if (data.success) {setAutoCampaigns([{id: Date.now(), businessName: autoInput, status: "ready", createdAt: new Date().toISOString(), ...data.campaign}, ...autoCampaigns]); setAutoInput("");}} catch(e) {console.error(e);} finally {setAutoAnalyzing(false);}}} disabled={autoAnalyzing || !autoInput.trim()} className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap transition">
                  {autoAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {autoAnalyzing ? "Analizando..." : "Analizar"}
                </button>
              </div>
            </div>

            {autoCampaigns.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Análisis Generados</h3>
                {autoCampaigns.map((campaign: any) => (
                  <div key={campaign.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition cursor-pointer" onClick={() => setSelectedCampaign(campaign)}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-base">{campaign.businessName}</h4>
                        <p className="text-xs text-slate-400 mt-1">{campaign.status === "ready" ? "✓ Listo" : "🚀 Activo"} • {new Date(campaign.createdAt).toLocaleDateString("es-ES")}</p>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-cyan-400 font-bold">{campaign.analysis?.seoScore || 0}/100 SEO</div>
                        <div className="text-slate-400">Keywords: {campaign.analysis?.keywords?.length || 0}</div>
                      </div>
                      <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2 rounded-xl whitespace-nowrap">Ver Paquete →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===== BLUEPRINT MODAL ===== */}
      {autoRun && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 via-purple-600 to-rose-500 flex items-center justify-center shadow-lg"><Target className="w-7 h-7 text-white animate-pulse"/></div>
              <h3 className="text-xl font-black text-white">Blueprint 1-Click con EcoScale Partner</h3>
              <p className="text-xs text-slate-400">Automatizando para: <strong className="text-white">{autoName}</strong></p>
            </div>
            <div className="space-y-3 text-xs">
              {[
                {s:1,t:`${selInd.emoji} 1. Analizando con EcoScale Partner`},
                {s:2,t:`🎨 2. Generando embudo adaptado a ${selInd.label.split("·")[0].trim()}`},
                {s:3,t:`👤 3. Extrayendo email verificado`},
                {s:4,t:`✉️ 4. Redactando pitch + Loom 90s`},
                {s:5,t:`🚀 5. Propuesta Revenue-Share lista`},
              ].map(st => (
                <div key={st.s} className={`p-3 rounded-xl border flex items-center justify-between transition ${autoStep>=st.s?(st.s===5?"bg-emerald-950/80 border-emerald-600 text-emerald-200":"bg-indigo-950/60 border-indigo-600 text-white"):"bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <span>{st.t}</span>
                  {autoStep>=st.s?<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/>:<RefreshCw className="w-4 h-4 animate-spin text-slate-600"/>}
                </div>
              ))}
            </div>
            {blueprintError && <div className="bg-red-950 border border-red-700 text-red-200 text-xs rounded-xl p-3">{blueprintError}</div>}
            {autoStep>=5 && <button onClick={() => { if (blueprintCampaignId) window.location.href=`/campaign/${blueprintCampaignId}`; }} className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">¡Blueprint Completado! Ver Dossier <ArrowRight className="w-4 h-4"/></button>}
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAVIGATION DOCK ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-slate-950 via-slate-950 to-slate-950/80 border-t border-slate-800/60 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
          {([
            {k:"autodiscover" as const, emoji:"⚡", label:"Discovery"},
            {k:"discover" as const, emoji:"🌍", label:"Businesses"},
            {k:"funnels" as const, emoji:"📄", label:"Funnels"},
            {k:"contacts" as const, emoji:"👤", label:"Contacts"},
            {k:"outreach" as const, emoji:"✉️", label:"Outreach"},
            {k:"calculator" as const, emoji:"💰", label:"Revenue"},
            {k:"autoanalyze" as const, emoji:"✨", label:"Auto-Analyze"},
            {k:"crm" as const, emoji:"📊", label:"CRM"},
          ]).map(item => (
            <button
              key={item.k}
              onClick={() => setTab(item.k)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                tab === item.k
                  ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg"
                  : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
              }`}
            >
              <span className="text-sm">{item.emoji}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== CAMPAIGN DETAIL MODAL ===== */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <h3 className="font-black text-xl text-white">{selectedCampaign.businessName}</h3>
              <button onClick={() => setSelectedCampaign(null)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📊</span>
                  <h4 className="font-bold text-white">Análisis Competitivo & SEO</h4>
                </div>
                <p className="text-sm text-slate-300 mb-3">SEO Score: <span className="font-bold text-emerald-400">{selectedCampaign.analysis?.seoScore || 0}/100</span></p>
                <p className="text-xs text-slate-300">Keywords principales: {selectedCampaign.analysis?.keywords?.join(", ") || "N/A"}</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎨</span>
                  <h4 className="font-bold text-white">Funnel de Ventas</h4>
                </div>
                <p className="text-xs text-slate-300">Headline: <span className="font-semibold text-slate-200">{selectedCampaign.landingPage?.headline || "Generado"}</span></p>
                <p className="text-xs text-slate-300 mt-2">Offer: {selectedCampaign.landingPage?.offer || "Premium"}</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✉️</span>
                  <h4 className="font-bold text-white">Estrategia de Outreach</h4>
                </div>
                <p className="text-xs text-slate-300">Email Sequence: {selectedCampaign.emailSequence?.length || 3} emails</p>
                <p className="text-xs text-slate-300 mt-2">Video Script: {selectedCampaign.videoScript?.duration || "60-90s"}</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📈</span>
                  <h4 className="font-bold text-white">Proyecciones & ROI</h4>
                </div>
                <p className="text-xs text-slate-300">Expected Revenue: <span className="font-bold text-amber-400">€{selectedCampaign.projections?.monthlyRevenue?.toLocaleString() || "5000"}/month</span></p>
                <p className="text-xs text-slate-300 mt-2">Expected ROI: <span className="font-bold text-emerald-400">{selectedCampaign.projections?.expectedROI || 100}%</span></p>
              </div>
            </div>

            <button onClick={() => setSelectedCampaign(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl mt-6">Cerrar</button>
          </div>
        </div>
      )}

      {/* Add bottom padding to main so content doesn't hide under dock */}
      <div className="h-24" />

      {/* ===== ADD BUSINESS MODAL ===== */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400"/>Añadir Cualquier Negocio</h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              {/* Industry Selector - ALL INDUSTRIES */}
              <div><label className="text-slate-300 font-semibold block mb-2">Tipo de Negocio:</label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {INDUSTRY_LIST.map(ind => (
                    <button type="button" key={ind.key} onClick={() => {setNType(ind.key);setNNiche(ind.defaultNiche);setNOffer(ind.defaultOffer);setNPrice(ind.defaultPrice);}} className={`p-2.5 rounded-xl border text-center transition ${nType===ind.key?"border-emerald-500 shadow-md text-white":"border-slate-700 text-slate-400 hover:border-slate-600"}`} style={nType===ind.key?{backgroundColor:ind.color}:{backgroundColor:"rgba(30,41,59,0.6)"}}>
                      <span className="text-xl block mb-0.5">{ind.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight">{ind.label.split("·")[0].trim()}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Nombre del Negocio: *</label>
                <input type="text" required placeholder="ej. Restaurante, Gimnasio, Tienda..." value={nName} onChange={e => setNName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Dominio Web:</label>
                <input type="text" placeholder="ej. negocio.com" value={nDomain} onChange={e => setNDomain(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Oferta / Servicio Principal:</label>
                <input type="text" placeholder={getInd(nType).defaultOffer} value={nOffer} onChange={e => setNOffer(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-slate-300 font-semibold block mb-1">Nicho:</label>
                  <select value={nNiche||getInd(nType).defaultNiche} onChange={e => setNNiche(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2">
                    {getInd(nType).niches.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div><label className="text-slate-300 font-semibold block mb-1">Facturación (€/mes):</label>
                  <input type="number" value={nRev} onChange={e => setNRev(parseInt(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-slate-300 font-semibold block mb-1">Ticket medio (€):</label>
                  <input type="number" value={nAov} onChange={e => setNAov(Number(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
                <div><label className="text-slate-300 font-semibold block mb-1">Conversión (%):</label>
                  <input type="number" step="0.1" value={nConversion} onChange={e => setNConversion(Number(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
                <div><label className="text-slate-300 font-semibold block mb-1">Ads €/mes:</label>
                  <input type="number" value={nAdSpend} onChange={e => setNAdSpend(Number(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Precio:</label>
                <input type="text" placeholder={getInd(nType).defaultPrice} value={nPrice} onChange={e => setNPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Nombre del Contacto:</label>
                <input type="text" placeholder="ej. Carlos López" value={nContact} onChange={e => setNContact(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setAddOpen(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold">Cancelar</button>
                <button type="submit" disabled={funnelGenerating} className="w-1/2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold">{funnelGenerating ? "Generando..." : "Añadir y Generar"}</button>
              </div>
              {funnelError && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-3">{funnelError}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
