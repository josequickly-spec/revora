type OtomContext = {
  businessName: string;
  businessType: string;
  targetAudience: string;
  currentOffer: string;
  currentPrice: number;
  primaryObjective: string;
  valueProposition: string;
  weaknesses: string[];
  recommendations: string[];
  evidence: string[];
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

function fromShopifyAudit(data: any): OtomContext {
  const stats = data.products?.stats || {};
  const topProducts = data.products?.topProducts || [];
  const recommendations = data.recommendations || [];
  const seoIssues = data.seo?.issues || [];
  const perfIssues = data.performance?.issues || [];
  const collections = data.collections || [];
  const installedApps = data.installedApps || [];

  const productList = topProducts
    .slice(0, 5)
    .map((p: any) => `${p.title} ($${p.price})`)
    .join(", ");

  return {
    businessName: data.domain || "",
    businessType: "E-commerce (Shopify Store)",
    targetAudience: collections.length
      ? `Shoppers interested in: ${collections.slice(0, 5).join(", ")}`
      : "Online shoppers",
    currentOffer: productList || `${stats.total || 0} products available`,
    currentPrice: stats.avgPrice || 0,
    primaryObjective: "Increase online sales and conversion rate",
    valueProposition: topProducts.length
      ? `Sells ${stats.total} products across ${collections.length} collections, avg $${stats.avgPrice}`
      : `Shopify store at ${data.domain}`,
    weaknesses: [
      ...seoIssues.map((i: any) => `SEO: ${i.issue} (${i.impact} impact)`),
      ...perfIssues.map((i: any) => `Performance: ${i.issue || i}`),
      ...(stats.outOfStock > 0 ? [`${stats.outOfStock} products out of stock`] : []),
    ].slice(0, 12),
    recommendations: recommendations.map(
      (r: any) => `[${r.priority}] ${r.recommendation} — ${r.impact}`
    ).slice(0, 12),
    evidence: [
      `Store Score: ${data.storeScore}/100`,
      `SEO Score: ${data.seo?.score || 0}/100`,
      `Products: ${stats.total || 0}, Avg Price: $${stats.avgPrice || 0}`,
      `Price Range: $${stats.minPrice || 0} - $${stats.maxPrice || 0}`,
      installedApps.length ? `Apps (${installedApps.length}): ${installedApps.slice(0, 8).join(", ")}` : "",
      data.theme ? `Theme: ${data.theme}` : "",
      data.shopifyPlan ? `Plan: ${data.shopifyPlan}` : "",
      collections.length ? `Collections: ${collections.slice(0, 6).join(", ")}` : "",
      data.paymentMethods?.length ? `Payments: ${data.paymentMethods.join(", ")}` : "",
    ].filter(Boolean).slice(0, 30),
    sourceUrl: data.domain ? `https://${data.domain.replace(/^https?:\/\//, "")}` : undefined,
  };
}

function fromFunnelAnalysis(data: any): OtomContext {
  const pages = Array.isArray(data) ? data : data.pages || [];
  const headlines = pages.flatMap((p: any) => p.headlines || []);
  const ctas = pages.flatMap((p: any) => p.ctas || []);

  return {
    businessName: data.domain || data.url || "",
    businessType: "Digital Business / Online Funnel",
    targetAudience: "Website visitors and potential customers",
    currentOffer: headlines.slice(0, 3).join(" | ") || "Online services/products",
    currentPrice: 0,
    primaryObjective: "Improve funnel conversion and customer acquisition",
    valueProposition: ctas.length
      ? `Key CTAs: ${ctas.slice(0, 5).join(", ")}`
      : "Online presence with active funnels",
    weaknesses: [],
    recommendations: [],
    evidence: [
      `Pages analyzed: ${pages.length}`,
      headlines.length ? `Headlines: ${headlines.slice(0, 5).join(" | ")}` : "",
      ctas.length ? `CTAs found: ${ctas.slice(0, 8).join(", ")}` : "",
      ...pages.slice(0, 5).map((p: any) =>
        `${p.kind || "page"}: ${p.title || "Untitled"} — ${p.description || ""}`
      ),
    ].filter(Boolean).slice(0, 30),
    sourceUrl: data.url || data.origin,
  };
}

function fromDataEnrichment(data: any): OtomContext {
  return {
    businessName: data.companyName || data.domain || "",
    businessType: data.industry || data.category || "Business",
    targetAudience: data.targetMarket || "General audience",
    currentOffer: data.services?.join(", ") || data.description || "",
    currentPrice: data.revenue ? parseFloat(data.revenue) || 0 : 0,
    primaryObjective: "Grow market presence and revenue",
    valueProposition: data.description || data.tagline || "",
    weaknesses: [],
    recommendations: [],
    evidence: [
      data.companySize ? `Company size: ${data.companySize}` : "",
      data.foundedYear ? `Founded: ${data.foundedYear}` : "",
      data.techStack?.length ? `Tech stack: ${data.techStack.slice(0, 10).join(", ")}` : "",
      data.reviews ? `Reviews: ${JSON.stringify(data.reviews).slice(0, 200)}` : "",
      data.socialMedia ? `Social: ${Object.entries(data.socialMedia).map(([k, v]) => `${k}: ${v}`).join(", ")}` : "",
      data.employees ? `Employees: ${data.employees}` : "",
      data.location ? `Location: ${data.location}` : "",
    ].filter(Boolean).slice(0, 30),
    sourceUrl: data.domain ? `https://${data.domain.replace(/^https?:\/\//, "")}` : undefined,
  };
}

function fromCompetitorMonitor(data: any): OtomContext {
  const competitors = Array.isArray(data) ? data : data.competitors || [];

  return {
    businessName: "Competitive Analysis",
    businessType: "Market Intelligence",
    targetAudience: "Shared market audience across competitors",
    currentOffer: competitors
      .slice(0, 3)
      .map((c: any) => c.name || c.domain || c.url)
      .filter(Boolean)
      .join(" vs "),
    currentPrice: 0,
    primaryObjective: "Outperform competitors with a superior offer strategy",
    valueProposition: "Data-driven competitive advantage",
    weaknesses: competitors
      .flatMap((c: any) => (c.weaknesses || []).map((w: string) => `${c.name || c.domain}: ${w}`))
      .slice(0, 12),
    recommendations: competitors
      .flatMap((c: any) => (c.opportunities || c.gaps || []).map((g: string) => `Opportunity vs ${c.name || c.domain}: ${g}`))
      .slice(0, 12),
    evidence: [
      `Competitors analyzed: ${competitors.length}`,
      ...competitors.slice(0, 5).map((c: any) =>
        `${c.name || c.domain || c.url}: ${c.pricing || ""} ${c.positioning || ""} ${c.features?.slice(0, 3).join(", ") || ""}`.trim()
      ),
    ].filter(Boolean).slice(0, 30),
  };
}

function fromContactExtraction(data: any): OtomContext {
  const contacts = Array.isArray(data) ? data : data.contacts || [];
  const decisionMakers = contacts.filter((c: any) => c.role?.toLowerCase().includes("owner") || c.role?.toLowerCase().includes("ceo") || c.role?.toLowerCase().includes("founder") || c.role?.toLowerCase().includes("director"));

  return {
    businessName: data.domain || data.company || "",
    businessType: "Business (Contact-sourced)",
    targetAudience: "Decision-makers and key personnel",
    currentOffer: "",
    currentPrice: 0,
    primaryObjective: "Direct outreach to decision-makers",
    valueProposition: decisionMakers.length
      ? `${decisionMakers.length} decision-maker(s) identified`
      : `${contacts.length} contacts extracted`,
    weaknesses: [],
    recommendations: [],
    evidence: [
      `Total contacts: ${contacts.length}`,
      decisionMakers.length ? `Decision-makers: ${decisionMakers.map((c: any) => `${c.name} (${c.role})`).join(", ")}` : "",
      ...contacts.slice(0, 5).map((c: any) =>
        `${c.name || "Unknown"}: ${c.role || "N/A"} — ${c.email || ""}`
      ),
    ].filter(Boolean).slice(0, 30),
    sourceUrl: data.domain ? `https://${data.domain.replace(/^https?:\/\//, "")}` : undefined,
  };
}

function fromProposalPersonalizer(data: any): OtomContext {
  return {
    businessName: data.businessName || data.domain || "",
    businessType: data.industry || data.businessType || "Business",
    targetAudience: data.targetAudience || "",
    currentOffer: data.currentServices?.join(", ") || "",
    currentPrice: 0,
    primaryObjective: data.primaryGoal || "Business growth and digital transformation",
    valueProposition: data.uniqueSellingPoint || data.brandTone || "",
    weaknesses: (data.painPoints || data.weaknesses || []).slice(0, 12),
    recommendations: (data.suggestedServices || data.recommendations || []).slice(0, 12),
    evidence: [
      data.brandTone ? `Brand tone: ${data.brandTone}` : "",
      data.marketingMaturity ? `Marketing maturity: ${data.marketingMaturity}` : "",
      data.contentStrategy ? `Content strategy: ${data.contentStrategy}` : "",
      data.competitivePosition ? `Competitive position: ${data.competitivePosition}` : "",
      ...(data.observations || []).slice(0, 10),
    ].filter(Boolean).slice(0, 30),
    sourceUrl: data.domain ? `https://${data.domain.replace(/^https?:\/\//, "")}` : undefined,
  };
}

function fromGeneric(data: any): OtomContext {
  const stringified = JSON.stringify(data, null, 2);
  return {
    businessName: data.domain || data.businessName || data.name || data.url || "",
    businessType: data.businessType || data.type || data.industry || "",
    targetAudience: data.targetAudience || data.audience || "",
    currentOffer: data.offer || data.product || data.service || "",
    currentPrice: typeof data.price === "number" ? data.price : 0,
    primaryObjective: "Analyze and optimize business strategy",
    valueProposition: data.valueProposition || data.description || "",
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses.slice(0, 12) : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations.slice(0, 12) : [],
    evidence: [`Raw scraper data summary (${stringified.length} chars): ${stringified.slice(0, 500)}`],
    sourceUrl: data.url || data.sourceUrl,
  };
}

function fromApifyGoogleMaps(data: any): OtomContext {
  const leads = data.leads || [];
  return {
    businessName: leads[0]?.name || "Google Maps Leads",
    businessType: leads[0]?.category || "Local Business",
    targetAudience: `Local customers searching for ${leads[0]?.category || "services"}`,
    currentOffer: leads.slice(0, 3).map((l: any) => l.name).join(", "),
    currentPrice: 0,
    primaryObjective: "Acquire local leads from Google Maps with verified contact data",
    valueProposition: `${leads.length} businesses found with contact info`,
    weaknesses: leads.filter((l: any) => l.rating < 4).map((l: any) => `${l.name}: low rating (${l.rating})`).slice(0, 12),
    recommendations: leads.filter((l: any) => !l.website).map((l: any) => `${l.name}: no website — opportunity for web services`).slice(0, 12),
    evidence: leads.slice(0, 15).map((l: any) =>
      `${l.name} | ${l.email || "no email"} | ${l.phone || "no phone"} | ${l.rating}★ (${l.reviewCount} reviews)`
    ).slice(0, 30),
  };
}

function fromApifyFacebookAds(data: any): OtomContext {
  const ads = data.ads || [];
  return {
    businessName: ads[0]?.pageName || "Facebook Ads Analysis",
    businessType: "Digital Advertising",
    targetAudience: "Facebook/Instagram ad audiences",
    currentOffer: ads.slice(0, 3).map((a: any) => a.headline).filter(Boolean).join(" | ") || "",
    currentPrice: 0,
    primaryObjective: "Competitive ad intelligence — replicate winning strategies",
    valueProposition: `${ads.length} competitor ads analyzed`,
    weaknesses: [],
    recommendations: ads.filter((a: any) => a.status === "active").slice(0, 5).map((a: any) =>
      `Active ad from ${a.pageName}: "${(a.headline || a.adText || "").slice(0, 80)}"`
    ),
    evidence: ads.slice(0, 20).map((a: any) =>
      `[${a.pageName}] "${(a.adText || "").slice(0, 100)}" — ${a.platforms?.join(",") || "multi"} — since ${a.startDate || "?"}`
    ).slice(0, 30),
  };
}

function fromApifyInstagram(data: any): OtomContext {
  const profiles = data.profiles || [];
  const p = profiles[0] || {};
  return {
    businessName: p.fullName || p.username || "Instagram Profile",
    businessType: p.businessCategory || "Social Media Presence",
    targetAudience: `${p.followers || 0} Instagram followers`,
    currentOffer: p.biography || "",
    currentPrice: 0,
    primaryObjective: "Leverage Instagram presence for business growth",
    valueProposition: p.isBusinessAccount ? `Business account: ${p.businessCategory}` : `${p.posts} posts, ${p.followers} followers`,
    weaknesses: [],
    recommendations: [],
    evidence: [
      `Username: @${p.username}`,
      `Followers: ${p.followers} | Following: ${p.following} | Posts: ${p.posts}`,
      p.email ? `Email: ${p.email}` : "",
      p.phone ? `Phone: ${p.phone}` : "",
      p.externalUrl ? `Website: ${p.externalUrl}` : "",
      p.isVerified ? "Verified account" : "",
      ...(p.recentPosts || []).slice(0, 5).map((post: any) => `Post: ${(post.caption || "").slice(0, 80)} — ${post.likes} likes`),
    ].filter(Boolean).slice(0, 30),
    sourceUrl: p.externalUrl || `https://instagram.com/${p.username}`,
  };
}

const transformers: Record<string, (data: any) => OtomContext> = {
  "shopify-audit": fromShopifyAudit,
  "funnel-analysis": fromFunnelAnalysis,
  "data-enrichment": fromDataEnrichment,
  "competitor-monitoring": fromCompetitorMonitor,
  "contact-extraction": fromContactExtraction,
  "proposal-generation": fromProposalPersonalizer,
  "business-discovery": fromGeneric,
  "apify-google-maps-leads": fromApifyGoogleMaps,
  "apify-google-maps-reviews": fromGeneric,
  "apify-linkedin-companies": fromDataEnrichment,
  "apify-facebook-ads": fromApifyFacebookAds,
  "apify-instagram-profiles": fromApifyInstagram,
  "apify-contact-scraper": fromContactExtraction,
  "apify-social-leads": fromContactExtraction,
  "apify-tiktok-profiles": fromApifyInstagram,
  "apify-linkedin-emails": fromContactExtraction,
  "apify-linkedin-people-search": fromContactExtraction,
  "apify-facebook-page-details": fromApifyGoogleMaps,
  "apify-facebook-ad-leads": fromApifyFacebookAds,
  "apify-all-social-emails": fromContactExtraction,
  "apify-trustpilot-reviews": fromGeneric,
  "apify-similarweb": fromGeneric,
  "apify-youtube-channels": fromApifyInstagram,
  "apify-twitter-profiles": fromApifyInstagram,
};

export function scraperToOtomContext(scraperType: string, data: any): OtomContext {
  const transformer = transformers[scraperType] || fromGeneric;
  return transformer(data);
}

export function pushToOtom(scraperType: string, data: any): void {
  const context = scraperToOtomContext(scraperType, data);
  window.sessionStorage.setItem("revora-otom-context", JSON.stringify(context));
  window.location.href = "/otom?flow=1";
}
