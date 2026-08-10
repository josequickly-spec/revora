"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, ExternalLink, LoaderCircle, MapPin, Search, Store, Sparkles } from "lucide-react";
import type { LeadCandidate, LeadSearchResponse } from "@/lib/lead-finder/contracts";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import BusinessDiscoveryScraper from "@/components/scraping/BusinessDiscoveryScraper";

const labels = { city: "City", postalCode: "ZIP / postal code", address: "Address", query: "Free search", businessName: "Business name", domain: "Domain", ceoName: "CEO name" } as const;

type ShopifyCandidate = LeadCandidate & {
  technologyVerification?: {
    status: "verified";
    platform: "Shopify";
    provider: "BuiltWith";
    checkedAt: string;
    signals: string[];
  };
};

type FinderResponse = Omit<LeadSearchResponse, "candidates" | "requestMetadata"> & {
  candidates: ShopifyCandidate[];
  requestMetadata: LeadSearchResponse["requestMetadata"] & {
    discovered?: number;
    websitesFound?: number;
    technologyChecked?: number;
    shopifyVerified?: number;
  };
};

export default function LeadFinder() {
  const router = useRouter();
  const [locationType, setLocationType] = useState<keyof typeof labels>("city");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [shopifyOnly, setShopifyOnly] = useState(false);
  const [results, setResults] = useState<FinderResponse | null>(null);
  const [selected, setSelected] = useState<LeadCandidate | null>(null);
  const [state, setState] = useState<"idle" | "searching" | "enriching">("idle");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [useAdvancedScraping, setUseAdvancedScraping] = useState(false);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!location.trim()) return setError("Enter a city, ZIP code, address or search area.");
    setState("searching"); setError(""); setSelected(null);
    try {
      const response = await fetch(shopifyOnly ? "/api/lead-finder/shopify" : "/api/lead-finder/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: { type: locationType, value: location }, category: category || undefined, limit: shopifyOnly ? 20 : 40, turnstileToken }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Lead search failed.");
      setResults(data);
    } catch (reason) {
      setResults(null); setError(reason instanceof Error ? reason.message : "Lead search failed.");
    } finally { setState("idle"); }
  }

  async function enrich() {
    if (!selected?.website) return setError("This candidate has no public website to verify. Choose one with a website.");
    setState("enriching"); setError("");
    try {
      const response = await fetch("/api/discovery", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: selected.name, domain: selected.website, city: selected.city,
          zipcode: selected.postalCode, businessCategory: selected.category,
          industryType: "general", createFunnel: false,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Business enrichment failed.");
      router.push(`/businesses/${data.businessId || data.business.id}?flow=1`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Business enrichment failed.");
      setState("idle");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} className="rounded-3xl border border-white/[.08] bg-white/[.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/[.07] pb-5 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-[.16em] text-cyan-300">Discovery mode</span>
            <p className="mt-1 text-sm text-slate-400">Find local businesses or return only stores whose Shopify signal is verified.</p>
          </div>
          <button
            type="button"
            aria-pressed={shopifyOnly}
            onClick={() => {
              setShopifyOnly(value => !value);
              setResults(null);
              setSelected(null);
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-black transition ${shopifyOnly ? "border-lime-300/30 bg-lime-300/10 text-lime-200" : "border-white/10 bg-black/20 text-slate-400"}`}
          >
            <Store className="size-4" />
            {shopifyOnly ? "Verified Shopify enabled" : "Find Shopify by city"}
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[180px_1fr_1fr_auto]">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Search by
            <select value={locationType} onChange={event => setLocationType(event.target.value as keyof typeof labels)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm normal-case text-white">
              {Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Location
            <input value={location} onChange={event => setLocation(event.target.value)} placeholder="Miami, FL" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm normal-case text-white" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category
            <input value={category} onChange={event => setCategory(event.target.value)} placeholder="Restaurant, dealer…" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm normal-case text-white" />
          </label>
          <button disabled={state !== "idle"} className="self-end rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">
            {state === "searching" ? <LoaderCircle className="size-5 animate-spin" aria-label="Searching" /> : <span className="flex items-center gap-2"><Search className="size-4" />Search</span>}
          </button>
        </div>
        <TurnstileWidget onTokenChange={setTurnstileToken} />
      </form>
      {error && <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
      {results?.warnings.map(warning => <div key={warning} className="rounded-2xl border border-amber-300/20 bg-amber-300/[.07] p-4 text-sm text-amber-100">{warning}</div>)}
      {shopifyOnly && results && (
        <section className="grid gap-3 sm:grid-cols-4">
          {[
            ["Local businesses", results.requestMetadata.discovered ?? 0],
            ["Websites found", results.requestMetadata.websitesFound ?? 0],
            ["BuiltWith checked", results.requestMetadata.technologyChecked ?? 0],
            ["Shopify verified", results.requestMetadata.shopifyVerified ?? 0],
          ].map(([label, value]) => (
            <article key={label as string} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4">
              <strong className="text-2xl font-black text-white">{value as number}</strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label as string}</span>
            </article>
          ))}
        </section>
      )}
      {results && !results.candidates.length && <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-slate-500">No public businesses matched this search.</div>}
      {!!results?.candidates.length && (
        <div className="grid gap-4 lg:grid-cols-2">
          {results.candidates.map(candidate => {
            const active = selected?.sourceId === candidate.sourceId;
            return <article key={candidate.sourceId} className={`rounded-2xl border p-5 ${active ? "border-cyan-300 bg-cyan-300/[.06]" : "border-white/[.08] bg-white/[.025]"}`}>
              <button type="button" onClick={() => setSelected(candidate)} className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-pressed={active}>
                <div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-white">{candidate.name}</h2><p className="mt-1 text-xs uppercase tracking-wider text-cyan-300">{candidate.category || "Category unavailable"}</p></div>{candidate.technologyVerification ? <span className="inline-flex items-center gap-1 rounded-full border border-lime-300/20 bg-lime-300/10 px-2.5 py-1 text-[10px] font-black uppercase text-lime-200"><BadgeCheck className="size-3" />Shopify verified</span> : <span className="text-xs text-slate-600">OpenStreetMap</span>}</div>
                <p className="mt-4 flex gap-2 text-sm text-slate-400"><MapPin className="mt-0.5 size-4 shrink-0" />{candidate.address || "Address unavailable"}</p>
                <dl className="mt-4 grid gap-2 text-xs text-slate-500"><div>Website: {candidate.website || "Unavailable"}</div><div>Phone: {candidate.phone || "Unavailable"}</div><div>Public email: {candidate.publicEmail || "Unavailable"}</div><div>Evidence: {candidate.evidence.length ? `${candidate.evidence.length} public fields` : "limited"} · Confidence: {candidate.confidence ?? "not provided"}</div></dl>
                {candidate.technologyVerification && <p className="mt-3 text-[11px] text-lime-200/70">Technology confirmed by {candidate.technologyVerification.provider} on {new Date(candidate.technologyVerification.checkedAt).toLocaleDateString()}.</p>}
              </button>
              <div className="mt-5 flex flex-wrap gap-2">
                {candidate.website && <a href={/^https?:\/\//i.test(candidate.website) ? candidate.website : `https://${candidate.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300"><ExternalLink className="size-3" />Open website</a>}
                {active && candidate.website && <Link href={`/funnelspy?url=${encodeURIComponent(candidate.website)}`} className="rounded-lg border border-violet-300/20 bg-violet-300/[.07] px-4 py-2 text-xs font-black text-violet-200">Analyze with FunnelSpy</Link>}
                {active && <button type="button" onClick={enrich} disabled={state !== "idle" || !candidate.website} className="rounded-lg bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-40">{state === "enriching" ? "Enriching…" : "Save and enrich"}</button>}
              </div>
            </article>;
          })}
        </div>
      )}
    </div>
  );
}
