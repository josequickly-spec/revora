"use client";

import { useState } from "react";
import { Zap, Activity } from "lucide-react";
import BusinessDiscoveryScraper from "./BusinessDiscoveryScraper";
import FunnelAnalyzerComponent from "./FunnelAnalyzerComponent";
import CompetitorMonitorComponent from "./CompetitorMonitorComponent";
import ShopifyAuditComponent from "./ShopifyAuditComponent";
import {
  DataEnrichmentComponent,
  ContactExtractorComponent,
  ProposalPersonalizerComponent,
} from "./RemainingScrapers";
import {
  GoogleMapsLeadsComponent,
  LinkedInCompanyComponent,
  FacebookAdsComponent,
  InstagramProfileComponent,
  ContactScraperComponent,
  SocialLeadsComponent,
  GoogleMapsReviewsComponent,
  TikTokProfileComponent,
  LinkedInEmailComponent,
  LinkedInPeopleComponent,
  FacebookPageDetailsComponent,
  FacebookAdLeadsComponent,
  AllSocialEmailsComponent,
  TrustpilotReviewsComponent,
  SimilarWebComponent,
  YouTubeChannelComponent,
  TwitterProfileComponent,
} from "./ApifyScrapers";

interface ScrapingDashboardProps {
  businessId?: number;
  domain?: string;
}

export default function ScrapingDashboard({
  businessId,
  domain,
}: ScrapingDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("shopify");
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    runningJobs: 0,
  });

  const tabs = [
    {
      id: "shopify",
      label: "🛍️ Shopify Audit",
      icon: "🛍️",
      description: "Deep Shopify store analysis",
    },
    {
      id: "discovery",
      label: "🔍 Business Discovery",
      icon: "🔍",
      description: "Find businesses from directories",
    },
    {
      id: "funnel",
      label: "👁️ Funnel Analysis",
      icon: "👁️",
      description: "Analyze landing pages",
    },
    {
      id: "competitor",
      label: "👥 Competitors",
      icon: "👥",
      description: "Monitor competitors",
    },
    {
      id: "enrichment",
      label: "💾 Data Enrichment",
      icon: "💾",
      description: "Enrich business data",
    },
    {
      id: "contacts",
      label: "👤 Contacts",
      icon: "👤",
      description: "Extract contacts",
    },
    {
      id: "proposal",
      label: "📝 Proposals",
      icon: "📝",
      description: "Personalize proposals",
    },
    { id: "divider", label: "─── APIFY POWERED ───", icon: "", description: "" },
    {
      id: "apify-maps",
      label: "📍 Maps Leads",
      icon: "📍",
      description: "Google Maps with emails",
    },
    {
      id: "apify-linkedin",
      label: "💼 LinkedIn",
      icon: "💼",
      description: "Company intelligence",
    },
    {
      id: "apify-fbads",
      label: "📢 FB Ads Spy",
      icon: "📢",
      description: "Facebook Ad Library",
    },
    {
      id: "apify-instagram",
      label: "📸 Instagram",
      icon: "📸",
      description: "Profile intelligence",
    },
    {
      id: "apify-contacts",
      label: "🌐 Site Contacts",
      icon: "🌐",
      description: "Website contact crawl",
    },
    {
      id: "apify-social",
      label: "🎯 Social Leads",
      icon: "🎯",
      description: "Multi-platform leads",
    },
    {
      id: "apify-reviews",
      label: "⭐ Maps Reviews",
      icon: "⭐",
      description: "Google Maps reviews",
    },
    {
      id: "apify-tiktok",
      label: "🎵 TikTok",
      icon: "🎵",
      description: "TikTok profiles",
    },
    {
      id: "apify-li-emails",
      label: "📧 LI Emails",
      icon: "📧",
      description: "LinkedIn email finder",
    },
    {
      id: "apify-li-people",
      label: "🔎 LI People",
      icon: "🔎",
      description: "LinkedIn people search",
    },
    {
      id: "apify-fb-pages",
      label: "📘 FB Pages",
      icon: "📘",
      description: "Facebook page details",
    },
    {
      id: "apify-fb-leads",
      label: "🎯 FB Ad Leads",
      icon: "🎯2",
      description: "FB advertiser leads",
    },
    {
      id: "apify-all-emails",
      label: "📬 All Emails",
      icon: "📬",
      description: "Multi-platform emails",
    },
    {
      id: "apify-trustpilot",
      label: "💬 Trustpilot",
      icon: "💬",
      description: "Trustpilot reviews",
    },
    {
      id: "apify-similarweb",
      label: "📊 SimilarWeb",
      icon: "📊",
      description: "Traffic analytics",
    },
    {
      id: "apify-youtube",
      label: "▶️ YouTube",
      icon: "▶️",
      description: "Channel + emails",
    },
    {
      id: "apify-twitter",
      label: "🐦 Twitter/X",
      icon: "🐦",
      description: "X profile data",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-300/[.05] to-purple-300/[.05] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-300 mb-2">
              <Zap className="size-4" />
              Web Scraping
            </div>
            <h2 className="text-2xl font-black text-white">
              Scrapling Intelligence Platform
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Advanced web scraping for lead discovery, analysis, and personalization
            </p>
          </div>
          <div className="hidden sm:block text-4xl">🕷️</div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Jobs", value: stats.totalJobs, color: "cyan" },
          { label: "Completed", value: stats.completedJobs, color: "green" },
          { label: "Failed", value: stats.failedJobs, color: "red" },
          { label: "Running", value: stats.runningJobs, color: "blue" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-${stat.color}-300/20 bg-${stat.color}-300/[.07] p-4`}
          >
            <p className={`text-xs font-bold text-${stat.color}-300 uppercase tracking-wider`}>
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Tab Navigation */}
      <section className="rounded-xl border border-white/10 bg-black/20 p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-min">
          {tabs.map((tab) =>
            tab.id === "divider" ? (
              <span key="divider" className="flex items-center px-2 text-[9px] font-black uppercase tracking-[.2em] text-amber-400/60 whitespace-nowrap">
                APIFY
              </span>
            ) : (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "border-cyan-300 bg-cyan-300/[.15] text-cyan-200"
                    : "border-white/10 bg-white/[.03] text-slate-400 hover:bg-white/[.07]"
                }`}
              >
                {tab.label}
              </button>
            )
          )}
        </div>
      </section>

      {/* Tab Content */}
      <section>
        {activeTab === "shopify" && <ShopifyAuditComponent />}
        {activeTab === "discovery" && <BusinessDiscoveryScraper />}
        {activeTab === "funnel" && (
          <FunnelAnalyzerComponent businessId={businessId} />
        )}
        {activeTab === "competitor" && <CompetitorMonitorComponent />}
        {activeTab === "enrichment" && (
          <DataEnrichmentComponent businessId={businessId} />
        )}
        {activeTab === "contacts" && (
          <ContactExtractorComponent businessId={businessId} />
        )}
        {activeTab === "proposal" && (
          <ProposalPersonalizerComponent
            businessId={businessId}
            domain={domain}
          />
        )}
        {activeTab === "apify-maps" && <GoogleMapsLeadsComponent />}
        {activeTab === "apify-linkedin" && <LinkedInCompanyComponent />}
        {activeTab === "apify-fbads" && <FacebookAdsComponent />}
        {activeTab === "apify-instagram" && <InstagramProfileComponent />}
        {activeTab === "apify-contacts" && <ContactScraperComponent />}
        {activeTab === "apify-social" && <SocialLeadsComponent />}
        {activeTab === "apify-reviews" && <GoogleMapsReviewsComponent />}
        {activeTab === "apify-tiktok" && <TikTokProfileComponent />}
        {activeTab === "apify-li-emails" && <LinkedInEmailComponent />}
        {activeTab === "apify-li-people" && <LinkedInPeopleComponent />}
        {activeTab === "apify-fb-pages" && <FacebookPageDetailsComponent />}
        {activeTab === "apify-fb-leads" && <FacebookAdLeadsComponent />}
        {activeTab === "apify-all-emails" && <AllSocialEmailsComponent />}
        {activeTab === "apify-trustpilot" && <TrustpilotReviewsComponent />}
        {activeTab === "apify-similarweb" && <SimilarWebComponent />}
        {activeTab === "apify-youtube" && <YouTubeChannelComponent />}
        {activeTab === "apify-twitter" && <TwitterProfileComponent />}
      </section>

      {/* Info */}
      <section className="rounded-xl border border-white/10 bg-white/[.025] p-4">
        <div className="flex items-start gap-3">
          <Activity className="size-5 text-cyan-300 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-400">
            <p className="font-semibold text-white mb-2">How it works:</p>
            <ul className="space-y-1 text-xs leading-relaxed">
              <li>
                <strong>Business Discovery:</strong> Find local businesses from
                Google Maps, Yelp, BBB
              </li>
              <li>
                <strong>Funnel Analysis:</strong> Analyze competitor landing
                pages
              </li>
              <li>
                <strong>Competitor Intelligence:</strong> Track pricing and
                strategies
              </li>
              <li>
                <strong>Data Enrichment:</strong> Add company details and tech
                stack
              </li>
              <li>
                <strong>Contact Extraction:</strong> Find decision-makers and
                email addresses
              </li>
              <li>
                <strong>Proposal Personalization:</strong> Generate custom
                proposals using scraped data
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
