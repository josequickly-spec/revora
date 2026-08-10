export interface SiteAudit {
  url: string;
  reachable: boolean;
  status: number;
  responseTimeMs: number;
  title: string | null;
  description: string | null;
  canonical: string | null;
  language: string | null;
  h1: string[];
  h2Count: number;
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinkCount: number;
  externalLinkCount: number;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasStructuredData: boolean;
  hasAnalytics: boolean;
  hasMetaPixel: boolean;
  platform: string;
  productSignals: number;
  issues: string[];
  score: number;
}

const text = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function auditSite(input: string): Promise<SiteAudit> {
  const raw = input.trim().replace(/\/+$/, "");
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const started = Date.now();
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; RevoraAudit/1.0)" },
  });
  const html = await response.text();
  const finalUrl = response.url || url;
  const origin = new URL(finalUrl).origin;
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1];
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i)?.[1];
  const language = html.match(/<html[^>]+lang=["']([^"']+)/i)?.[1];
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].slice(0, 8).map(m => text(m[1]));
  const h2Count = [...html.matchAll(/<h2\b/gi)].length;
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  const imagesWithoutAlt = images.filter(tag => !/\balt=["'][^"']+["']/i.test(tag)).length;
  const links = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map(m => m[1]);
  const internalLinkCount = links.filter(href => href.startsWith("/") || href.startsWith(origin)).length;
  const externalLinkCount = links.filter(href => /^https?:\/\//i.test(href) && !href.startsWith(origin)).length;
  const [robots, sitemap] = await Promise.all([
    fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(6000) }).then(r => r.ok).catch(() => false),
    fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(6000) }).then(r => r.ok).catch(() => false),
  ]);
  const platform = detectWebsitePlatform(html);
  const issues: string[] = [];
  if (!title) issues.push("Missing title tag");
  else if (text(title).length < 25 || text(title).length > 65) issues.push("Title length is not SEO-optimal");
  if (!description) issues.push("Missing meta description");
  if (h1.length !== 1) issues.push(`Detected ${h1.length} H1 headings`);
  if (imagesWithoutAlt > 0) issues.push(`${imagesWithoutAlt} images are missing alt text`);
  if (!canonical) issues.push("Missing canonical URL");
  if (!robots) issues.push("robots.txt not found");
  if (!sitemap) issues.push("sitemap.xml not found");
  if (Date.now() - started > 3000) issues.push("The initial response was slow");
  const score = Math.max(0, 100 - issues.length * 9);
  return {
    url: finalUrl, reachable: response.ok, status: response.status,
    responseTimeMs: Date.now() - started, title: title ? text(title) : null,
    description: description ? text(description) : null, canonical: canonical || null,
    language: language || null, h1, h2Count, imageCount: images.length, imagesWithoutAlt,
    internalLinkCount, externalLinkCount, hasRobotsTxt: robots, hasSitemap: sitemap,
    hasStructuredData: /application\/ld\+json/i.test(html),
    hasAnalytics: /googletagmanager|gtag\(|google-analytics/i.test(html),
    hasMetaPixel: /connect\.facebook\.net|fbq\(/i.test(html), platform,
    productSignals: [...html.matchAll(/\/products\/|product:price|schema\.org\/Product/gi)].length,
    issues, score,
  };
}

export function detectWebsitePlatform(html: string): string {
  const detectors: Array<[string, RegExp]> = [
    ["Shopify", /cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i],
    ["WooCommerce", /woocommerce|wp-content\/plugins\/woocommerce/i],
    ["WordPress", /wp-content|wp-includes|wordpress/i],
    ["Wix", /wixstatic\.com|wix-code|x-wix-/i],
    ["Squarespace", /static\d*\.squarespace\.com|squarespace-cdn\.com|squarespace/i],
    ["Webflow", /webflow\.com|data-wf-page|data-wf-site/i],
    ["HubSpot", /js\.hs-scripts\.com|hubspot/i],
    ["GoDaddy", /img1\.wsimg\.com|godaddysites\.com/i],
    ["Weebly", /editmysite\.com|weebly\.com/i],
    ["BigCommerce", /cdn\d*\.bigcommerce\.com|stencil-utils/i],
    ["PrestaShop", /prestashop|modules\/ps_/i],
  ];
  return detectors.find(([, pattern]) => pattern.test(html))?.[0] || "Website";
}
