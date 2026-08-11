"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

const externalImageLoader = ({ src }: { src: string }) => src;
import Link from "next/link";
import { Search, Globe, Sparkles, Zap, Mail, Video, Calculator, ArrowRight, CheckCircle2, TrendingUp, ExternalLink, Flame, UserCheck, DollarSign, Copy, Layers, Check, RefreshCw, Plus, Clock, Kanban, ShieldCheck, Filter, Target, BarChart3, Percent, Award, Trash2, Home, LayoutDashboard, Send, Activity, FileText, Eye } from "lucide-react";
import { INDUSTRY_LIST } from "@/lib/industries";
import type { IndustryConfig } from "@/lib/industries";
import { AutoDiscovery } from "@/components/AutoDiscovery";
import { LocalBusinessFinder } from "@/components/LocalBusinessFinder";

interface Business { id: number; name: string; domain: string; country: string; businessType: string; niche: string; monthlyRevenue: number; averageOrderValue?: number; conversionRate?: number; monthlyAdSpend?: number; platform: string; technologyData?: {technologies?: Array<{name:string}>; techSpendUsd?: number | null} | null; logoUrl?: string | null; brandColor?: string | null; brandAccent?: string | null; status: string; heroOffer?: string | null; heroPrice?: string | null; painPoint?: string | null; }
interface Funnel { id: number; businessId: number | null; funnelName: string; templateType: string; headline: string; subheadline: string; ctaText: string; offerBadge: string | null; bonusOffer: string | null; customPrimaryColor: string | null; slug: string; viewCount: number | null; contentJson?: any; }
interface Contact { id: number; businessId: number | null; name: string; role: string; email: string; linkedinUrl: string | null; confidenceScore: number | null; status: string | null; }
interface AuditSummary { id: string; businessId: number | null; domain: string; score: number; createdAt: string; }
interface OutreachCampaignSummary { id: string; businessId: number; status: string; }
interface ProposalSummary { id: string | number; businessId: number | null; status: string; }

const ICONS: Record<string,string> = { general:"🏢", ecommerce:"🛒", restaurant:"🍽️", gym:"💪", professional:"👨‍💼", healthcare:"🏥", saas:"💻", realestate:"🏠", coaching:"🎓", agency:"🚀" };
const IND_MAP: Record<string,IndustryConfig> = {};
INDUSTRY_LIST.forEach(i => { IND_MAP[i.key] = i; });
function getInd(k: string) { return IND_MAP[k] || IND_MAP.general; }

export default function LegacyWorkspacePage() {
  const [bizs, setBizs] = useState<Business[]>([]);
  const [funs, setFuns] = useState<Funnel[]>([]);
  const [cons, setCons] = useState<Contact[]>([]);
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [outreachCampaigns, setOutreachCampaigns] = useState<OutreachCampaignSummary[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard"|"autodiscover"|"discover"|"funnels"|"contacts"|"outreach"|"calculator"|"crm">("dashboard");
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
  const [nRev, setNRev] = useState(0);
  const [nAov, setNAov] = useState(0);
  const [nConversion, setNConversion] = useState(0);
  const [nAdSpend, setNAdSpend] = useState(0);
  const [nOffer, setNOffer] = useState("");
  const [nPrice, setNPrice] = useState("");
  const [nContact, setNContact] = useState("");
  const [calcRev, setCalcRev] = useState(0);
  const [calcLift, setCalcLift] = useState(0);
  const [calcShare, setCalcShare] = useState(0);
  const [copied, setCopied] = useState<string|null>(null);
  const [emailError, setEmailError] = useState("");
  const [, setOutreachDraftId] = useState<number|null>(null);
  const [outreachDraft, setOutreachDraft] = useState<any|null>(null);
  const [outreachGenerating, setOutreachGenerating] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [blueprintError, setBlueprintError] = useState("");
  const [blueprintCampaignId, setBlueprintCampaignId] = useState<string|null>(null);
  const [funnelGenerating, setFunnelGenerating] = useState(false);
  const [funnelError, setFunnelError] = useState("");
  const [deletingFunnels, setDeletingFunnels] = useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [bR, fR, cR, aR, oR, pR] = await Promise.all([
        fetch("/api/businesses"),
        fetch("/api/funnels"),
        fetch("/api/contacts"),
        fetch("/api/funnelspy/history"),
        fetch("/api/outreach/campaigns?limit=100"),
        fetch("/api/proposals?limit=100"),
      ]);
      const [bJ, fJ, cJ, aJ, oJ, pJ] = await Promise.all([bR.json(), fR.json(), cR.json(), aR.json(), oR.json(), pR.json()]);
      if (bJ.success) {
        setBizs(bJ.businesses);
        if (bJ.businesses.length) setSelId(current => current ?? bJ.businesses[0].id);
      }
      if (fJ.success) setFuns(fJ.funnels);
      if (cJ.success) setCons(cJ.contacts);
      if (aR.ok && Array.isArray(aJ.audits)) setAudits(aJ.audits);
      if (oR.ok && Array.isArray(oJ.campaigns)) setOutreachCampaigns(oJ.campaigns);
      if (pR.ok) {
        const current = Array.isArray(pJ.proposals) ? pJ.proposals : [];
        const legacy = Array.isArray(pJ.legacyProposals)
          ? pJ.legacyProposals.map((item: any) => ({ id: item.id, businessId: item.business_id ?? null, status: item.status || "draft" }))
          : [];
        setProposals([...current, ...legacy]);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchAll(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAll]);

  const sel = bizs.find(b => b.id === selId) || bizs[0];
  const selFun = funs
    .filter(f => f.businessId === sel?.id)
    .sort((left, right) => right.id - left.id)[0];
  const selContent = selFun?.contentJson?.translations?.en || selFun?.contentJson || null;
  const selLayout = selContent?.landingPage || null;
  const selOtom = selContent?.otom || null;
  const selCon = cons.find(c => c.businessId === sel?.id);
  const selInd = sel ? getInd(sel.businessType) : getInd("general");
  const outreachSequence = Array.isArray(outreachDraft?.emailSequence) ? outreachDraft.emailSequence : [];
  const loomSegments = Array.isArray(outreachDraft?.videoPitch?.segments) ? outreachDraft.videoPitch.segments : [];

  useEffect(() => {
    if (!sel?.id) return;
    const controller = new AbortController();
    fetch(`/api/outreach?businessId=${sel.id}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Could not load the draft")))
      .then(data => {
        const latest = data.outreach?.[0] || null;
        setOutreachDraft(latest ? {
          ...latest,
          emailSequence: latest.email_sequence || [],
          videoPitch: latest.video_script || null,
        } : null);
        setOutreachDraftId(latest?.id ? Number(latest.id) : null);
        setEmailSubject(latest?.email_subject || "");
        setEmailBody(latest?.email_body || "");
        setSelectedEmailIndex(0);
      })
      .catch(error => { if (error.name !== "AbortError") setEmailError(error.message); });
    return () => controller.abort();
  }, [sel?.id]);

  // Poll helper for job queue
  async function pollJobResult(jobId: string, timeoutMs =120000, interval =1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await fetch(`/api/outreach/generate?jobId=${encodeURIComponent(jobId)}`);
      if (!res.ok) {
        // if not found, wait and retry briefly
        if (res.status ===404) {
          await new Promise(r => setTimeout(r, interval));
          continue;
        }
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        throw new Error(err.error || 'Job polling failed');
      }
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.error || 'Job polling failed');
      const job = payload.job;
      if (job.status === 'completed') return job.result;
      if (job.status === 'failed') throw new Error(job.error || 'Job failed');
      // still pending/running
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error('Job timeout');
  }

  const generateCurrentOutreach = async () => {
    if (!sel || !selCon?.email) {
      setEmailError('Add a contact with a real email before generating outreach.');
      return;
    }
    setOutreachGenerating(true);
    setEmailError("");
    try {
      const response = await fetch('/api/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: sel.id,
          contactId: selCon.id,
          contactName: selCon.name,
          contactRole: selCon.role,
          businessName: sel.name,
          recipientEmail: selCon.email,
          website: sel.domain,
          industry: sel.businessType,
          location: sel.country,
          audience: sel.niche,
          offerHeadline: selContent?.offer || sel.heroOffer,
          painPoint: selContent?.painPoint || sel.painPoint,
          problems: [selContent?.painPoint || sel.painPoint].filter(Boolean),
          opportunity: selOtom?.coreOffer?.description || selFun?.bonusOffer,
          bonusOffer: selFun?.bonusOffer,
          previewUrl: selFun ? `${window.location.origin}/en/funnel/${selFun.slug}` : '',
          objective: selContent?.primaryGoal || 'Review the proposal and talk for15 minutes',
          senderCompany: 'EcoScale Partner',
        }),
      });

      const data = await response.json();
      if (response.status ===202 && data.jobId) {
        // Poll job until finished
        const result = await pollJobResult(data.jobId);
        // result should contain the outreach payload as returned by the job
        const outreachResult = result.outreach || result;
        const emailSequence = result.emailSequence || outreachResult.email_sequence || [];
        setOutreachDraft({
          ...outreachResult,
          emailSequence,
          videoPitch: result.videoPitch || outreachResult.video_script || null,
          personalizationUsed: result.personalizationUsed,
          claimsToVerify: result.claimsToVerify,
        });
        setOutreachDraftId(Number(outreachResult.id));
        setEmailSubject(emailSequence[0]?.subject || '');
        setEmailBody(emailSequence[0]?.body || '');
      } else {
        if (!response.ok || !data.success) throw new Error(data.error || 'Could not generate the outreach');
        // legacy synchronous response
        setOutreachDraft({
          ...data.outreach,
          emailSequence: data.emailSequence,
          videoPitch: data.videoPitch,
          personalizationUsed: data.personalizationUsed,
          claimsToVerify: data.claimsToVerify,
        });
        setOutreachDraftId(Number(data.outreach.id));
        setEmailSubject(data.emailSequence[0]?.subject || '');
        setEmailBody(data.emailSequence[0]?.body || '');
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Could not generate the outreach');
    } finally {
      setOutreachGenerating(false);
    }
  };

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

  const auditedBusinessIds = new Set(audits.map(item => item.businessId).filter((id): id is number => Number.isInteger(id)));
  const funnelBusinessIds = new Set(funs.map(item => item.businessId).filter((id): id is number => Number.isInteger(id)));
  const pitchBusinessIds = new Set(outreachCampaigns.map(item => item.businessId).filter(Number.isInteger));
  const sentBusinessIds = new Set(
    outreachCampaigns
      .filter(item => ["scheduled", "running", "completed"].includes(item.status))
      .map(item => item.businessId)
      .filter(Number.isInteger),
  );
  const closedBusinesses = bizs.filter(item => item.status === "closed_deal");
  const verifiedContacts = cons.filter(item => Boolean(item.email) && ["verified", "valid"].includes(item.status || ""));
  const selectedAudit = audits.find(item => item.businessId === sel?.id);
  const selectedProposal = proposals.find(item => item.businessId === sel?.id);
  const selectedCampaign = outreachCampaigns.find(item => item.businessId === sel?.id);
  const contactBusinessIds = new Set(cons.filter(item => Boolean(item.email)).map(item => item.businessId).filter((id): id is number => Number.isInteger(id)));
  const businessesWithoutAudit = bizs.filter(item => !auditedBusinessIds.has(item.id)).length;
  const businessesWithoutFunnel = bizs.filter(item => !funnelBusinessIds.has(item.id)).length;
  const businessesWithoutContact = bizs.filter(item => !contactBusinessIds.has(item.id)).length;

  const runBlueprint = async (b: Business) => {
    setSelId(b.id); setAutoName(b.name); setAutoRun(true); setAutoStep(1);
    setBlueprintError("");
    try {
      const campaignId = `campaign_${Date.now()}`;
      const generatedResponse = await fetch('/api/campaign-auto-generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: b.name, website: b.domain, industry: b.businessType, monthlyRevenue: b.monthlyRevenue, averageOrderValue: b.averageOrderValue, conversionRate: b.conversionRate, monthlyAdSpend: b.monthlyAdSpend }),
      });
      const generated = await generatedResponse.json();
      if (!generatedResponse.ok || !generated.success) throw new Error(generated.error || 'Analysis failed');
      setAutoStep(2);

      const saved = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaignId, businessName: b.name, status: 'ready', ...generated.campaign }),
      });
      if (!saved.ok) throw new Error('Could not save the campaign');
      setBlueprintCampaignId(campaignId);
      setAutoStep(3);

      const contact = cons.find(c => c.businessId === b.id);
      if (!contact?.email) throw new Error('There is no real contact for this business');
      const funnel = funs
        .filter(f => f.businessId === b.id)
        .sort((left, right) => right.id - left.id)[0];
      setAutoStep(4);

      const outreachResp = await fetch('/api/outreach/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: b.id, contactId: contact.id, campaignId, contactName: contact.name, businessName: b.name, recipientEmail: contact.email, contactRole: contact.role, website: b.domain, industry: b.businessType, location: b.country, audience: b.niche, offerHeadline: b.heroOffer, painPoint: b.painPoint, problems: [b.painPoint].filter(Boolean), bonusOffer: funnel?.bonusOffer, opportunity: funnel?.headline || funnel?.subheadline, previewUrl: funnel?.slug ? `${window.location.origin}/en/funnel/${funnel.slug}` : undefined, objective: 'Get the decision-maker to review the proposal and accept a15-minute conversation', senderCompany: 'EcoScale Partner' }),
      });
      const outreachData = await outreachResp.json();
      let outreachFinal;
      if (outreachResp.status ===202 && outreachData.jobId) {
        const res = await pollJobResult(outreachData.jobId);
        outreachFinal = res.outreach || res;
      } else {
        if (!outreachResp.ok || !outreachData.success) throw new Error(outreachData.error || 'Outreach failed');
        outreachFinal = outreachData.outreach;
      }

      setOutreachDraftId(Number(outreachFinal.id));
      setOutreachDraft({ ...outreachFinal, emailSequence: outreachFinal.email_sequence || outreachFinal.emailSequence || [], videoPitch: outreachFinal.video_script || outreachFinal.videoPitch || null, personalizationUsed: outreachFinal.personalizationUsed, claimsToVerify: outreachFinal.claimsToVerify });
      setEmailSubject(outreachFinal.email_sequence?.[0]?.subject || outreachFinal.emailSequence?.[0]?.subject || '');
      setEmailBody(outreachFinal.email_sequence?.[0]?.body || outreachFinal.emailSequence?.[0]?.body || '');

      setAutoStep(5);
      await fetchAll();
    } catch (error) {
      setBlueprintError(error instanceof Error ? error.message : 'Blueprint failed');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nName || !nDomain) {
      setFunnelError("The business name and a real public domain are required.");
      return;
    }
    setFunnelGenerating(true);
    setFunnelError("");
    const ind = getInd(nType);
    try {
      const res = await fetch("/api/businesses", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name:nName, domain:nDomain, businessType:nType, niche:nNiche||ind.defaultNiche, monthlyRevenue:nRev, averageOrderValue:nAov, conversionRate:nConversion, monthlyAdSpend:nAdSpend, heroOffer:nOffer||ind.defaultOffer, heroPrice:nPrice||ind.defaultPrice, painPoint:ind.defaultPainPoint, country:countryFilter==="all"?"Unknown":countryFilter, contactName:nContact||undefined }) });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "Could not save the business");
      const funnelRes = await fetch("/api/funnels/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({businessId:j.business.id,businessName:nName,industryType:nType,niche:nNiche||ind.defaultNiche,painPoint:ind.defaultPainPoint})
      });
      const funnelJson = await funnelRes.json();
      if (!funnelRes.ok || !funnelJson.success) throw new Error(funnelJson.error || "Could not generate the funnel");
      setAddOpen(false); setNName(""); setNDomain(""); setNOffer(""); setNPrice(""); setNContact("");
      await fetchAll(); setSelId(Number(j.business.id)); setTab("funnels");
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "Could not generate the funnel");
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
      if (!response.ok || !data.success) throw new Error(data.error || "Could not generate the funnel");
      await fetchAll();
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "Could not generate the funnel");
    } finally {
      setFunnelGenerating(false);
    }
  };

  const deleteAllFunnels = async () => {
    if (!funs.length || deletingFunnels) return;
    const confirmed = window.confirm(
      `You are about to delete ${funs.length} funnel(s) and all their captured leads. Businesses and contacts will be kept. Continue?`
    );
    if (!confirmed) return;
    const typed = window.prompt('To confirm, type exactly: DELETE ALL FUNNELS');
    if (typed !== "DELETE ALL FUNNELS") {
      setFunnelError("The confirmation text doesn't match. Nothing was deleted.");
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
      if (!response.ok || !data.success) throw new Error(data.error || "Could not delete the funnels");
      setFuns([]);
      await fetchAll();
      window.alert(`Deleted ${data.deletedFunnels} funnel(s) and ${data.deletedLeads} lead(s).`);
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "Could not delete the funnels");
    } finally {
      setDeletingFunnels(false);
    }
  };

  const deleteSelectedFunnel = async () => {
    if (!selFun || deletingFunnels) return;
    const confirmed = window.confirm(
      `You are about to delete only "${selFun.funnelName}" and its captured leads. The business, contacts, and audits will be kept. Continue?`,
    );
    if (!confirmed) return;
    const typed = window.prompt(`To confirm, type exactly: DELETE FUNNEL ${selFun.id}`);
    if (typed !== `DELETE FUNNEL ${selFun.id}`) {
      setFunnelError("The confirmation doesn't match. Nothing was deleted.");
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
      if (!response.ok || !data.success) throw new Error(data.error || "Could not delete the funnel");
      setFuns(current => current.filter(funnel => funnel.id !== selFun.id));
      window.alert(`Deleted "${selFun.funnelName}" and ${data.deletedLeads || 0} lead(s).`);
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : "Could not delete the funnel");
    } finally {
      setDeletingFunnels(false);
    }
  };

  const copy = (t: string, l: string) => { navigator.clipboard.writeText(t); setCopied(l); setTimeout(() => setCopied(null), 2500); };

  const calcExtra = Math.round(calcRev * (calcLift / 100));
  const calcFee = Math.round(calcExtra * (calcShare / 100));
  const needClients = calcFee > 0 ? Math.ceil(10000 / calcFee) : null;

  if (loading) return <div className="legacy-studio min-h-screen flex items-center justify-center"><div className="size-12 animate-spin rounded-full border-2 border-white/10 border-t-orange-400" /></div>;

  return (
    <div className="legacy-studio min-h-screen overflow-x-hidden text-slate-100 selection:bg-orange-500/30">
      <div className="legacy-ambient" aria-hidden="true" />
      <header className="legacy-command-header sticky top-0 z-40 border-b border-white/[.07] bg-[#070707]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-300 text-black shadow-lg shadow-orange-500/20"><Target className="size-5" /></div>
            <div>
              <strong className="block tracking-tight text-white">Revenue Operations</strong>
              <span className="text-[9px] font-bold uppercase tracking-[.25em] text-slate-600">Legacy workspace · upgraded</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab("dashboard")} className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-bold text-slate-400 transition hover:border-orange-300/30 hover:text-white sm:flex">
              <LayoutDashboard className="size-4" /><span>Dashboard</span>
            </button>
            <Link href="/" className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-bold text-slate-400 transition hover:border-orange-300/30 hover:text-white">
              <Home className="size-4" /><span>Menu</span>
            </Link>
            <Link href="/funnelspy" className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2 text-xs font-bold text-slate-400 transition hover:border-cyan-300/30 hover:text-white">
              <Search className="w-4 h-4" /><span>FunnelSpy</span>
            </Link>
            <Link href="/otom" className="hidden items-center gap-1.5 rounded-xl border border-orange-400/20 bg-orange-400/[.07] px-3.5 py-2 text-xs font-bold text-orange-200 transition hover:bg-orange-400/[.12] sm:flex">
              <DollarSign className="size-4" /><span>OTOM</span>
            </Link>
            <button onClick={() => sel && runBlueprint(sel)} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-black shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 active:scale-95">
              <Zap className="w-4 h-4 fill-white" /><span>Blueprint 1-Click</span>
            </button>
            <button onClick={() => setAddOpen(true)} className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/[.06] hover:text-white" aria-label="Add business" title="Add business">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="legacy-workspace relative z-10 mx-auto max-w-[1500px] px-5 py-8">
        <section className="mb-7 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/[.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-lime-300">
              <span className="size-1.5 animate-pulse rounded-full bg-lime-300" />
              Revenue system online
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-none tracking-[-.045em] text-white md:text-6xl">
              Your growth pipeline,{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-lime-300 bg-clip-text text-transparent">in a single view.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Discover, analyze, create OTOM and preview, prepare the pitch, send with approval, and measure results using real workspace data.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              ["Businesses", bizs.length, "text-cyan-300"],
              ["Audits", audits.length, "text-violet-300"],
              ["Funnels", funs.length, "text-orange-300"],
              ["Proposals", proposals.length, "text-lime-300"],
            ].map(([label, value, tone]) => (
              <div key={String(label)} className="min-w-24 rounded-2xl border border-white/[.08] bg-white/[.03] p-4 sm:min-w-28">
                <span className="block text-[9px] font-black uppercase tracking-[.16em] text-slate-600">{label}</span>
                <strong className={`mt-1 block text-2xl font-black ${tone}`}>{value}</strong>
              </div>
            ))}
          </div>
        </section>

      {/* Industry Selector - ALL INDUSTRIES VISIBLE */}
      {tab !== "dashboard" && <section className="legacy-filter-deck rounded-3xl border border-white/[.08] bg-white/[.025] p-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><Filter className="size-3.5 text-orange-300" /> Filter by business type</div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-9 gap-2">
            <button onClick={() => setTypeFilter("all")} className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition ${typeFilter==="all"?"border-orange-400 bg-orange-400 text-black":"border-white/[.08] bg-white/[.03] text-slate-400 hover:border-white/20 hover:text-white"}`}>All ({bizs.length})</button>
            {INDUSTRY_LIST.map(ind => {
              const c = bizs.filter(b => b.businessType === ind.key).length;
              return <button key={ind.key} onClick={() => setTypeFilter(ind.key)} className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-bold transition ${typeFilter===ind.key?"text-white shadow":"border-white/[.08] bg-white/[.03] text-slate-400 hover:border-white/20 hover:text-white"}`} style={typeFilter===ind.key?{backgroundColor:ind.color,borderColor:ind.color}:undefined}><span>{ind.emoji}</span><span className="hidden sm:inline text-[10px]">{ind.label.split("·")[0].trim()}</span><span className="text-[9px] opacity-70">({c})</span></button>;
            })}
          </div>
        </div>
      </section>}

      {/* 7-Step Progress */}
      <section className="legacy-flow-rail mt-5 rounded-3xl border border-white/[.08] bg-black/20 p-3">
        <div className="pipeline grid grid-flow-col auto-cols-[minmax(145px,1fr)] gap-2 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-8 lg:auto-cols-auto lg:overflow-visible lg:pb-0">
          {([
            {k:"dashboard" as const,n:"Home",sub:"Command center",icon:<LayoutDashboard className="w-3.5 h-3.5 text-orange-300"/>},
            {k:"autodiscover" as const,n:"0. Auto-Discovery",sub:"Hunter.io",icon:<Zap className="w-3.5 h-3.5 text-purple-400"/>},
            {k:"discover" as const,n:"1. Discover",sub:"Any business",icon:<Globe className="w-3.5 h-3.5 text-amber-400"/>},
            {k:"funnels" as const,n:"2. Free Funnel",sub:"Adapted to the business",icon:<Layers className="w-3.5 h-3.5 text-indigo-400"/>},
            {k:"contacts" as const,n:"3. Contact",sub:"Decision-maker's email",icon:<UserCheck className="w-3.5 h-3.5 text-emerald-400"/>},
            {k:"outreach" as const,n:"4. Pitch",sub:"Email + 90s Loom",icon:<Mail className="w-3.5 h-3.5 text-rose-400"/>},
            {k:"calculator" as const,n:"5. Rev-Share",sub:"Ads to % profit",icon:<Calculator className="w-3.5 h-3.5 text-amber-400"/>},
            {k:"crm" as const,n:"6. CRM",sub:"Real pipeline",icon:<BarChart3 className="w-3.5 h-3.5 text-cyan-400"/>},
          ]).map(s => (
            <button key={s.k} onClick={() => setTab(s.k)} className={`pipeline-step rounded-2xl border p-3 text-left transition ${tab===s.k?"border-orange-400/30 bg-orange-400/[.09] shadow-lg shadow-orange-950/20":"border-white/[.06] bg-white/[.025] hover:border-white/15 hover:bg-white/[.05]"}`}>
              <p className={`flex items-center gap-1.5 text-xs font-bold ${tab===s.k ? "text-orange-100" : "text-white"}`}>{s.icon}{s.n}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8">

        {/* ===== COMMAND CENTER ===== */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <section className="grid gap-4 xl:grid-cols-[1.6fr_.9fr]">
              <div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-orange-300"><Activity className="size-4" /> Growth pipeline</div>
                    <h2 className="mt-2 text-2xl font-black text-white">Move from evidence to revenue</h2>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Every figure comes from saved records. An empty stage means pending work, not an estimate.</p>
                  </div>
                  <span className="rounded-full border border-lime-400/20 bg-lime-400/[.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-lime-300">Workspace data</span>
                </div>

                <div className="mt-7 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label:"Discover", value:bizs.length, note:"businesses", icon:<Search className="size-4" />, action:() => setTab("discover") },
                    { label:"Analyze", value:auditedBusinessIds.size, note:"audited", icon:<Activity className="size-4" />, href:"/funnelspy" },
                    { label:"OTOM + preview", value:funnelBusinessIds.size, note:"with funnel", icon:<Eye className="size-4" />, action:() => setTab("funnels") },
                    { label:"Create pitch", value:pitchBusinessIds.size, note:"with campaign", icon:<Mail className="size-4" />, action:() => setTab("outreach") },
                    { label:"Send", value:sentBusinessIds.size, note:"activated", icon:<Send className="size-4" />, href:"/outreach" },
                    { label:"Measure", value:closedBusinesses.length, note:"closed", icon:<BarChart3 className="size-4" />, href:"/analytics/sales" },
                  ].map((stage, index) => {
                    const content = <><span className="flex items-center justify-between text-orange-300">{stage.icon}<span className="text-[9px] font-black text-slate-600">0{index + 1}</span></span><strong className="mt-5 block text-3xl font-black text-white">{stage.value}</strong><span className="mt-1 block text-xs font-bold text-white">{stage.label}</span><span className="block text-[10px] text-slate-500">{stage.note}</span></>;
                    return stage.href
                      ? <Link key={stage.label} href={stage.href} className="group rounded-2xl border border-white/[.07] bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-orange-300/30 hover:bg-orange-400/[.05]">{content}</Link>
                      : <button key={stage.label} onClick={stage.action} className="group rounded-2xl border border-white/[.07] bg-black/20 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-300/30 hover:bg-orange-400/[.05]">{content}</button>;
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-400/[.09] via-white/[.025] to-lime-400/[.04] p-5 sm:p-7">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-orange-300"><Zap className="size-4" /> Quick actions</div>
                <h2 className="mt-2 text-2xl font-black text-white">The next move</h2>
                <div className="mt-5 grid gap-2">
                  <button onClick={() => setTab("autodiscover")} className="flex items-center justify-between rounded-2xl bg-orange-400 px-4 py-3 text-left text-xs font-black text-black transition hover:bg-orange-300"><span className="flex items-center gap-2"><Search className="size-4" /> Find businesses</span><ArrowRight className="size-4" /></button>
                  <Link href="/funnelspy" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-black text-white transition hover:bg-white/[.08]"><span className="flex items-center gap-2"><Activity className="size-4 text-violet-300" /> Run audit</span><ArrowRight className="size-4" /></Link>
                  <Link href="/otom" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-black text-white transition hover:bg-white/[.08]"><span className="flex items-center gap-2"><Layers className="size-4 text-orange-300" /> Create OTOM</span><ArrowRight className="size-4" /></Link>
                  <Link href="/proposals/new" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-black text-white transition hover:bg-white/[.08]"><span className="flex items-center gap-2"><FileText className="size-4 text-lime-300" /> Prepare proposal</span><ArrowRight className="size-4" /></Link>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Active business</div>
                    <h2 className="mt-1 text-2xl font-black text-white">{sel?.name || "Select a business"}</h2>
                    <p className="mt-1 text-xs text-slate-500">{sel?.domain || "The pipeline will start once you add a real domain."}</p>
                  </div>
                  {sel && <select value={sel.id} onChange={event => setSelId(Number(event.target.value))} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-white">
                    {bizs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>}
                </div>

                {sel ? <>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {label:"Audit",value:selectedAudit ? `${selectedAudit.score}/100` : "Pending",ok:Boolean(selectedAudit)},
                      {label:"Funnel",value:selFun ? "Created" : "Pending",ok:Boolean(selFun)},
                      {label:"Contact",value:selCon?.email ? "Available" : "Pending",ok:Boolean(selCon?.email)},
                      {label:"Proposal",value:selectedProposal?.status || "Pending",ok:Boolean(selectedProposal)},
                    ].map(item => <div key={item.label} className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{item.label}</span><strong className={`mt-2 block text-sm ${item.ok ? "text-lime-300" : "text-amber-300"}`}>{item.value}</strong></div>)}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={`/funnelspy?url=${encodeURIComponent(sel.domain)}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/[.06]">Analyze</Link>
                    <button onClick={() => setTab("funnels")} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/[.06]">View funnel</button>
                    <button onClick={() => setTab("outreach")} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/[.06]">Prepare pitch</button>
                    {selFun && <Link href={`/en/funnel/${selFun.slug}`} target="_blank" className="rounded-xl bg-orange-400 px-4 py-2.5 text-xs font-black text-black hover:bg-orange-300">Open preview</Link>}
                  </div>
                  {selectedCampaign && <p className="mt-4 text-[10px] text-slate-500">Current campaign: <span className="font-bold text-slate-300">{selectedCampaign.status}</span></p>}
                </> : <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">No businesses saved.</div>}
              </div>

              <div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-5 sm:p-7">
                <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-300">Attention queue</div>
                <h2 className="mt-1 text-2xl font-black text-white">What&apos;s left to sell</h2>
                <div className="mt-5 space-y-2">
                  {[
                    {label:"No audit linked",value:businessesWithoutAudit,action:() => setTab("discover")},
                    {label:"No funnel or preview",value:businessesWithoutFunnel,action:() => setTab("funnels")},
                    {label:"No contact with email",value:businessesWithoutContact,action:() => setTab("contacts")},
                    {label:"Verified contacts",value:verifiedContacts.length,action:() => setTab("contacts")},
                  ].map(item => <button key={item.label} onClick={item.action} className="flex w-full items-center justify-between rounded-2xl border border-white/[.07] bg-black/20 px-4 py-3 text-left transition hover:border-orange-300/30 hover:bg-white/[.04]"><span className="text-xs font-bold text-slate-300">{item.label}</span><strong className="text-lg font-black text-white">{item.value}</strong></button>)}
                </div>
                <p className="mt-4 text-[10px] leading-4 text-slate-600">Counts are calculated from saved businesses, audits, funnels, contacts, campaigns, and proposals. They do not include seed data.</p>
              </div>
            </section>
          </div>
        )}

        {/* ===== TAB 0: AUTO-DISCOVER ===== */}
        {tab === "autodiscover" && (
          <AutoDiscovery />
        )}

        {/* ===== TAB 1: DISCOVER ===== */}
        {tab === "discover" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 border border-emerald-800/40 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-black text-white mb-1">Universal Business Explorer</h2>
              <p className="text-sm text-slate-300">Discover businesses of <strong>any industry, size, or revenue</strong>. From freelancers to large corporations. The funnel + ads work for everyone.</p>
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
                <input type="text" placeholder="Search business or domain..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
                {["all","Spain","Canada","United States","Mexico","Argentina","Colombia","Chile"].map(c => (
                  <button key={c} onClick={() => setCountryFilter(c)} className={`px-2.5 py-1 rounded-lg font-medium transition ${countryFilter===c?"bg-emerald-600 text-white":"text-slate-400 hover:text-white"}`}>{c==="all"?"🌍 All":c}</button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Clear search, country, and business type"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset filters
              </button>
              <span className="text-xs text-slate-400 ml-auto hidden sm:inline">Showing <strong className="text-white">{filtered.length}</strong> businesses</span>
            </div>

            {/* Grid - ANY SIZE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(b => {
                const ind = getInd(b.businessType);
                const isSel = b.id === sel?.id;
                const revLabel = b.monthlyRevenue <= 0 ? "Not verified" : b.monthlyRevenue < 5000 ? "Micro (<5k)" : b.monthlyRevenue < 25000 ? "Small (5k-25k)" : b.monthlyRevenue < 100000 ? "Medium (25k-100k)" : "Large (100k+)";
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
                        <span className="bg-slate-800 border border-slate-700 text-embossed text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-300"/>{b.country}
                        </span>
                      </div>
                      <div className="space-y-1.5 py-3 border-y border-slate-800/80 my-3 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Type:</span><span className="font-semibold" style={{color:ind.color}}>{ind.label.split("·")[0].trim()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Niche:</span><span className="text-slate-200 font-medium">{b.niche}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Technology:</span><span className="text-cyan-300 font-medium">{b.platform || "Website"}{b.technologyData?.technologies?.length ? ` · ${b.technologyData.technologies.length} signals` : ""}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Revenue:</span><span className="font-bold text-emerald-400">{b.monthlyRevenue > 0 ? `€${b.monthlyRevenue.toLocaleString()}/mo` : "Not verified"}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Size:</span><span className="text-slate-300 font-mono text-[11px]">{revLabel}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Offer:</span><span className="text-slate-200 truncate max-w-[170px]">{b.heroOffer}</span></div>
                      </div>
                      <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-2.5 text-xs text-emerald-200 flex items-start gap-2 mb-4">
                        <Flame className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                        <div><strong className="text-white block">{b.painPoint}</strong>
                        <span>Financial potential requires verified traffic, conversion, sales, and investment.</span></div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => {setSelId(b.id);setTab("funnels");}} className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-400"/>View Funnel</button>
                        <button onClick={() => {setSelId(b.id);setTab("contacts");}} className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-400"/>Contact</button>
                      </div>
                      <button onClick={() => runBlueprint(b)} className="w-full bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2">
                        <Zap className="w-3.5 h-3.5 fill-white"/>Full Blueprint
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
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:sel.brandColor||"#6366F1"}}>{selInd.emoji} Step 2: Universal Free Funnel</p>
                  <h2 className="text-2xl font-black text-white">Funnel for {sel.name} ({selInd.label.split("·")[0].trim()})</h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">Works for <strong>any business and any revenue</strong>. The funnel is adapted to the sector and generates immediate extra revenue.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selFun && <Link href={`/en/funnel/${selFun.slug}`} target="_blank" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap">
                    <ExternalLink className="w-4 h-4"/>Open Live Funnel
                  </Link>}
                  {selFun && <button
                    type="button"
                    onClick={deleteSelectedFunnel}
                    disabled={deletingFunnels}
                    className="bg-red-950 hover:bg-red-900 disabled:opacity-40 border border-red-800 text-red-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4"/>
                    Delete this funnel
                  </button>}
                  <button
                    type="button"
                    onClick={deleteAllFunnels}
                    disabled={!funs.length || deletingFunnels}
                    className="bg-red-950 hover:bg-red-900 disabled:opacity-40 border border-red-800 text-red-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4"/>
                    {deletingFunnels ? "Deleting..." : `Delete all (${funs.length})`}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400"/>Custom Funnel</h3>
                  <div><label className="text-xs text-slate-400 font-semibold block mb-1">Business:</label>
                    <select value={sel.id} onChange={e => setSelId(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-emerald-500">
                      {bizs.map(b => <option key={b.id} value={b.id}>{getInd(b.businessType).emoji} {b.name} (€{b.monthlyRevenue.toLocaleString()}/mo)</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-slate-400 font-semibold block mb-1">Generated headline:</label>
                    <textarea readOnly rows={2} value={selFun?.headline||selInd.funnelHeadline(sel.name, sel.heroOffer||"")} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-3"/>
                  </div>
                  <div><label className="text-xs text-slate-400 font-semibold block mb-1">Generated offer:</label>
                    <input readOnly type="text" value={selFun?.offerBadge||selInd.funnelBadge} className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2"/>
                  </div>
                  {funnelError && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-3">{funnelError}</p>}
                  <button onClick={regenerateFunnel} disabled={funnelGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4"/>{funnelGenerating ? "Generating with AI..." : selFun ? "Regenerate Funnel with AI" : "Generate Funnel with AI"}
                  </button>
                  <div className="bg-slate-950 border border-emerald-900/60 rounded-xl p-3.5 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">Public Link:</span>
                    <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs">
                      <span className="font-mono text-emerald-400 truncate">/funnel/{selFun?.slug||"funnel"}</span>
                      <button onClick={() => copy(`${typeof window!=="undefined"?window.location.origin:""}/en/funnel/${selFun?.slug}`,"url")} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 flex items-center gap-1">
                        {copied==="url"?<Check className="w-3 h-3"/>:<Copy className="w-3 h-3"/>}{copied==="url"?"Copied":"Copy"}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setTab("outreach")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                    Step 4: Draft Email <ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="lg:col-span-7">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      {selLayout?.logoUrl ? <Image loader={externalImageLoader} unoptimized src={selLayout.logoUrl} alt="" width={112} height={32} className="h-8 w-auto max-w-28 object-contain"/> : <div className="grid size-8 place-items-center rounded-lg text-sm font-black text-white" style={{backgroundColor:selFun?.customPrimaryColor||sel.brandColor||"#6366F1"}}>{sel.name.charAt(0)}</div>}
                      <span className="text-sm font-black">{sel.name}</span>
                    </div>
                    <div className="hidden gap-3 text-[9px] font-bold opacity-70 sm:flex">
                      {(selLayout?.navigation || ["Home", "Benefits", "Offer"]).slice(0,4).map((item:string) => <span key={item}>{item}</span>)}
                    </div>
                  </div>
                  <div
                    className="overflow-hidden rounded-xl border border-white/10"
                    style={{
                      backgroundColor: selLayout?.backgroundColor || "#090d18",
                      color: selLayout?.textColor || "#ffffff",
                      fontFamily: selLayout?.fontFamily || "inherit",
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {selLayout?.logoUrl ? <Image loader={externalImageLoader} unoptimized src={selLayout.logoUrl} alt="" width={112} height={32} className="h-8 w-auto max-w-28 object-contain"/> : <div className="grid size-8 place-items-center rounded-lg text-sm font-black text-white" style={{backgroundColor:selFun?.customPrimaryColor||sel.brandColor||"#6366F1"}}>{sel.name.charAt(0)}</div>}
                        <span className="text-sm font-black">{sel.name}</span>
                      </div>
                      <div className="hidden gap-3 text-[9px] font-bold opacity-70 sm:flex">
                        {(selLayout?.navigation || ["Home", "Benefits", "Offer"]).slice(0,4).map((item:string) => <span key={item}>{item}</span>)}
                      </div>
                    </div>
                    <div className="grid min-h-[310px] md:grid-cols-2">
                      <div className="flex flex-col justify-center p-6">
                        <span className="mb-3 w-fit rounded-full border border-current/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] opacity-80">{selContent?.eyebrow || selFun?.offerBadge || selInd.funnelBadge}</span>
                        <h4 className="text-2xl font-black leading-[1.04] tracking-tight">{selContent?.headline || selFun?.headline || selInd.funnelHeadline(sel.name,sel.heroOffer||"")}</h4>
                        <p className="mt-3 text-xs leading-5 opacity-70">{selContent?.subheadline || selFun?.subheadline || selInd.funnelSubheadline(sel.name)}</p>
                        <div className="mt-5 flex items-center gap-2">
                          {selFun && <Link href={`/en/funnel/${selFun.slug}`} target="_blank" className="rounded-lg px-4 py-2.5 text-[10px] font-black text-white shadow-lg" style={{backgroundColor:selFun.customPrimaryColor||sel.brandColor||"#6366F1"}}>{selContent?.ctaText || selFun.ctaText || selInd.funnelCta}</Link>}
                          <span className="text-[9px] font-bold opacity-60">Full preview →</span>
                        </div>
                      </div>
                      <div className="relative min-h-48 bg-white/[.04]">
                        {selLayout?.heroImageUrl ? <Image loader={externalImageLoader} unoptimized src={selLayout.heroImageUrl} alt="" fill className="absolute inset-0 object-cover"/> : <div className="absolute inset-0 grid place-items-center p-6" style={{background:`radial-gradient(circle, ${selFun?.customPrimaryColor||sel.brandColor||"#6366F1"}55, transparent 68%)`}}><div className="rounded-2xl border border-white/15 bg-black/25 p-5 text-center backdrop-blur"><span className="text-4xl">{selInd.emoji}</span><p className="mt-2 text-sm font-black">{selOtom?.coreOffer?.name || selContent?.offer || sel.heroOffer}</p></div></div>}
                      </div>
                    </div>
                    {selOtom && <div className="grid grid-cols-3 border-t border-white/10 text-center">
                      {[["HOOK",selOtom.hook],["CORE",selOtom.coreOffer],["UPSELL",selOtom.upsell]].map(([label,item]:any) => <div key={label} className="border-r border-white/10 p-3 last:border-r-0"><span className="text-[8px] font-black tracking-widest opacity-45">{label}</span><p className="mt-1 truncate text-[10px] font-bold">{item?.name}</p></div>)}
                    </div>}
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
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">👤 Step 3: Find the Decision-Maker</p>
              <h2 className="text-2xl font-black text-white">Verified Contacts Directory</h2>
              <p className="text-sm text-slate-300 mt-1">Email of the founder, CEO, or manager of any business. Verification score above 95%.</p>
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
                      <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-300"/>{c.confidenceScore}%</span>
                    </div>
                    <div className="space-y-1.5 py-3 border-y border-slate-800 text-xs">
                      <div className="flex justify-between"><span className="text-slate-400">Business:</span><span className="font-bold text-white">{ind.emoji} {biz?.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Industry:</span><span className="font-semibold" style={{color:ind.color}}>{ind.label.split("·")[0].trim()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="font-mono text-indigo-300 font-semibold">{c.email}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Revenue:</span><span className="font-bold text-emerald-400">{biz && biz.monthlyRevenue > 0 ? `€${biz.monthlyRevenue.toLocaleString()}/mo` : "Not verified"}</span></div>
                    </div>
                    <button onClick={() => {if(biz)setSelId(biz.id);setTab("outreach");}} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
                      <Mail className="w-3.5 h-3.5"/>Draft Email
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TAB 4: OUTREACH ===== */}
        {tab === "outreach" && sel && (
          <section className="pitch-module">
            <header className="module-header rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-400/[.09] via-white/[.025] to-violet-400/[.08] p-6">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-300">Step 4 · Cold Outreach</p><h2 className="mt-2 text-2xl font-black text-white md:text-3xl">Email + Loom script for {sel.name}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Consultative draft based on the business, the offer, detected problems, and the preview. Review any claim before approving the send.</p></div>
                <button onClick={generateCurrentOutreach} disabled={outreachGenerating || !selCon?.email} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-400 px-5 py-3 text-xs font-black text-black disabled:opacity-40"><RefreshCw className={`size-4 ${outreachGenerating ? "animate-spin" : ""}`}/>{outreachGenerating ? "Generating 5 emails..." : outreachDraft ? "Regenerate with AI" : "Generate with AI"}</button>
              </div>
            </header>

            {emailError && <p className="rounded-xl border border-red-500/20 bg-red-500/[.07] p-3 text-xs text-red-200">{emailError}</p>}
            {!selCon?.email && <p className="rounded-xl border border-amber-400/20 bg-amber-400/[.07] p-3 text-xs text-amber-100">This business needs a contact with a real email before generating outreach.</p>}

            <div className="pitch-grid">
              <article className="pitch-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] pb-4"><span className="flex items-center gap-2 text-sm font-black text-white"><Mail className="size-4 text-rose-300"/>Sequence editor</span><span className="text-xs text-slate-500">To <strong className="text-indigo-300">{selCon?.email || "contact pending"}</strong></span></div>
                {outreachSequence.length > 0 ? <>
                  <div className="flex gap-2 overflow-x-auto pb-1">{outreachSequence.map((email:any,index:number) => <button key={email.index || index} onClick={() => {setSelectedEmailIndex(index);setEmailSubject(email.subject);setEmailBody(email.body);}} className={`min-w-24 rounded-xl border px-3 py-2 text-left ${selectedEmailIndex === index ? "border-orange-400/50 bg-orange-400/[.09]" : "border-white/[.07] bg-black/15"}`}><span className="block text-[9px] font-black uppercase text-orange-300">Email {index + 1}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{email.purpose}</span></button>)}</div>
                  <div className="email-editor"><label><span>Subject</span><input value={emailSubject} onChange={event => setEmailSubject(event.target.value)}/></label><label><span>Editable body</span><textarea value={emailBody} onChange={event => setEmailBody(event.target.value)}/></label><div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[.05] p-3 text-xs text-cyan-100"><strong>CTA:</strong> {outreachSequence[selectedEmailIndex]?.cta}</div></div>
                  <div className="email-actions"><button onClick={() => copy(`Subject: ${emailSubject}\n\n${emailBody}`,"email")} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold">{copied === "email" ? <Check className="size-4 text-emerald-300"/> : <Copy className="size-4"/>}{copied === "email" ? "Copied" : "Copy email"}</button><Link href={`/outreach/campaigns/new?businessId=${sel.id}`} className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-black text-white">Review and approve <ArrowRight className="size-4"/></Link></div>
                </> : <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center"><div><Mail className="mx-auto size-8 text-slate-600"/><h3 className="mt-3 font-black text-white">No sequence generated yet</h3><p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">Generate five personalized emails. Subject, body, CTA, and data requiring verification will appear here.</p></div></div>}
              </article>

              <aside className="pitch-card">
                <div className="flex items-center justify-between gap-3 border-b border-white/[.07] pb-4"><span className="flex items-center gap-2 text-sm font-black text-white"><Video className="size-4 text-violet-300"/>Loom script</span><span className="rounded-full border border-violet-300/20 bg-violet-300/[.07] px-2.5 py-1 text-[9px] font-black uppercase text-violet-200">90 seconds</span></div>
                {loomSegments.length ? <div className="loom-timeline">{loomSegments.map((segment:any,index:number) => <div key={`${segment.time}-${index}`} className="loom-step"><span className="text-[9px] font-black uppercase tracking-wider text-orange-300">{segment.time}</span><h3 className="mt-1 text-sm font-black text-white">{segment.label}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{segment.copy}</p></div>)}</div> : <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/10 p-8 text-center text-xs leading-5 text-slate-500">The timeline will appear alongside the email sequence.</div>}
                {outreachDraft?.claimsToVerify?.length > 0 && <div className="rounded-xl border border-amber-400/15 bg-amber-400/[.06] p-4"><span className="text-[9px] font-black uppercase tracking-wider text-amber-300">Verify before approving</span><ul className="mt-2 space-y-1 text-xs text-amber-100/70">{outreachDraft.claimsToVerify.map((claim:string) => <li key={claim}>· {claim}</li>)}</ul></div>}
              </aside>
            </div>

            <footer className="module-footer"><button onClick={() => setTab("contacts")} className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black text-slate-300">← Back to contacts</button><button onClick={() => setTab("calculator")} className="flex items-center gap-2 rounded-xl bg-orange-400 px-5 py-3 text-xs font-black text-black">Continue to step 5 <ArrowRight className="size-4"/></button></footer>
          </section>
        )}

        {/* ===== TAB 5: CALCULATOR ===== */}
        {tab === "calculator" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 border border-amber-800/40 rounded-2xl p-6 shadow-xl">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">🚀 Step 5: Universal Rev-Share Model</p>
              <h2 className="text-2xl font-black text-white">Extra Revenue and Commission Calculator</h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl">Editable model for exploring scenarios. Starts at zero and does not represent revenue, results, or guarantees until verified metrics are entered.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                <h3 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3"><DollarSign className="w-4 h-4 text-emerald-400"/>Business Parameters</h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-300 font-semibold">Current Monthly Revenue:</span>
                    <span className="font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">€{calcRev.toLocaleString()}/mo</span>
                  </div>
                  <input type="range" min={0} max={500000} step={500} value={calcRev} onChange={e => setCalcRev(parseInt(e.target.value))} className="w-full accent-emerald-500"/>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono"><span>1k€</span><span>250k€</span><span>500k€+</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-300 font-semibold">Increase with Funnel + Ads:</span>
                    <span className="font-black text-indigo-400 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-lg">+{calcLift}%</span>
                  </div>
                  <input type="range" min={0} max={60} step={1} value={calcLift} onChange={e => setCalcLift(parseInt(e.target.value))} className="w-full accent-indigo-500"/>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-300 font-semibold">Your Commission (%):</span>
                    <span className="font-black text-amber-400 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-lg">{calcShare}%</span>
                  </div>
                  <input type="range" min={0} max={40} step={1} value={calcShare} onChange={e => setCalcShare(parseInt(e.target.value))} className="w-full accent-amber-500"/>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6">
                <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Result per Business:</span>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                      <span className="text-[11px] text-slate-400 block">Extra Revenue for the Business:</span>
                      <span className="text-2xl font-black text-white block mt-1">+€{calcExtra.toLocaleString()}</span>
                      <span className="text-[10px] text-indigo-400">scenario, not a projected result</span>
                    </div>
                    <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-xl p-4">
                      <span className="text-[11px] text-emerald-300 font-bold block">Your Earnings (MRR):</span>
                      <span className="text-3xl font-black text-emerald-400 block mt-1">€{calcFee.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-300 font-medium">per month, recurring</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs"><Flame className="w-4 h-4"/>€10,000/mo Formula:</div>
                    <p className="text-xs text-slate-300">{needClients ? <>With the values you entered, the math requires <strong className="text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">{needClients} business{needClients > 1 ? "es" : ""}</strong>. Confirm all metrics before presenting it.</> : "Enter verified metrics to calculate this scenario."}</p>
                  </div>
                </div>

                {sel && <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-emerald-400"/>Recommended Platform for {selInd.emoji} {selInd.label.split("·")[0].trim()}:</span>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                    <span className="font-bold text-indigo-300 block mb-1">📢 {selInd.adPlatform}</span>
                    <p className="text-slate-300 italic">&ldquo;{selInd.adHook(sel.name,sel.heroOffer||"")}&rdquo;</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                    <span className="font-bold text-emerald-300 block mb-1">📝 Ad Copy:</span>
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
                <h2 className="text-2xl font-black text-white">Universal CRM Pipeline</h2>
                <p className="text-xs text-slate-400">Tracking businesses across any industry. Focused on extra revenue.</p>
              </div>
              <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl">{bizs.length} Businesses</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {([
                {k:"discovered",t:"1. Discovered",c:"border-amber-500"},
                {k:"funnel_ready",t:"2. Funnel Created",c:"border-indigo-500"},
                {k:"contact_found",t:"3. Contact Found",c:"border-emerald-500"},
                {k:"pitch_sent",t:"4. Pitch Sent",c:"border-purple-500"},
                {k:"closed_deal",t:"5. Deal Closed (€/mo)",c:"border-cyan-500"},
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
                      {items.length===0 && <p className="text-[11px] text-slate-500 text-center py-4 italic">No businesses</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ===== BLUEPRINT MODAL ===== */}
      {autoRun && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 via-purple-600 to-rose-500 flex items-center justify-center shadow-lg"><Target className="w-7 h-7 text-white animate-pulse"/></div>
              <h3 className="text-xl font-black text-white">1-Click Blueprint with EcoScale Partner</h3>
              <p className="text-xs text-slate-400">Automating for: <strong className="text-white">{autoName}</strong></p>
            </div>
            <div className="space-y-3 text-xs">
              {[
                {s:1,t:`${selInd.emoji} 1. Analyzing with EcoScale Partner`},
                {s:2,t:`🎨 2. Generating funnel adapted to ${selInd.label.split("·")[0].trim()}`},
                {s:3,t:`👤 3. Extracting verified email`},
                {s:4,t:`✉️ 4. Drafting pitch + 90s Loom`},
                {s:5,t:`🚀 5. Assets ready for review`},
              ].map(st => (
                <div key={st.s} className={`p-3 rounded-xl border flex items-center justify-between transition ${autoStep>=st.s?(st.s===5?"bg-emerald-950/80 border-emerald-600 text-emerald-200":"bg-indigo-950/60 border-indigo-600 text-white"):"bg-slate-950 border-slate-800 text-slate-500"}`}>
                  <span>{st.t}</span>
                  {autoStep>=st.s?<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/>:<RefreshCw className="w-4 h-4 animate-spin text-slate-600"/>}
                </div>
              ))}
            </div>
            {blueprintError && <div className="bg-red-950 border border-red-700 text-red-200 text-xs rounded-xl p-3">{blueprintError}</div>}
            {autoStep>=5 && <button onClick={() => { if (blueprintCampaignId) window.location.href=`/campaign/${blueprintCampaignId}`; }} className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">Blueprint Complete! View Dossier <ArrowRight className="w-4 h-4"/></button>}
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAVIGATION DOCK ===== */}
      {tab !== "outreach" && <div className="legacy-mobile-dock fixed bottom-0 left-0 right-0 z-40 border-t border-white/[.08] bg-[#070707]/90 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
          {([
            {k:"dashboard" as const, icon:<LayoutDashboard className="size-3.5" />, label:"Dashboard"},
            {k:"autodiscover" as const, icon:<Zap className="size-3.5" />, label:"Discovery"},
            {k:"discover" as const, icon:<Globe className="size-3.5" />, label:"Businesses"},
            {k:"funnels" as const, icon:<Layers className="size-3.5" />, label:"Funnels"},
            {k:"contacts" as const, icon:<UserCheck className="size-3.5" />, label:"Contacts"},
            {k:"outreach" as const, icon:<Mail className="size-3.5" />, label:"Outreach"},
            {k:"calculator" as const, icon:<DollarSign className="size-3.5" />, label:"Revenue"},
            {k:"crm" as const, icon:<BarChart3 className="size-3.5" />, label:"CRM"},
          ]).map(item => (
            <button
              key={item.k}
              onClick={() => setTab(item.k)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                tab === item.k
                  ? "bg-orange-400 text-black shadow-lg shadow-orange-950/30"
                  : "border border-white/[.07] bg-white/[.04] text-slate-400 hover:bg-white/[.08] hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>}

      {/* Add bottom padding to main so content doesn't hide under dock */}
      <div className="h-24" />

      {/* ===== ADD BUSINESS MODAL ===== */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-400"/>Add Any Business</h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              {/* Industry Selector - ALL INDUSTRIES */}
              <div><label className="text-slate-300 font-semibold block mb-2">Business Type:</label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {INDUSTRY_LIST.map(ind => (
                    <button type="button" key={ind.key} onClick={() => {setNType(ind.key);setNNiche(ind.defaultNiche);setNOffer(ind.defaultOffer);setNPrice(ind.defaultPrice);}} className={`p-2.5 rounded-xl border text-center transition ${nType===ind.key?"border-emerald-500 shadow-md text-white":"border-slate-700 text-slate-400 hover:border-slate-600"}`} style={nType===ind.key?{backgroundColor:ind.color}:{backgroundColor:"rgba(30,41,59,0.6)"}}>
                      <span className="text-xl block mb-0.5">{ind.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight">{ind.label.split("·")[0].trim()}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Business Name: *</label>
                <input type="text" required placeholder="e.g. Restaurant, Gym, Shop..." value={nName} onChange={e => setNName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Website Domain:</label>
                <input type="text" required placeholder="e.g. business.com" value={nDomain} onChange={e => setNDomain(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Main Offer / Service:</label>
                <input type="text" placeholder={getInd(nType).defaultOffer} value={nOffer} onChange={e => setNOffer(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-slate-300 font-semibold block mb-1">Niche:</label>
                  <select value={nNiche||getInd(nType).defaultNiche} onChange={e => setNNiche(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2">
                    {getInd(nType).niches.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div><label className="text-slate-300 font-semibold block mb-1">Revenue (€/mo):</label>
                  <input type="number" value={nRev} onChange={e => setNRev(parseInt(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-slate-300 font-semibold block mb-1">Average order (€):</label>
                  <input type="number" value={nAov} onChange={e => setNAov(Number(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
                <div><label className="text-slate-300 font-semibold block mb-1">Conversion (%):</label>
                  <input type="number" step="0.1" value={nConversion} onChange={e => setNConversion(Number(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
                <div><label className="text-slate-300 font-semibold block mb-1">Ads €/mo:</label>
                  <input type="number" value={nAdSpend} onChange={e => setNAdSpend(Number(e.target.value)||0)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
                </div>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Price:</label>
                <input type="text" placeholder={getInd(nType).defaultPrice} value={nPrice} onChange={e => setNPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
              </div>
              <div><label className="text-slate-300 font-semibold block mb-1">Contact Name:</label>
                <input type="text" placeholder="e.g. John Smith" value={nContact} onChange={e => setNContact(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2"/>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setAddOpen(false)} className="w-1/2 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={funnelGenerating} className="w-1/2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold">{funnelGenerating ? "Generating..." : "Add and Generate"}</button>
              </div>
              {funnelError && <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-3">{funnelError}</p>}
            </form>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
