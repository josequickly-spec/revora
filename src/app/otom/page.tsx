"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Eye,
  BadgeCheck,
  Download,
  Laptop,
  LayoutTemplate,
  LoaderCircle,
  Mail,
  MousePointerClick,
  Play,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  WandSparkles,
  X,
} from "lucide-react";
import type { BusinessProfile } from "@/lib/business-profile";

type Scenario = "actual" | "conservative" | "target" | "potential";
type View = "strategy" | "preview" | "revenue" | "presentation";
type PageSpec = {
  brandName: string;
  navigation: string[];
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  trustItems: string[];
  heroVisualConcept: string;
  leadCaptureHeadline: string;
  leadCaptureBody: string;
  leadCaptureCta: string;
  thankYouHeadline: string;
  thankYouBody: string;
  preserveOriginalDesign?: boolean;
  logoUrl?: string;
  heroImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  fontFamily?: string;
  headerStyle?: string;
  sectionOrder?: string[];
};
type GeneratedOTOM = {
  hook: { name: string; description: string; pricePoint: number };
  coreOffer: { name: string; description: string; pricePoint: number };
  upsell: { name: string; description: string; pricePoint: number };
  downsell: { name: string; description: string; pricePoint: number };
  followUp: Record<string, string>;
  landingPage: PageSpec;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function safeColor(value: string | undefined, fallback: string) {
  return value && /^(#[0-9a-f]{3,8}|rgb[a]?\([^)]*\)|hsl[a]?\([^)]*\))$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

function Field({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </span>
      <div className="flex items-center rounded-xl border border-white/10 bg-black/25 px-3 focus-within:border-orange-400/50">
        {prefix && <span className="text-sm text-slate-500">{prefix}</span>}
        <input
          aria-label={label}
          type="number"
          min="0"
          step="0.1"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 w-full bg-transparent px-2 text-sm font-bold text-white outline-none"
        />
      </div>
    </label>
  );
}

function Metric({
  label,
  value,
  note,
  tone = "orange",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "orange" | "lime" | "cyan" | "violet";
}) {
  const colors = {
    orange: "text-orange-300",
    lime: "text-lime-300",
    cyan: "text-cyan-300",
    violet: "text-violet-300",
  };
  return (
    <article className="rounded-2xl border border-white/[.08] bg-white/[.035] p-5">
      <span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </span>
      <strong
        className={`mt-2 block text-3xl font-black tracking-tight ${colors[tone]}`}
      >
        {value}
      </strong>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </article>
  );
}

export default function OtomStudioPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("strategy");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [presenting, setPresenting] = useState(false);
  const [business, setBusiness] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [currentOffer, setCurrentOffer] = useState("");
  const [audience, setAudience] = useState("");
  const [traffic, setTraffic] = useState(0);
  const [currentConversion, setCurrentConversion] = useState(0);
  const [targetConversion, setTargetConversion] = useState(0);
  const [corePrice, setCorePrice] = useState(0);
  const [upsellPrice, setUpsellPrice] = useState(0);
  const [upsellTakeRate, setUpsellTakeRate] = useState(0);
  const [emailRecovery, setEmailRecovery] = useState(0);
  const [implementationPrice, setImplementationPrice] = useState(0);
  const [generated, setGenerated] = useState<GeneratedOTOM | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [pageSpec, setPageSpec] = useState<PageSpec | null>(null);
  const [generating, setGenerating] = useState(false);
  const [projectStatus, setProjectStatus] = useState<"draft" | "approved">(
    "draft",
  );
  const [notice, setNotice] = useState("");
  const [builderContext, setBuilderContext] = useState<Record<string, unknown>>({});
  const [previewStep, setPreviewStep] = useState(0);
  const autoFlowRef = useRef(false);
  const autoForwardedRef = useRef(false);
  const selectedLocale = () => window.localStorage.getItem("ecoscale-ui-language") === "en" ? "en" : "es";

  const handoffToWebBuilder = useCallback((nextContext: Record<string, unknown>, nextData: { profile: BusinessProfile; otom: GeneratedOTOM }) => {
    window.sessionStorage.setItem(
      "revora-web-builder-context",
      JSON.stringify({
        ...nextContext,
        businessId: nextContext.businessId,
        businessName: nextContext.businessName || nextData.profile.businessName.value,
        businessType: nextContext.businessType || nextData.profile.businessType.value,
        targetAudience: nextContext.targetAudience || nextData.profile.targetAudience.value,
        currentOffer: nextContext.currentOffer || nextData.profile.currentOffer.value,
        currentPrice: nextContext.currentPrice || nextData.profile.currentPrice.value || nextData.otom.coreOffer.pricePoint,
        visualIdentity: nextContext.visualIdentity || {},
        webBuilderSeed: {
          brandName: nextData.otom.landingPage.brandName,
          eyebrow: nextData.otom.landingPage.eyebrow,
          headline: nextData.otom.landingPage.headline,
          body: nextData.otom.landingPage.subheadline,
          primaryCta: nextData.otom.landingPage.primaryCta,
          secondaryCta: nextData.otom.landingPage.secondaryCta,
          trustItems: nextData.otom.landingPage.trustItems,
        },
        otomSummary: JSON.stringify({
          hook: nextData.otom.hook,
          coreOffer: nextData.otom.coreOffer,
          upsell: nextData.otom.upsell,
          downsell: nextData.otom.downsell,
        }),
      }),
    );
    router.push("/web-builder?flow=1");
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        autoFlowRef.current = params.get("flow") === "1" || params.get("autoFlow") === "1";
        const transferred = window.sessionStorage.getItem(
          "revora-otom-context",
        );
        if (transferred) {
          const context = JSON.parse(transferred) as {
            businessId?: number;
            businessName: string;
            businessType: string;
            targetAudience: string;
            currentOffer: string;
            currentPrice: number;
            primaryObjective?: string;
            valueProposition?: string;
            weaknesses?: string[];
            recommendations?: string[];
            evidence?: string[];
            auditId?: string;
            sourceUrl?: string;
            visualIdentity?: {
              logoUrl?: string;
              heroImageUrl?: string;
              colors?: string[];
              fonts?: string[];
              navigation?: string[];
              layout?: string;
            };
          };
          window.sessionStorage.removeItem("revora-otom-context");
          setBuilderContext(context);
          setBusiness(context.businessName);
          setBusinessType(context.businessType);
          setAudience(context.targetAudience);
          setCurrentOffer(context.currentOffer);
          setCorePrice(context.currentPrice);
          setGenerating(true);
          setNotice(
            "FunnelSpy context received. AI is building the OTOM automatically...",
          );
          const persisted = context.auditId
            ? fetch(`/api/pipeline/generate-otom?auditId=${encodeURIComponent(context.auditId)}&locale=${selectedLocale()}`)
                .then(async (response) => response.ok ? response.json() : null)
            : Promise.resolve(null);
          persisted
            .then((saved) => saved || fetch("/api/pipeline/generate-otom", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...context, locale: selectedLocale() }),
            }).then(async (response) => {
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "OTOM generation failed.");
              return data;
            }))
            .then(async (response) => {
              return response;
            })
            .then((data) => {
              setGenerated(data.otom);
              setPageSpec(data.otom.landingPage);
              setProfile(data.profile);
              setBusiness(data.profile.businessName.value);
              setBusinessType(data.profile.businessType.value);
              setAudience(data.profile.targetAudience.value);
              setCurrentOffer(data.profile.currentOffer.value);
              setCorePrice(
                data.profile.currentPrice.value || data.otom.coreOffer.pricePoint,
              );
              setUpsellPrice(data.otom.upsell.pricePoint);
              setProjectStatus("draft");
              window.localStorage.setItem(
                "revora-otom-project",
                JSON.stringify({
                  business: context.businessName,
                  audience: context.targetAudience,
                  businessType: context.businessType,
                  currentOffer: context.currentOffer,
                  profile: data.profile,
                  pageSpec: data.otom.landingPage,
                  generated: data.otom,
                  status: "draft",
                  auditId: context.auditId,
                  sourceUrl: context.sourceUrl,
                  builderContext: context,
                  updatedAt: new Date().toISOString(),
                }),
              );
              setNotice(
                "OTOM generated automatically from the FunnelSpy audit.",
              );
              if (autoFlowRef.current && !autoForwardedRef.current) {
                autoForwardedRef.current = true;
                handoffToWebBuilder(context, data);
              }
            })
            .catch((error: unknown) =>
              setNotice(
                error instanceof Error
                  ? error.message
                  : "OTOM generation failed.",
              ),
            )
            .finally(() => setGenerating(false));
          return;
        }
        const raw = window.localStorage.getItem("revora-otom-project");
        if (!raw) return;
        const saved = JSON.parse(raw) as {
          business?: string;
          audience?: string;
          businessType?: string;
          currentOffer?: string;
          generated?: GeneratedOTOM;
          profile?: BusinessProfile;
          pageSpec?: PageSpec;
          status?: "draft" | "approved";
          builderContext?: Record<string, unknown>;
        };
        if (saved.business === "Atlas City Museum") {
          window.localStorage.removeItem("revora-otom-project");
          return;
        }
        if (saved.business) setBusiness(saved.business);
        if (saved.audience) setAudience(saved.audience);
        if (saved.businessType) setBusinessType(saved.businessType);
        if (saved.currentOffer) setCurrentOffer(saved.currentOffer);
        if (saved.generated) setGenerated(saved.generated);
        if (saved.profile) setProfile(saved.profile);
        if (saved.pageSpec) setPageSpec(saved.pageSpec);
        else if (saved.generated?.landingPage)
          setPageSpec(saved.generated.landingPage);
        if (saved.status) setProjectStatus(saved.status);
        if (saved.builderContext) setBuilderContext(saved.builderContext);
      } catch {
        /* Invalid device-local drafts are ignored safely. */
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [handoffToWebBuilder]);

  function saveProject(status = projectStatus) {
    window.localStorage.setItem(
      "revora-otom-project",
      JSON.stringify({
        business,
        audience,
        businessType,
        currentOffer,
        generated,
        profile,
        pageSpec,
        builderContext,
        status,
        updatedAt: new Date().toISOString(),
      }),
    );
    setProjectStatus(status);
    setNotice(
      status === "approved"
        ? "Concept approved and saved."
        : "Draft saved on this device.",
    );
  }

  async function generateConcept() {
    setGenerating(true);
    setNotice("");
    try {
      const response = await fetch("/api/pipeline/generate-otom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: selectedLocale(),
          businessName: business,
          businessType,
          targetAudience: audience,
          currentOffer,
          currentPrice: corePrice,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "OTOM generation failed.");
      setGenerated(data.otom);
      setPageSpec(data.otom.landingPage);
      setProfile(data.profile);
      setBusiness(data.profile.businessName.value);
      setBusinessType(data.profile.businessType.value);
      setAudience(data.profile.targetAudience.value);
      setCurrentOffer(data.profile.currentOffer.value);
      setCorePrice(
        data.profile.currentPrice.value || data.otom.coreOffer.pricePoint,
      );
      setUpsellPrice(data.otom.upsell.pricePoint);
      setProjectStatus("draft");
      window.localStorage.setItem(
        "revora-otom-project",
        JSON.stringify({
          business,
          audience,
          businessType,
          currentOffer,
          generated: data.otom,
          profile: data.profile,
          pageSpec: data.otom.landingPage,
          builderContext,
          status: "draft",
          updatedAt: new Date().toISOString(),
        }),
      );
      setNotice(
        "OTOM generated and saved. Review every section before approval.",
      );
      if (autoFlowRef.current && !autoForwardedRef.current) {
        autoForwardedRef.current = true;
        handoffToWebBuilder(builderContext, { profile: data.profile, otom: data.otom });
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "OTOM generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function exportProject() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            business,
            audience,
            assumptions: {
              traffic,
              currentConversion,
              targetConversion,
              corePrice,
              upsellPrice,
              upsellTakeRate,
              emailRecovery,
              implementationPrice,
            },
            otom: generated,
            profile,
            pageSpec,
            status: projectStatus,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "otom-client-proposal.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  const projection = useMemo(() => {
    const calculate = (
      conversion: number,
      upsell: number,
      recovery: number,
    ) => {
      const buyers = (traffic * conversion) / 100;
      const core = buyers * corePrice;
      const upsellRevenue = ((buyers * upsell) / 100) * upsellPrice;
      const recovered = (core * recovery) / 100;
      return {
        buyers,
        core,
        upsellRevenue,
        recovered,
        total: core + upsellRevenue + recovered,
      };
    };
    return {
      actual: calculate(currentConversion, 0, 0),
      conservative: calculate(
        Math.max(currentConversion, targetConversion * 0.76),
        upsellTakeRate * 0.65,
        emailRecovery * 0.6,
      ),
      target: calculate(targetConversion, upsellTakeRate, emailRecovery),
      potential: calculate(
        targetConversion * 1.18,
        Math.min(upsellTakeRate * 1.2, 70),
        emailRecovery * 1.2,
      ),
    };
  }, [
    traffic,
    currentConversion,
    targetConversion,
    corePrice,
    upsellPrice,
    upsellTakeRate,
    emailRecovery,
  ]);

  const lift = projection.target.total - projection.actual.total;
  const activePageSpec: PageSpec = pageSpec || {
    brandName: business,
    navigation: ["Offer", "Benefits", "Contact"],
    eyebrow: "New experience",
    headline: generated?.hook.name || `A clearer way to choose ${business}.`,
    subheadline:
      generated?.hook.description ||
      "A direct, useful, and easy-to-understand proposal.",
    primaryCta: "See the offer",
    secondaryCta: "Learn more",
    trustItems: ["Clear process", "Simple next step"],
    heroVisualConcept: `Editorial composition inspired by ${business}`,
    leadCaptureHeadline: "Get the essential information",
    leadCaptureBody: "One simple step to get started.",
    leadCaptureCta: "Continue",
    thankYouHeadline: "All set for the next step.",
    thankYouBody: "Check your confirmation and continue whenever you're ready.",
    preserveOriginalDesign: false,
    logoUrl: "",
    heroImageUrl: "",
    primaryColor: "#151515",
    secondaryColor: "#ff6b35",
    backgroundColor: "#f6f2e9",
    surfaceColor: "#1e3228",
    textColor: "#151515",
    fontFamily: "inherit",
    headerStyle: "Editorial navigation",
    sectionOrder: ["Hero", "Benefits", "Offer", "Trust", "CTA"],
  };
  const previewTheme = {
    primary: safeColor(activePageSpec.primaryColor, "#151515"),
    accent: safeColor(activePageSpec.secondaryColor, "#ff6b35"),
    background: safeColor(activePageSpec.backgroundColor, "#f6f2e9"),
    surface: safeColor(activePageSpec.surfaceColor, "#1e3228"),
    text: safeColor(activePageSpec.textColor, "#151515"),
    font: activePageSpec.fontFamily || "inherit",
  };

  function updatePageSpec<K extends keyof PageSpec>(field: K, value: PageSpec[K]) {
    setPageSpec({ ...activePageSpec, [field]: value });
  }
  const stages = [
    {
      name: "Hook",
      detail: generated?.hook.description || "Free guide + entry incentive",
      icon: Sparkles,
      color: "from-orange-500 to-amber-300",
    },
    {
      name: "Lead capture",
      detail: "One-field email capture",
      icon: Mail,
      color: "from-cyan-500 to-blue-400",
    },
    {
      name: "Core offer",
      detail: generated
        ? `${generated.coreOffer.name} · ${money.format(generated.coreOffer.pricePoint)}`
        : `Primary experience · ${money.format(corePrice)}`,
      icon: Target,
      color: "from-violet-500 to-fuchsia-400",
    },
    {
      name: "Upsell",
      detail: generated
        ? `${generated.upsell.name} · ${money.format(generated.upsell.pricePoint)}`
        : `Premium upgrade · ${money.format(upsellPrice)}`,
      icon: TrendingUp,
      color: "from-lime-500 to-emerald-400",
    },
    {
      name: "Recovery",
      detail: "5-message follow-up sequence",
      icon: MousePointerClick,
      color: "from-rose-500 to-orange-400",
    },
  ];

  const scenarioRows: Array<{ key: Scenario; label: string; tone: string }> = [
    { key: "actual", label: "Current baseline", tone: "bg-slate-500" },
    { key: "conservative", label: "Conservative", tone: "bg-cyan-400" },
    { key: "target", label: "Target", tone: "bg-orange-400" },
    { key: "potential", label: "Potential", tone: "bg-lime-400" },
  ];
  const previewCopy = [
    {
      eyebrow: activePageSpec.eyebrow,
      title: activePageSpec.headline,
      body: activePageSpec.subheadline,
      cta: activePageSpec.primaryCta,
    },
    {
      eyebrow: "Valor inmediato",
      title: activePageSpec.leadCaptureHeadline,
      body: activePageSpec.leadCaptureBody,
      cta: activePageSpec.leadCaptureCta,
    },
    {
      eyebrow: "Signature offer",
      title: generated?.coreOffer.name || "Make today unforgettable.",
      body:
        generated?.coreOffer.description ||
        "A clear offer with fewer decisions and a stronger reason to act.",
      cta: `Reserve for ${money.format(corePrice)}`,
    },
    {
      eyebrow: "Premium upgrade",
      title: generated?.upsell.name || "Go beyond the standard experience.",
      body:
        generated?.upsell.description ||
        "More value presented at the moment of highest intent.",
      cta: `Add for ${money.format(upsellPrice)}`,
    },
    {
      eyebrow: "Confirmed",
      title: activePageSpec.thankYouHeadline,
      body: activePageSpec.thankYouBody,
      cta: "Continue",
    },
  ][previewStep];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] text-slate-100 selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(249,115,22,.16),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(34,211,238,.09),transparent_24%)]" />
      <header className="relative z-20 border-b border-white/[.07] bg-[#070707]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-300 text-black shadow-lg shadow-orange-500/20">
              <CircleDollarSign className="size-5" />
            </span>
            <div>
              <strong className="block tracking-tight">OTOM Studio</strong>
              <span className="text-[9px] uppercase tracking-[.25em] text-slate-600">
                Offer to money machine
              </span>
            </div>
          </div>
          <nav className="flex max-w-[42vw] overflow-x-auto rounded-xl border border-white/[.08] bg-white/[.03] p-1">
            {(["strategy", "preview", "revenue", "presentation"] as View[]).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${view === item ? "bg-white text-black" : "text-slate-500 hover:text-white"}`}
                >
                  {item}
                </button>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveProject()}
              aria-label="Save project"
              title="Save project"
              className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-400"
            >
              <Save className="size-4" />
            </button>
            <button
              onClick={exportProject}
              aria-label="Export project"
              title="Export project"
              className="grid size-10 place-items-center rounded-xl border border-white/10 text-slate-400"
            >
              <Download className="size-4" />
            </button>
            <Link
              href="/funnelspy"
              className="hidden rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 xl:block"
            >
              Back to audit
            </Link>
            <Link
              href="/web-builder"
              onClick={() =>
                window.sessionStorage.setItem(
                  "revora-web-builder-context",
                  JSON.stringify({
                    ...builderContext,
                    businessName: profile?.businessName.value || business,
                    businessType: profile?.businessType.value || businessType,
                    targetAudience: profile?.targetAudience.value || audience,
                    currentOffer: profile?.currentOffer.value || currentOffer,
                    currentPrice: profile?.currentPrice.value || corePrice,
                    visualIdentity: {
                      ...((builderContext.visualIdentity as Record<string, unknown> | undefined) || {}),
                      logoUrl: activePageSpec.logoUrl || "",
                      heroImageUrl: activePageSpec.heroImageUrl || "",
                      colors: [
                        activePageSpec.primaryColor,
                        activePageSpec.secondaryColor,
                        activePageSpec.backgroundColor,
                        activePageSpec.surfaceColor,
                        activePageSpec.textColor,
                      ].filter(Boolean),
                      fonts: activePageSpec.fontFamily
                        ? [activePageSpec.fontFamily]
                        : [],
                      navigation: activePageSpec.navigation,
                      layout: activePageSpec.headerStyle || "",
                    },
                    webBuilderSeed: {
                      brandName: activePageSpec.brandName,
                      eyebrow: activePageSpec.eyebrow,
                      headline: activePageSpec.headline,
                      body: activePageSpec.subheadline,
                      primaryCta: activePageSpec.primaryCta,
                      secondaryCta: activePageSpec.secondaryCta,
                      trustItems: activePageSpec.trustItems,
                    },
                    otomSummary: generated
                      ? JSON.stringify({
                          hook: generated.hook,
                          coreOffer: generated.coreOffer,
                          upsell: generated.upsell,
                          downsell: generated.downsell,
                        })
                      : "",
                  }),
                )
              }
              className="hidden items-center gap-2 rounded-xl border border-orange-400/20 bg-orange-400/[.07] px-4 py-2 text-xs font-bold text-orange-200 xl:flex"
            >
              <LayoutTemplate className="size-4" />
              Build website
            </Link>
            <button
              onClick={() => {
                setView("presentation");
                setPresenting(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-black shadow-lg shadow-orange-500/20"
            >
              <Play className="size-3.5" />
              <span className="hidden sm:inline">Present</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1500px] px-5 py-8">
        {notice && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-2xl border border-lime-400/20 bg-lime-400/[.07] px-4 py-3 text-sm text-lime-100"
          >
            <BadgeCheck className="size-4 text-lime-300" />
            {notice}
          </div>
        )}
        <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/[.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-lime-300">
              <span className="size-1.5 animate-pulse rounded-full bg-lime-300" />
              Client-ready planning scenario
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-none tracking-[-.045em] text-white md:text-6xl">
              Turn attention into{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-lime-300 bg-clip-text text-transparent">
                measurable value.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Design the complete offer journey, preview the new customer
              experience and explain every revenue assumption in one place.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.03] p-3">
            <div className="grid size-11 place-items-center rounded-xl bg-orange-400/10 text-orange-300">
              <WandSparkles className="size-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-600">
                Project
              </span>
              <strong className="text-sm">{business}</strong>
            </div>
            <ChevronRight className="ml-4 size-4 text-slate-700" />
          </div>
        </section>

        {view === "strategy" && (
          <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
            <aside className="space-y-4 rounded-3xl border border-white/[.08] bg-white/[.025] p-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[.18em] text-orange-300">
                  01 · Context
                </span>
                <h2 className="mt-2 text-xl font-black">Build the offer</h2>
              </div>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                  Business
                </span>
                <input
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold outline-none focus:border-orange-400/50"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                  Audience
                </span>
                <textarea
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/25 p-3 text-sm leading-5 outline-none focus:border-orange-400/50"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Business type</span>
                <input value={businessType} onChange={(event) => setBusinessType(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm outline-none focus:border-orange-400/50" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Offer and FunnelSpy evidence</span>
                <textarea value={currentOffer} onChange={(event) => setCurrentOffer(event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-5 outline-none focus:border-orange-400/50" />
              </label>
              {profile && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                    AI data traceability
                  </span>
                  <div className="mt-3 space-y-2">
                    {[
                      ["Business", profile.businessName],
                      ["Audience", profile.targetAudience],
                      ["Offer", profile.currentOffer],
                      ["Price", profile.currentPrice],
                    ].map(([label, field]) => {
                      const item = field as BusinessProfile["businessName"];
                      const tone =
                        item.status === "verified"
                          ? "text-lime-300"
                          : item.status === "inferred"
                            ? "text-amber-300"
                            : "text-rose-300";
                      return (
                        <div key={label as string} className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-slate-400">{label as string}</span>
                          <span className={`font-black uppercase ${tone}`} title={item.evidence}>
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Core price"
                  prefix="$"
                  value={corePrice}
                  onChange={setCorePrice}
                />
                <Field
                  label="Upsell price"
                  prefix="$"
                  value={upsellPrice}
                  onChange={setUpsellPrice}
                />
              </div>
              <button
                onClick={generateConcept}
                disabled={generating || !business.trim() || !audience.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-300 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
              >
                {generating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {generating
                  ? "Generating with AI..."
                  : generated
                    ? "Regenerate client concept"
                    : "Generate client concept"}
              </button>
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[.05] p-4 text-xs leading-5 text-cyan-100/70">
                <ShieldCheck className="mb-2 size-4 text-cyan-300" />
                All financial figures remain editable planning assumptions until
                connected to verified analytics or sales data.
              </div>
            </aside>
            <section className="space-y-5">
              <div className="grid gap-4 md:grid-cols-5">
                {stages.map((stage, index) => (
                  <article
                    key={stage.name}
                    className="relative overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.03] p-5"
                  >
                    <div
                      className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${stage.color} text-black`}
                    >
                      <stage.icon className="size-4" />
                    </div>
                    <span className="absolute right-4 top-4 text-xs font-black text-slate-700">
                      0{index + 1}
                    </span>
                    <h3 className="mt-6 font-black">{stage.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {stage.detail}
                    </p>
                    {index < stages.length - 1 && (
                      <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-5 text-slate-700 md:block" />
                    )}
                  </article>
                ))}
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
                <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[.18em] text-violet-300">
                        Value ladder
                      </span>
                      <h2 className="mt-2 text-2xl font-black">
                        Small yes → bigger value
                      </h2>
                    </div>
                    <Target className="text-violet-300" />
                  </div>
                  <div className="mt-7 space-y-3">
                    {stages.slice(0, 4).map((stage, index) => (
                      <div
                        key={stage.name}
                        className="flex items-center gap-4 rounded-2xl border border-white/[.07] bg-black/20 p-4"
                      >
                        <span
                          className={`h-12 w-1 rounded-full bg-gradient-to-b ${stage.color}`}
                        />
                        <div className="min-w-0 flex-1">
                          <strong className="block">{stage.name}</strong>
                          <span className="text-xs text-slate-500">
                            {stage.detail}
                          </span>
                        </div>
                        <span className="rounded-lg bg-white/[.05] px-3 py-1 text-xs font-bold text-slate-300">
                          {index === 0
                            ? "FREE"
                            : index === 1
                              ? "LEAD"
                              : index === 2
                                ? money.format(corePrice)
                                : `+${money.format(upsellPrice)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="rounded-3xl border border-orange-400/15 bg-gradient-to-br from-orange-500/10 to-transparent p-6">
                  <span className="text-[10px] font-black uppercase tracking-[.18em] text-orange-300">
                    Revenue thesis
                  </span>
                  <strong className="mt-5 block text-5xl font-black tracking-[-.05em] text-white">
                    {money.format(lift)}
                  </strong>
                  <p className="mt-2 text-sm text-slate-400">
                    illustrative monthly lift at the target scenario
                  </p>
                  <div className="mt-8 space-y-4">
                    {[
                      ["Core offer", projection.target.core],
                      ["Upsell", projection.target.upsellRevenue],
                      ["Email recovery", projection.target.recovered],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-slate-500">
                            {label as string}
                          </span>
                          <strong>{money.format(value as number)}</strong>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[.06]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300"
                            style={{
                              width: `${Math.max(8, ((value as number) / projection.target.total) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          </div>
        )}

        {view === "preview" && (
          <section className="grid gap-6 xl:grid-cols-[280px_1fr]">
            <aside className="rounded-3xl border border-white/[.08] bg-white/[.025] p-5">
              <span className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">
                02 · Experience
              </span>
              <h2 className="mt-2 text-xl font-black">Client preview</h2>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                A conversion-focused evolution of the original website,
                preserving its brand model and visual identity.
              </p>
              {activePageSpec.preserveOriginalDesign && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-lime-400/20 bg-lime-400/[.06] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-lime-300">
                  <BadgeCheck className="size-3.5" /> Original design preserved
                </div>
              )}
              <div className="mt-6 space-y-2">
                {[
                  "Landing page",
                  "Lead capture",
                  "Core offer",
                  "Upsell",
                  "Thank you",
                ].map((item, index) => (
                  <button
                    key={item}
                    onClick={() => setPreviewStep(index)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-xs font-bold ${index === previewStep ? "border-orange-400/25 bg-orange-400/10 text-orange-200" : "border-white/[.06] text-slate-500"}`}
                  >
                    <span>{item}</span>
                    <Check className="size-3.5" />
                  </button>
                ))}
              </div>
              <div className="mt-5 flex rounded-xl border border-white/[.08] bg-black/20 p-1">
                <button
                  onClick={() => setDevice("desktop")}
                  className={`grid flex-1 place-items-center rounded-lg py-2 ${device === "desktop" ? "bg-white text-black" : "text-slate-500"}`}
                >
                  <Laptop className="size-4" />
                </button>
                <button
                  onClick={() => setDevice("mobile")}
                  className={`grid flex-1 place-items-center rounded-lg py-2 ${device === "mobile" ? "bg-white text-black" : "text-slate-500"}`}
                >
                  <Smartphone className="size-4" />
                </button>
              </div>
              <div className="mt-6 space-y-3 border-t border-white/[.07] pt-5">
                <span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                  Edit selected screen
                </span>
                {previewStep === 0 ? (
                  <>
                    <input
                      aria-label="Preview brand name"
                      value={activePageSpec.brandName}
                      onChange={(event) =>
                        updatePageSpec("brandName", event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold outline-none focus:border-cyan-400/40"
                    />
                    <textarea
                      aria-label="Preview headline"
                      value={activePageSpec.headline}
                      onChange={(event) =>
                        updatePageSpec("headline", event.target.value)
                      }
                      className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/25 p-3 text-xs font-bold leading-5 outline-none focus:border-cyan-400/40"
                    />
                    <textarea
                      aria-label="Preview subheadline"
                      value={activePageSpec.subheadline}
                      onChange={(event) =>
                        updatePageSpec("subheadline", event.target.value)
                      }
                      className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-5 outline-none focus:border-cyan-400/40"
                    />
                    <input
                      aria-label="Preview primary CTA"
                      value={activePageSpec.primaryCta}
                      onChange={(event) =>
                        updatePageSpec("primaryCta", event.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-xs font-bold outline-none focus:border-cyan-400/40"
                    />
                  </>
                ) : (
                  <p className="rounded-xl border border-white/[.06] bg-black/20 p-3 text-[11px] leading-5 text-slate-500">
                    This screen is connected to the generated OTOM. Edit its
                    offer from Strategy and regenerate when needed.
                  </p>
                )}
              </div>
            </aside>
            <div className="rounded-3xl border border-white/[.08] bg-[#101010] p-3 md:p-6">
              <div
                className={`mx-auto overflow-hidden rounded-[26px] border border-white/10 shadow-2xl transition-all ${device === "mobile" ? "max-w-[390px]" : "max-w-6xl"}`}
                style={{ backgroundColor: previewTheme.background, color: previewTheme.text, fontFamily: previewTheme.font }}
              >
                <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                  <div className="flex items-center gap-3">
                    {activePageSpec.logoUrl ? (
                      <span
                        className="h-9 w-24 bg-contain bg-left bg-no-repeat"
                        style={{ backgroundImage: `url(${activePageSpec.logoUrl})` }}
                        aria-label={`${activePageSpec.brandName} logo`}
                      />
                    ) : (
                      <strong className="text-sm uppercase tracking-[.18em]">{activePageSpec.brandName}</strong>
                    )}
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold uppercase">
                    {activePageSpec.navigation.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <div
                  className={`grid ${device === "desktop" ? "md:grid-cols-[1.15fr_.85fr]" : ""}`}
                >
                  <div className="p-7 md:p-12">
                    <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: `${previewTheme.accent}1a`, color: previewTheme.accent }}>
                      {previewCopy.eyebrow}
                    </span>
                    <h2 className="mt-6 text-4xl font-black leading-[.95] tracking-[-.05em] md:text-7xl">
                      {previewCopy.title}
                    </h2>
                    <p className="mt-5 max-w-xl text-sm leading-6 text-black/60">
                      {previewCopy.body}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <button className="rounded-full px-6 py-3 text-xs font-black text-white" style={{ backgroundColor: previewTheme.primary }}>
                        {previewCopy.cta}
                      </button>
                      <button className="rounded-full border border-black/15 px-6 py-3 text-xs font-black">
                        {activePageSpec.secondaryCta}
                      </button>
                    </div>
                    <div className="mt-8 flex gap-6 border-t border-black/10 pt-5 text-[10px] font-bold uppercase tracking-wider text-black/45">
                      {activePageSpec.trustItems.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                  <div
                    className="relative min-h-80 overflow-hidden bg-cover bg-center p-7 text-white"
                    style={{ backgroundColor: previewTheme.surface, backgroundImage: activePageSpec.heroImageUrl ? `linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.62)),url(${activePageSpec.heroImageUrl})` : undefined }}
                  >
                    {!activePageSpec.heroImageUrl && <div className="absolute -right-20 -top-20 size-72 rounded-full border-[45px] opacity-80" style={{ borderColor: previewTheme.accent }} />}
                    <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-200">
                        {previewStep === 0
                          ? "Visual concept"
                          : "Next step"}
                      </span>
                      <strong className="mt-2 block text-2xl">
                        {generated?.upsell.name || "More value, no friction."}
                      </strong>
                      <p className="mt-2 text-xs leading-5 text-white/60">
                        {previewStep === 0
                          ? activePageSpec.heroVisualConcept
                          : generated?.upsell.description ||
                            "A relevant upgrade presented at the right moment."}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <strong>+{money.format(upsellPrice)}</strong>
                        <span className="rounded-full bg-white px-4 py-2 text-[10px] font-black text-black">
                          Add upgrade
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-5 grid max-w-6xl gap-3 md:grid-cols-2">
                <article className="rounded-2xl border border-white/[.07] bg-black/20 p-5">
                  <span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                    Context received
                  </span>
                  <strong className="mt-3 block text-sm text-white">
                    {profile?.currentOffer.value || currentOffer}
                  </strong>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {profile?.currentOffer.evidence ||
                      "Editable information provided for this project."}
                  </p>
                </article>
                <article className="rounded-2xl border border-lime-400/15 bg-lime-400/[.05] p-5">
                  <span className="text-[10px] font-black uppercase tracking-[.16em] text-lime-300">
                    New proposed experience
                  </span>
                  <strong className="mt-3 block text-sm text-white">
                    {activePageSpec.headline}
                  </strong>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Hook → capture → {generated?.coreOffer.name || "offer"} → {generated?.upsell.name || "upgrade"} → follow-up.
                  </p>
                </article>
              </div>
            </div>
          </section>
        )}

        {view === "revenue" && (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric
                label="Monthly traffic"
                value={traffic.toLocaleString()}
                note="Editable assumption"
                tone="cyan"
              />
              <Metric
                label="Baseline revenue"
                value={money.format(projection.actual.total)}
                note={`${currentConversion}% conversion`}
              />
              <Metric
                label="Target revenue"
                value={money.format(projection.target.total)}
                note={`${targetConversion}% conversion`}
                tone="lime"
              />
              <Metric
                label="Monthly opportunity"
                value={money.format(lift)}
                note="Scenario delta, not a guarantee"
                tone="violet"
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
              <aside className="rounded-3xl border border-white/[.08] bg-white/[.025] p-5">
                <span className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300">
                  03 · Assumptions
                </span>
                <h2 className="mt-2 text-xl font-black">Revenue simulator</h2>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Field
                    label="Monthly visitors"
                    value={traffic}
                    onChange={setTraffic}
                  />
                  <Field
                    label="Current conversion %"
                    value={currentConversion}
                    onChange={setCurrentConversion}
                  />
                  <Field
                    label="Target conversion %"
                    value={targetConversion}
                    onChange={setTargetConversion}
                  />
                  <Field
                    label="Upsell take rate %"
                    value={upsellTakeRate}
                    onChange={setUpsellTakeRate}
                  />
                  <Field
                    label="Core price"
                    prefix="$"
                    value={corePrice}
                    onChange={setCorePrice}
                  />
                  <Field
                    label="Upsell price"
                    prefix="$"
                    value={upsellPrice}
                    onChange={setUpsellPrice}
                  />
                  <Field
                    label="Email recovery %"
                    value={emailRecovery}
                    onChange={setEmailRecovery}
                  />
                </div>
                <div className="mt-5 rounded-xl bg-amber-400/[.07] p-3 text-[11px] leading-5 text-amber-100/70">
                  Connect verified analytics and sales data before presenting
                  these figures as an observed baseline.
                </div>
              </aside>
              <article className="rounded-3xl border border-white/[.08] bg-white/[.025] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[.18em] text-orange-300">
                      Scenario comparison
                    </span>
                    <h2 className="mt-2 text-2xl font-black">
                      A range, not a promise
                    </h2>
                  </div>
                  <BarChart3 className="text-orange-300" />
                </div>
                <div className="mt-8 space-y-6">
                  {scenarioRows.map(({ key, label, tone }) => {
                    const item = projection[key];
                    const width = Math.max(
                      5,
                      (item.total / projection.potential.total) * 100,
                    );
                    return (
                      <div key={key}>
                        <div className="mb-2 flex items-end justify-between">
                          <div>
                            <strong className="text-sm">{label}</strong>
                            <span className="ml-3 text-xs text-slate-600">
                              {Math.round(item.buyers)} buyers
                            </span>
                          </div>
                          <strong>{money.format(item.total)}/mo</strong>
                        </div>
                        <div className="h-9 overflow-hidden rounded-xl bg-black/30">
                          <div
                            className={`flex h-full items-center rounded-xl ${tone} px-3 text-[10px] font-black text-black transition-all duration-500`}
                            style={{ width: `${width}%` }}
                          >
                            {width > 30
                              ? `${Math.round(width)}% of potential`
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Core offer", projection.target.core],
                    ["Upsells", projection.target.upsellRevenue],
                    ["Email recovery", projection.target.recovered],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="rounded-2xl border border-white/[.07] bg-black/20 p-4"
                    >
                      <span className="text-[10px] uppercase text-slate-600">
                        {label as string}
                      </span>
                      <strong className="mt-2 block text-xl">
                        {money.format(value as number)}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        {view === "presentation" && (
          <section className="overflow-hidden rounded-[32px] border border-orange-400/20 bg-gradient-to-br from-[#16110c] via-[#0c0c0c] to-[#071515] shadow-2xl shadow-orange-950/20">
            <div className="grid min-h-[680px] lg:grid-cols-[1.05fr_.95fr]">
              <div className="flex flex-col justify-between p-8 md:p-12">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-orange-200">
                    <Eye className="size-3" />
                    Private growth proposal
                  </span>
                  <h2 className="mt-8 text-5xl font-black leading-[.95] tracking-[-.055em] md:text-7xl">
                    Turn more visitors into{" "}
                    <span className="text-orange-400">valuable customers.</span>
                  </h2>
                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
                    A complete revenue journey designed for {business}: attract
                    the right audience, make the offer easier to buy and create
                    more value after every conversion.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() => saveProject("approved")}
                      className="flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-black shadow-lg shadow-orange-500/25"
                    >
                      {projectStatus === "approved"
                        ? "Concept approved"
                        : "Approve this concept"}{" "}
                      <ArrowRight className="size-4" />
                    </button>
                    <button
                      onClick={() => setView("preview")}
                      className="rounded-full border border-white/15 px-6 py-3 text-sm font-black text-white"
                    >
                      Explore the new experience
                    </button>
                  </div>
                </div>
                <div>
                  <div className="mb-5 grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">
                        Today
                      </span>
                      <strong className="mt-2 block text-2xl">
                        {money.format(projection.actual.total)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">
                        Target scenario
                      </span>
                      <strong className="mt-2 block text-2xl text-lime-300">
                        {money.format(projection.target.total)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">
                        Opportunity
                      </span>
                      <strong className="mt-2 block text-2xl text-orange-300">
                        +{money.format(lift)}
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] p-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-600">
                        Complete implementation
                      </span>
                      <strong className="mt-1 block text-xl">
                        {money.format(implementationPrice)}
                      </strong>
                    </div>
                    <label className="flex items-center gap-2 text-[10px] uppercase text-slate-600">
                      Investment{" "}
                      <input
                        aria-label="Implementation investment"
                        type="number"
                        value={implementationPrice}
                        onChange={(event) =>
                          setImplementationPrice(Number(event.target.value))
                        }
                        className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-right text-xs font-bold text-white outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-center overflow-hidden border-l border-white/[.06] p-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,.14),transparent_55%)]" />
                <div className="relative w-full max-w-lg">
                  <div className="mb-5">
                    <span className="text-[10px] font-black uppercase tracking-[.18em] text-lime-300">
                      How growth happens
                    </span>
                    <h3 className="mt-2 text-2xl font-black">
                      One connected buying journey.
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {stages.map((stage, index) => (
                      <div
                        key={stage.name}
                        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.055] p-4 backdrop-blur"
                      >
                        <div
                          className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${stage.color} text-black`}
                        >
                          <stage.icon className="size-4" />
                        </div>
                        <div className="flex-1">
                          <strong className="block">{stage.name}</strong>
                          <span className="text-xs text-slate-500">
                            {stage.detail}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-700">
                          0{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/[.07] px-8 py-4 text-center text-[10px] uppercase tracking-[.15em] text-slate-600">
              Illustrative planning scenario based on editable assumptions.
              Results are not guaranteed.
            </div>
          </section>
        )}
      </main>

      {presenting && (
        <button
          onClick={() => setPresenting(false)}
          aria-label="Close presentation mode"
          className="fixed right-5 top-5 z-50 grid size-11 place-items-center rounded-full border border-white/10 bg-black/80 text-white backdrop-blur"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
