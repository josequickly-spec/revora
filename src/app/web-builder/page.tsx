"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Download,
  Laptop,
  LoaderCircle,
  Save,
  Smartphone,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import WebBuilderPreview from "@/components/web-builder/WebBuilderPreview";
import type { WebBuilderRequest, WebBuilderSpec } from "@/lib/web-builder";

const starterSpec: WebBuilderSpec = {
  brand: {
    name: "Business not selected",
    tagline: "Generate from verified business context",
    navigation: ["Home", "Offer", "About", "Contact"],
    primaryColor: "#f97316",
    accentColor: "#f4d19b",
    backgroundColor: "#f7f3ed",
    surfaceColor: "#fffdf9",
    textColor: "#171412",
    fontFamily: "Arial, sans-serif",
    logoUrl: "",
    heroImageUrl: "",
  },
  announcement: "Empty preview · Add a business or FunnelSpy audit",
  hero: {
    eyebrow: "Awaiting verified context",
    headline: "Generate the client website preview.",
    body: "Add a business name or transfer a FunnelSpy audit. No business claims are shown before generation.",
    primaryCta: "Business required",
    secondaryCta: "Audit required",
    route: ["Discover", "Choose", "Upgrade", "Follow up"],
  },
  trustItems: ["Clear next steps", "Transparent options", "Responsive experience", "Client confirmation"],
  categories: [
    { name: "Start here", description: "The simplest entry into the experience." },
    { name: "Most popular", description: "A complete option for the core customer." },
    { name: "Premium", description: "More value for customers ready to go further." },
  ],
  products: [
    { name: "Offer not confirmed", description: "Requires business context", price: 0, category: "Start here", badge: "Pending", imageUrl: "" },
    { name: "Core offer not confirmed", description: "Requires client confirmation", price: 0, category: "Most popular", badge: "Pending", imageUrl: "" },
    { name: "Upsell not confirmed", description: "Requires client confirmation", price: 0, category: "Premium", badge: "Pending", imageUrl: "" },
  ],
  leadMagnet: { eyebrow: "Free resource", headline: "Help the visitor choose with confidence.", body: "Capture interest with a useful resource connected to the core offer.", cta: "Get the guide" },
  story: { eyebrow: "Why this experience", headline: "The brand remains familiar. The path becomes clearer.", body: "This proposed redesign keeps recognizable visual elements while introducing a stronger commercial hierarchy." },
  bundle: { eyebrow: "Offer architecture", headline: "Bundle pending business confirmation.", body: "Generate from business evidence before presenting this section to a client.", price: 0, cta: "Requires confirmation" },
  faq: [
    { question: "Is this the final website?", answer: "No. It is an interactive proposal for client review before implementation." },
    { question: "Are these prices confirmed?", answer: "All proposed products and prices require client confirmation." },
    { question: "Can this connect to Shopify?", answer: "Yes. The approved experience can be implemented with Shopify, Next.js or another commerce stack." },
  ],
  footer: { headline: "Ready to turn this concept into the real experience?", body: "Review the journey, approve the offer and move into implementation.", cta: "Approve direction" },
  projection: { currencyCode: "USD", monthlyTraffic: 0, currentConversionRate: 0, targetConversionRate: 0, currentAverageValue: 0, targetAverageValue: 0 },
  evidenceNotes: ["No business evidence has been supplied yet.", "Products, pricing and projections remain empty until generation."],
  demoDisclaimer: "Empty preview · No business claims, orders or leads",
};

type View = "build" | "preview" | "revenue";
type WebBuilderTransfer = WebBuilderRequest & {
  webBuilderSeed?: {
    brandName?: string;
    eyebrow?: string;
    headline?: string;
    body?: string;
    primaryCta?: string;
    secondaryCta?: string;
    trustItems?: string[];
  };
};

function normalizeSourceUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function AIWebBuilderPage() {
  const [view, setView] = useState<View>("build");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [businessName, setBusinessName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [audience, setAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [context, setContext] = useState<Partial<WebBuilderRequest>>({});
  const [spec, setSpec] = useState<WebBuilderSpec>(starterSpec);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [provider, setProvider] = useState("");
  const selectedLocale = () => window.localStorage.getItem("ecoscale-ui-language") === "en" ? "en" : "es";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const transferred = window.sessionStorage.getItem("revora-web-builder-context");
        const saved = window.localStorage.getItem("revora-web-builder-project");
        if (transferred) {
          const parsed = JSON.parse(transferred) as WebBuilderTransfer;
          window.sessionStorage.removeItem("revora-web-builder-context");
          setContext(parsed);
          setBusinessName(parsed.businessName || "");
          setSourceUrl(parsed.sourceUrl || "");
          setBusinessType(parsed.businessType || "");
          setAudience(parsed.targetAudience || "");
          setOffer(parsed.currentOffer || "");
          setSpec((current) => ({
            ...current,
            brand: {
              ...current.brand,
              name: parsed.webBuilderSeed?.brandName || parsed.businessName || current.brand.name,
              navigation:
                parsed.visualIdentity?.navigation?.length
                  ? parsed.visualIdentity.navigation
                  : current.brand.navigation,
              primaryColor: parsed.visualIdentity?.colors?.[0] || current.brand.primaryColor,
              accentColor:
                parsed.visualIdentity?.colors?.[1] ||
                parsed.visualIdentity?.colors?.[0] ||
                current.brand.accentColor,
              fontFamily: parsed.visualIdentity?.fonts?.[0] || current.brand.fontFamily,
              logoUrl: parsed.visualIdentity?.logoUrl || current.brand.logoUrl,
              heroImageUrl:
                parsed.visualIdentity?.heroImageUrl || current.brand.heroImageUrl,
            },
            hero: {
              ...current.hero,
              eyebrow: parsed.webBuilderSeed?.eyebrow || current.hero.eyebrow,
              headline: parsed.webBuilderSeed?.headline || current.hero.headline,
              body: parsed.webBuilderSeed?.body || current.hero.body,
              primaryCta:
                parsed.webBuilderSeed?.primaryCta || current.hero.primaryCta,
              secondaryCta:
                parsed.webBuilderSeed?.secondaryCta || current.hero.secondaryCta,
            },
            trustItems:
              parsed.webBuilderSeed?.trustItems?.length
                ? parsed.webBuilderSeed.trustItems
                : current.trustItems,
          }));
          setNotice("OTOM received: business context and live brand controls were filled automatically.");
          if (parsed.auditId) {
            fetch(`/api/web-builder/generate?auditId=${encodeURIComponent(parsed.auditId)}&locale=${selectedLocale()}`)
              .then(async (response) => response.ok ? response.json() : null)
              .then((stored) => {
                if (!stored?.spec) return;
                setSpec(stored.spec);
                setProvider(`${stored.provider || "AI"} · ${stored.model || "persisted"}`);
                setView("preview");
                setNotice("Persisted website preview restored from the same FunnelSpy project.");
              })
              .catch(() => undefined);
          }
        } else if (saved) {
          const parsed = JSON.parse(saved) as { spec: WebBuilderSpec; inputs: Record<string, string> };
          if (parsed.spec?.brand?.name === "Your Brand") {
            window.localStorage.removeItem("revora-web-builder-project");
            return;
          }
          setSpec(parsed.spec);
          setBusinessName(parsed.inputs.businessName || "");
          setSourceUrl(parsed.inputs.sourceUrl || "");
          setBusinessType(parsed.inputs.businessType || "");
          setAudience(parsed.inputs.audience || "");
          setOffer(parsed.inputs.offer || "");
        }
      } catch {
        setNotice("The previous builder draft could not be restored.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const revenue = useMemo(() => {
    const current = spec.projection.monthlyTraffic * (spec.projection.currentConversionRate / 100) * spec.projection.currentAverageValue;
    const target = spec.projection.monthlyTraffic * (spec.projection.targetConversionRate / 100) * spec.projection.targetAverageValue;
    return { current, target, lift: Math.max(0, target - current) };
  }, [spec.projection]);
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: spec.projection.currencyCode, maximumFractionDigits: 0 });

  const generate = async () => {
    if (!businessName.trim() && !sourceUrl.trim()) {
      setNotice("Add a business name or transfer a FunnelSpy audit first.");
      return;
    }
    setGenerating(true);
    setNotice("AI is preserving the brand and designing the complete conversion journey...");
    try {
      const payload: WebBuilderRequest = {
        locale: selectedLocale(),
        businessName,
        sourceUrl: normalizeSourceUrl(sourceUrl) || undefined,
        businessType,
        targetAudience: audience,
        currentOffer: offer,
        currentPrice: Number(context.currentPrice || 0),
        primaryObjective: context.primaryObjective || "",
        valueProposition: context.valueProposition || "",
        weaknesses: context.weaknesses || [],
        recommendations: context.recommendations || [],
        evidence: context.evidence || [],
        auditId: context.auditId,
        visualIdentity: context.visualIdentity,
        otomSummary: context.otomSummary || "",
      };
      const response = await fetch("/api/web-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Generation failed");
      setSpec(data.spec);
      setSourceUrl((current) => normalizeSourceUrl(current));
      setProvider(`${data.provider} · ${data.model}`);
      setView("preview");
      setNotice(data.sourceAnalyzed
        ? "Complete preview generated after analyzing the source website. All assumptions remain editable."
        : "Complete client preview generated. All assumptions remain editable.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The preview could not be generated.");
    } finally {
      setGenerating(false);
    }
  };

  const save = () => {
    window.localStorage.setItem("revora-web-builder-project", JSON.stringify({
      spec,
      inputs: { businessName, sourceUrl, businessType, audience, offer },
    }));
    setNotice("Draft saved in this local browser.");
  };

  const exportProject = () => {
    const blob = new Blob([JSON.stringify({ spec, businessName, sourceUrl, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(businessName || "web-preview").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-builder.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateBrand = (field: keyof WebBuilderSpec["brand"], value: string) => setSpec((current) => ({ ...current, brand: { ...current.brand, [field]: value } }));
  const updateHero = (field: keyof WebBuilderSpec["hero"], value: string) => setSpec((current) => ({ ...current, hero: { ...current.hero, [field]: value } }));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] text-slate-100 selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(249,115,22,.16),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(34,211,238,.09),transparent_24%)]" />
      <header className="relative z-20 border-b border-white/[.07] bg-[#070707]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-300 text-black shadow-lg shadow-orange-500/20"><WandSparkles className="size-5" /></span><div><strong className="block tracking-tight">AI Web Builder</strong><span className="text-[9px] uppercase tracking-[.25em] text-slate-600">Brand-preserving conversion preview</span></div></div>
          <nav className="flex rounded-xl border border-white/[.08] bg-white/[.03] p-1">{(["build", "preview", "revenue"] as View[]).map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${view === item ? "bg-white text-black" : "text-slate-500 hover:text-white"}`}>{item}</button>)}</nav>
          <div className="flex items-center gap-2"><button onClick={save} aria-label="Save builder project" className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-400"><Save className="size-4" /></button><button onClick={exportProject} aria-label="Export builder project" className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-400"><Download className="size-4" /></button><Link href="/otom" className="hidden items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 sm:flex"><ArrowLeft className="size-3.5" />OTOM</Link><button onClick={generate} disabled={generating} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-black shadow-lg shadow-orange-500/20 disabled:opacity-60">{generating ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}<span className="hidden sm:inline">{generating ? "Building..." : "Generate website"}</span></button></div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1600px] px-5 py-8">
        {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-2xl border border-lime-400/20 bg-lime-400/[.07] px-4 py-3 text-sm text-lime-100"><Check className="size-4 text-lime-300" />{notice}{provider && <span className="ml-auto text-[10px] uppercase tracking-wider text-lime-300/60">{provider}</span>}</div>}
        <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/[.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-orange-300"><span className="size-1.5 animate-pulse rounded-full bg-orange-300" />Interactive client prototype</div><h1 className="max-w-5xl text-4xl font-black leading-none tracking-[-.045em] text-white md:text-6xl">Rebuild the experience. <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-lime-300 bg-clip-text text-transparent">Keep the brand.</span></h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Turn FunnelSpy evidence and an OTOM strategy into a complete website preview with products, lead capture, cart, upsells and explainable revenue scenarios.</p></div><div className="flex rounded-xl border border-white/[.08] bg-white/[.03] p-1"><button onClick={() => setDevice("desktop")} className={`grid size-10 place-items-center rounded-lg ${device === "desktop" ? "bg-white text-black" : "text-slate-500"}`}><Laptop className="size-4" /></button><button onClick={() => setDevice("mobile")} className={`grid size-10 place-items-center rounded-lg ${device === "mobile" ? "bg-white text-black" : "text-slate-500"}`}><Smartphone className="size-4" /></button></div></section>

        {view !== "revenue" ? <div className={`grid gap-6 ${view === "build" ? "xl:grid-cols-[330px_1fr]" : ""}`}>
          {view === "build" && <aside className="space-y-4 rounded-3xl border border-white/[.08] bg-white/[.025] p-5"><div><span className="text-[10px] font-black uppercase tracking-[.18em] text-orange-300">01 · Source</span><h2 className="mt-2 text-xl font-black">Build from evidence</h2><p className="mt-2 text-xs leading-5 text-slate-500">Use a FunnelSpy transfer for the closest brand match, or enter the core context manually.</p></div>{[
            ["Business", businessName, setBusinessName, "Business name"],
            ["Source URL", sourceUrl, setSourceUrl, "https://example.com"],
            ["Business type", businessType, setBusinessType, "Ecommerce, clinic, museum..."],
          ].map(([label, value, setter, placeholder]) => <label key={String(label)} className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{String(label)}</span><input value={String(value)} onChange={(event) => (setter as (value: string) => void)(event.target.value)} placeholder={String(placeholder)} className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-orange-400/50" /></label>)}<label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Audience</span><textarea value={audience} onChange={(event) => setAudience(event.target.value)} className="min-h-20 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm outline-none focus:border-orange-400/50" /></label><label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Current offer</span><textarea value={offer} onChange={(event) => setOffer(event.target.value)} className="min-h-24 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm outline-none focus:border-orange-400/50" /></label><div className="border-t border-white/[.07] pt-4"><span className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">Live brand controls</span><div className="mt-3 grid grid-cols-2 gap-3"><label><span className="mb-1 block text-[9px] text-slate-500">Primary</span><input type="color" value={spec.brand.primaryColor.match(/^#[0-9a-f]{6}$/i) ? spec.brand.primaryColor : "#f97316"} onChange={(event) => updateBrand("primaryColor", event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-black/25 p-1" /></label><label><span className="mb-1 block text-[9px] text-slate-500">Accent</span><input type="color" value={spec.brand.accentColor.match(/^#[0-9a-f]{6}$/i) ? spec.brand.accentColor : "#f4d19b"} onChange={(event) => updateBrand("accentColor", event.target.value)} className="h-10 w-full rounded-lg border border-white/10 bg-black/25 p-1" /></label></div><input value={spec.brand.name} onChange={(event) => updateBrand("name", event.target.value)} className="mt-3 h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold" /><textarea value={spec.hero.headline} onChange={(event) => updateHero("headline", event.target.value)} className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-xs font-bold" /></div><button onClick={generate} disabled={generating} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-black text-black disabled:opacity-60">{generating ? <LoaderCircle className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}Generate complete preview</button></aside>}
          <section className="rounded-3xl border border-white/[.08] bg-white/[.025] p-3 md:p-6"><div className="mb-4 flex items-center justify-between px-1"><div><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Live render</span><strong className="mt-1 block text-sm">{spec.brand.name}</strong></div><span className="rounded-full border border-orange-400/20 bg-orange-400/[.07] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-orange-300">Interactive demo</span></div><WebBuilderPreview spec={spec} device={device} /></section>
        </div> : <section className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><article className="rounded-3xl border border-white/[.08] bg-white/[.03] p-6"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Current scenario</span><strong className="mt-3 block text-4xl font-black text-slate-300">{money.format(revenue.current)}</strong><p className="mt-2 text-xs text-slate-500">Editable assumption, not verified revenue.</p></article><article className="rounded-3xl border border-orange-400/20 bg-orange-400/[.06] p-6"><span className="text-[10px] font-black uppercase tracking-[.16em] text-orange-300">Target scenario</span><strong className="mt-3 block text-4xl font-black text-orange-200">{money.format(revenue.target)}</strong><p className="mt-2 text-xs text-slate-500">Traffic × conversion × average value.</p></article><article className="rounded-3xl border border-lime-400/20 bg-lime-400/[.06] p-6"><span className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300">Modeled lift</span><strong className="mt-3 block text-4xl font-black text-lime-200">+{money.format(revenue.lift)}</strong><p className="mt-2 text-xs text-slate-500">Planning potential, never a guarantee.</p></article></div><div className="grid gap-6 xl:grid-cols-[1fr_360px]"><div className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6"><div className="flex items-center gap-3"><BarChart3 className="size-5 text-cyan-300" /><div><span className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">Revenue model</span><h2 className="text-xl font-black">Explain every assumption</h2></div></div><div className="mt-8 grid gap-4 md:grid-cols-2">{([
            ["Monthly traffic", "monthlyTraffic", spec.projection.monthlyTraffic],
            ["Current conversion %", "currentConversionRate", spec.projection.currentConversionRate],
            ["Target conversion %", "targetConversionRate", spec.projection.targetConversionRate],
            ["Current average value", "currentAverageValue", spec.projection.currentAverageValue],
            ["Target average value", "targetAverageValue", spec.projection.targetAverageValue],
          ] as const).map(([label, field, value]) => <label key={field}><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-500">{label}</span><input type="number" min="0" step="0.1" value={value} onChange={(event) => setSpec((current) => ({ ...current, projection: { ...current.projection, [field]: Number(event.target.value) } }))} className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 font-bold outline-none focus:border-orange-400/50" /></label>)}</div></div><aside className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6"><span className="text-[10px] font-black uppercase tracking-[.16em] text-violet-300">Evidence and limits</span><div className="mt-4 space-y-3">{spec.evidenceNotes.map((note) => <div key={note} className="flex gap-3 rounded-2xl border border-white/[.06] bg-black/20 p-4 text-xs leading-5 text-slate-400"><Check className="mt-0.5 size-4 shrink-0 text-violet-300" />{note}</div>)}</div><p className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/[.06] p-4 text-xs leading-5 text-amber-100/70">{spec.demoDisclaimer}</p></aside></div></section>}
      </main>
    </div>
  );
}
