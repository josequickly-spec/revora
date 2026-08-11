"use client";

import { useState } from "react";
import {
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Star,
  Package,
  CreditCard,
  Search,
  Zap,
  BarChart3,
  AlertTriangle,
  Download,
} from "lucide-react";
import { downloadJSON, downloadCSV } from "@/lib/scrapling/export-utils";
import { pushToOtom } from "@/lib/scrapling/otom-bridge";
import ScrapingJobMonitor from "./ScrapingJobMonitor";

interface ShopifyAuditProps {
  defaultDomain?: string;
  onResults?: (results: any) => void;
}

export default function ShopifyAuditComponent({
  defaultDomain = "",
  onResults,
}: ShopifyAuditProps) {
  const [domain, setDomain] = useState(defaultDomain);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);

    if (!domain.trim()) {
      setError("Enter a Shopify store domain");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shopify-audit",
          params: { domain },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start audit");
        setLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start audit"
      );
      setLoading(false);
    }
  };

  if (jobId && !results) {
    return (
      <ScrapingJobMonitor
        jobId={jobId}
        onComplete={(res) => {
          setLoading(false);
          setResults(res);
          onResults?.(res);
        }}
        onError={(err) => {
          setError(err);
          setLoading(false);
          setJobId(null);
        }}
        autoClose={false}
      />
    );
  }

  if (results) {
    return <ShopifyAuditResults data={results} onReset={() => { setResults(null); setJobId(null); }} />;
  }

  return (
    <form
      onSubmit={handleAudit}
      className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5"
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-green-400">
        <ShoppingBag className="size-4" />
        Shopify Store Audit
      </div>

      <p className="text-xs text-slate-400">
        Deep audit exclusive for Shopify stores. Extracts products, collections,
        installed apps, payment methods, SEO issues, and generates actionable
        recommendations.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="store.myshopify.com or custom-domain.com"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-green-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-sm font-black text-white transition hover:from-green-400 hover:to-emerald-400 disabled:opacity-50"
        >
          {loading ? "Auditing Store..." : "Audit Shopify Store"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2">
        {[
          "Products & Pricing",
          "Installed Apps",
          "SEO Analysis",
          "Payment Methods",
          "Performance",
          "Recommendations",
        ].map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-1.5 text-[10px] text-slate-500"
          >
            <CheckCircle2 className="size-3 text-green-500" />
            {feature}
          </div>
        ))}
      </div>
    </form>
  );
}

function ShopifyAuditResults({ data, onReset }: { data: any; onReset: () => void }) {
  const storeScore = data.storeScore || 0;
  const seoScore = data.seo?.score || 0;
  const products = data.products || {};
  const stats = products.stats || {};
  const recommendations = data.recommendations || [];
  const installedApps = data.installedApps || [];
  const paymentMethods = data.paymentMethods || [];
  const collections = data.collections || [];
  const seoIssues = data.seo?.issues || [];
  const perfIssues = data.performance?.issues || [];
  const socialProfiles = data.socialProfiles || {};
  const priceTiers = products.priceTiers || {};
  const topProducts = products.topProducts || [];

  const scoreColor =
    storeScore >= 80
      ? "text-green-400"
      : storeScore >= 60
        ? "text-yellow-400"
        : "text-red-400";

  const seoColor =
    seoScore >= 80
      ? "text-green-400"
      : seoScore >= 60
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-green-400/20 bg-gradient-to-r from-green-400/[.07] to-emerald-400/[.05] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-green-400 mb-1">
              <ShoppingBag className="size-4" />
              Shopify Store Audit
            </div>
            <h3 className="text-xl font-black text-white">{data.domain}</h3>
            <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full bg-green-400/20 px-2 py-0.5 text-green-300">
                {data.shopifyPlan || "Shopify"}
              </span>
              <span className="rounded-full bg-blue-400/20 px-2 py-0.5 text-blue-300">
                {data.currency || "USD"}
              </span>
              <span className="rounded-full bg-purple-400/20 px-2 py-0.5 text-purple-300">
                Theme: {data.theme || "Unknown"}
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-black ${scoreColor}`}>
              {storeScore}
            </div>
            <div className="text-[10px] text-slate-400">Store Score</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Products",
            value: stats.total || 0,
            icon: Package,
            color: "cyan",
          },
          {
            label: "Avg Price",
            value: `$${stats.avgPrice || 0}`,
            icon: CreditCard,
            color: "green",
          },
          {
            label: "Apps",
            value: installedApps.length,
            icon: Zap,
            color: "purple",
          },
          {
            label: "SEO Score",
            value: seoScore,
            icon: Search,
            color: "orange",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-${stat.color}-300/20 bg-${stat.color}-300/[.07] p-3`}
          >
            <div className="flex items-center gap-1.5">
              <stat.icon className={`size-3.5 text-${stat.color}-300`} />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider text-${stat.color}-300`}
              >
                {stat.label}
              </span>
            </div>
            <p className="mt-1 text-xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Product Breakdown */}
      {stats.total > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300 mb-3">
            <BarChart3 className="size-4" />
            Product Intelligence
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Price Range</span>
              <p className="font-bold text-white">
                ${stats.minPrice} - ${stats.maxPrice}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Out of Stock</span>
              <p className="font-bold text-white">{stats.outOfStock} items</p>
            </div>
            <div>
              <span className="text-slate-500">Collections</span>
              <p className="font-bold text-white">{collections.length}</p>
            </div>
          </div>

          {/* Price Distribution */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Price Distribution
            </span>
            <div className="mt-2 flex gap-1">
              {[
                { label: "<$25", value: priceTiers.under25 || 0, color: "bg-green-500" },
                { label: "$25-50", value: priceTiers["25to50"] || 0, color: "bg-cyan-500" },
                { label: "$50-100", value: priceTiers["50to100"] || 0, color: "bg-blue-500" },
                { label: "$100-200", value: priceTiers["100to200"] || 0, color: "bg-purple-500" },
                { label: "$200+", value: priceTiers.over200 || 0, color: "bg-pink-500" },
              ].map((tier) => {
                const pct = stats.total > 0 ? (tier.value / stats.total) * 100 : 0;
                return (
                  <div key={tier.label} className="flex-1 text-center">
                    <div className="h-16 flex items-end justify-center">
                      <div
                        className={`w-full rounded-t ${tier.color} transition-all`}
                        style={{ height: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[9px] text-slate-500">
                      {tier.label}
                    </div>
                    <div className="text-[10px] font-bold text-white">
                      {tier.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Top Products
              </span>
              <div className="mt-2 space-y-1.5">
                {topProducts.slice(0, 5).map((p: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5"
                  >
                    <span className="text-xs text-white truncate max-w-[60%]">
                      {p.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-300">
                        ${p.price}
                      </span>
                      {p.available ? (
                        <CheckCircle2 className="size-3 text-green-500" />
                      ) : (
                        <XCircle className="size-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Installed Apps */}
      {installedApps.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-300 mb-3">
            <Zap className="size-4" />
            Installed Apps ({installedApps.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {installedApps.map((app: string) => (
              <span
                key={app}
                className="rounded-full border border-purple-400/20 bg-purple-400/10 px-2.5 py-1 text-[10px] font-bold text-purple-200"
              >
                {app}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-300 mb-3">
            <CreditCard className="size-4" />
            Payment Methods ({paymentMethods.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((method: string) => (
              <span
                key={method}
                className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] font-bold text-blue-200"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SEO Issues */}
      {seoIssues.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-300 mb-3">
            <Search className="size-4" />
            SEO Issues ({seoIssues.length})
          </h4>
          <div className="space-y-2">
            {seoIssues.map((issue: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-black/20 p-3"
              >
                <AlertTriangle
                  className={`size-4 shrink-0 mt-0.5 ${
                    issue.impact === "High"
                      ? "text-red-400"
                      : issue.impact === "Medium"
                        ? "text-yellow-400"
                        : "text-blue-400"
                  }`}
                />
                <div>
                  <p className="text-xs font-bold text-white">{issue.issue}</p>
                  <p className="text-[10px] text-slate-400">{issue.fix}</p>
                </div>
                <span
                  className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    issue.impact === "High"
                      ? "bg-red-400/20 text-red-300"
                      : issue.impact === "Medium"
                        ? "bg-yellow-400/20 text-yellow-300"
                        : "bg-blue-400/20 text-blue-300"
                  }`}
                >
                  {issue.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-green-400/20 bg-green-400/[.05] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-green-400 mb-3">
            <TrendingUp className="size-4" />
            Growth Recommendations ({recommendations.length})
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec: any, i: number) => (
              <div
                key={i}
                className="rounded-lg bg-black/20 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-300">
                    {rec.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      rec.priority === "Critical"
                        ? "bg-red-400/20 text-red-300"
                        : rec.priority === "High"
                          ? "bg-orange-400/20 text-orange-300"
                          : "bg-blue-400/20 text-blue-300"
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs font-bold text-white">
                  {rec.recommendation}
                </p>
                <p className="mt-1 text-[10px] text-emerald-200/70">
                  {rec.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Profiles */}
      {Object.keys(socialProfiles).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-pink-300 mb-3">
            <Star className="size-4" />
            Social Profiles
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(socialProfiles).map(([platform, handle]) => (
              <span
                key={platform}
                className="rounded-full border border-pink-400/20 bg-pink-400/10 px-2.5 py-1 text-[10px] font-bold text-pink-200"
              >
                {platform}: @{handle as string}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generate OTOM Plan */}
      <button
        onClick={() => pushToOtom("shopify-audit", data)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:from-amber-400 hover:to-orange-400"
      >
        <Zap className="size-4" />
        Generate OTOM Plan with AI
      </button>

      {/* Export & Reset */}
      <div className="flex gap-2">
        <button
          onClick={() => downloadJSON(data, `shopify-audit-${data.domain}`)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[.07] px-4 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-400/[.15]"
        >
          <Download className="size-3.5" />
          Download JSON
        </button>
        <button
          onClick={() => downloadCSV(data, `shopify-audit-${data.domain}`)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-green-400/20 bg-green-400/[.07] px-4 py-2 text-xs font-bold text-green-300 transition hover:bg-green-400/[.15]"
        >
          <Download className="size-3.5" />
          Download CSV
        </button>
      </div>
      <button
        onClick={onReset}
        className="w-full rounded-lg border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/[.07] hover:text-white"
      >
        Audit Another Store
      </button>
    </div>
  );
}
