import * as cheerio from "cheerio";
import { z } from "zod";
import { assertPublicHostname, normalizePublicHttpUrl } from "@/lib/public-url-security";
import { calculateFunnelScore } from "@/lib/funnel-score";

export const funnelSpyRequestSchema = z.object({
  url: z.string().trim().min(3).max(300),
});

export type FunnelPage = {
  url: string;
  title: string;
  description: string;
  kind: "home" | "landing" | "product" | "form" | "checkout" | "thank-you" | "other";
  ctas: string[];
  forms: number;
  inputs: string[];
  technologies: string[];
  pixels: string[];
  evidence: Array<{ type: "cta" | "form" | "technology" | "pixel"; value: string; selector: string }>;
};

export type FunnelSpyAnalysis = {
  version?: { auditSchema: "funnel-audit-v1"; crawler: "funnelspy-crawler-v1"; score: "funnelspy-score-v1" };
  analyzedAt: string;
  origin: string;
  domain: string;
  score: number;
  scoreLabel: string;
  pages: FunnelPage[];
  funnelStages: Array<{ name: string; status: "detected" | "probable" | "missing"; evidence: string }>;
  totals: { pages: number; ctas: number; forms: number; pixels: number; technologies: number };
  technologies: string[];
  pixels: string[];
  performance: {
    status: "success" | "unavailable";
    performance: number | null;
    accessibility: number | null;
    seo: number | null;
    bestPractices: number | null;
    lcp: string | null;
  };
  domainIntel: {
    status: "success" | "unavailable";
    registrar: string | null;
    createdAt: string | null;
    ageYears: number | null;
    nameservers: string[];
  };
  screenshot: string | null;
  screenshotMobile: string | null;
  visualIdentity?: {
    logoUrl: string;
    heroImageUrl: string;
    colors: string[];
    fonts: string[];
    navigation: string[];
    layout: string;
  };
  discovery: { robotsAllowed: boolean | null; sitemapUrls: number; renderedWithBrowser: boolean };
  warnings: string[];
};

function absoluteAssetUrl(value: string | undefined, baseUrl: string) {
  if (!value || value.startsWith("data:")) return "";
  try {
    const url = new URL(value, baseUrl);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function extractVisualIdentity(url: string, html: string): FunnelSpyAnalysis["visualIdentity"] {
  const $ = cheerio.load(html);
  const logoElement = $('header img, nav img, img[alt*="logo" i], img[class*="logo" i]').first();
  const heroElement = $('[class*="hero" i] img, main img, article img').first();
  const logoUrl = absoluteAssetUrl(
    logoElement.attr("src") || logoElement.attr("data-src") || logoElement.attr("srcset")?.split(/[ ,]/)[0],
    url,
  );
  const heroImageUrl = absoluteAssetUrl(
    $('meta[property="og:image"]').attr("content") || heroElement.attr("src") || heroElement.attr("data-src") || heroElement.attr("srcset")?.split(/[ ,]/)[0],
    url,
  );
  const styleText = `${$("style").text()} ${$("[style]").map((_, element) => $(element).attr("style") || "").get().join(" ")}`;
  const colorCounts = new Map<string, number>();
  for (const match of styleText.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
    const color = match[0].toLowerCase();
    colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
  }
  const rankedColors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);
  const nonNeutralColors = rankedColors.filter((color) => !["#fff", "#ffffff", "#000", "#000000", "#333", "#333333"].includes(color));
  const colors = unique([...nonNeutralColors, ...rankedColors]).slice(0, 8);
  const linkedFontFamilies = $('link[href*="fonts.googleapis.com"]').map((_, element) => {
    try {
      const href = new URL($(element).attr("href") || "", url);
      return href.searchParams.getAll("family").map((family) => family.split(":")[0].replaceAll("+", " "));
    } catch {
      return [];
    }
  }).get();
  const fonts = unique([
    ...linkedFontFamilies,
    ...[...styleText.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map((match) => match[1].replace(/["']/g, "").trim()),
  ]).slice(0, 6);
  const navigation = unique($("header nav a, nav a, header a").map((_, element) => $(element).text().trim()).get())
    .filter((item) => item.length >= 2 && item.length <= 40)
    .slice(0, 8);
  const hasHero = $('[class*="hero" i], main h1').length > 0;
  const hasSplitHero = $('[class*="hero" i] img, main h1').length > 1;
  return {
    logoUrl,
    heroImageUrl,
    colors,
    fonts,
    navigation,
    layout: `${navigation.length ? "Header with navigation" : "Compact header"}; ${hasHero ? (hasSplitHero ? "split hero with visual" : "headline-led hero") : "content-led opening"}; preserve the original section rhythm and brand density.`,
  };
}

const PAGE_LIMIT = 8;
const FETCH_TIMEOUT = 12_000;

function normalizeUrl(input: string) {
  return normalizePublicHttpUrl(input);
}

async function assertPublicHost(url: URL) {
  await assertPublicHostname(url.hostname);
}

async function fetchText(url: string) {
  let current = normalizePublicHttpUrl(url);
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    await assertPublicHost(current);
    const response = await fetch(current, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: { "User-Agent": "Mozilla/5.0 FunnelSpyBot/1.0 (+public-site-audit)" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect response did not include a destination.");
      current = normalizePublicHttpUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("xml") && !type.includes("text/plain")) {
      throw new Error("Contenido no compatible");
    }
    return response.text();
  }
  throw new Error("Too many redirects.");
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function detectTechnology(html: string) {
  const signatures: Array<[string, RegExp]> = [
    ["Shopify", /cdn\.shopify\.com|Shopify\.theme/i],
    ["WordPress", /wp-content|wp-includes/i],
    ["Next.js", /__NEXT_DATA__|\/_next\//i],
    ["React", /data-reactroot|react-dom/i],
    ["Webflow", /webflow\.js|data-wf-/i],
    ["Wix", /wixstatic\.com|wix-code/i],
    ["HubSpot", /js\.hs-scripts\.com|hubspot/i],
    ["Stripe", /js\.stripe\.com/i],
    ["Klaviyo", /klaviyo/i],
    ["Google Tag Manager", /googletagmanager\.com/i],
  ];
  return signatures.filter(([, pattern]) => pattern.test(html)).map(([name]) => name);
}

function detectPixels(html: string) {
  const signatures: Array<[string, RegExp]> = [
    ["Meta Pixel", /connect\.facebook\.net|fbq\(/i],
    ["Google Analytics", /google-analytics\.com|gtag\(/i],
    ["TikTok Pixel", /analytics\.tiktok\.com|ttq\./i],
    ["LinkedIn Insight", /snap\.licdn\.com|linkedin_partner_id/i],
    ["Pinterest Tag", /pintrk\(|s\.pinimg\.com\/ct/i],
  ];
  return signatures.filter(([, pattern]) => pattern.test(html)).map(([name]) => name);
}

function classifyPage(url: string, title: string, forms: number): FunnelPage["kind"] {
  const value = `${url} ${title}`.toLowerCase();
  if (/thank|gracias|confirmation|success/.test(value)) return "thank-you";
  if (/checkout|cart|carrito|pago/.test(value)) return "checkout";
  if (/apply|quote|contact|form|demo|book|consulta/.test(value) || forms > 0) return "form";
  if (/product|products|shop|tienda|pricing|precios/.test(value)) return "product";
  if (/landing|lp\/|offer|oferta|campaign/.test(value)) return "landing";
  if (new URL(url).pathname === "/") return "home";
  return "other";
}

function parsePage(url: string, html: string): FunnelPage {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();
  const title = $("title").first().text().trim() || $("h1").first().text().trim() || new URL(url).hostname;
  const description = $('meta[name="description"]').attr("content")?.trim() || $("main p, article p, p").first().text().trim().slice(0, 220) || "No public description.";
  const ctas = unique(
    $("a, button, input[type=submit]")
      .map((_, element) => $(element).text().trim() || $(element).attr("value") || "")
      .get()
      .filter((text) => text.length >= 2 && text.length <= 70),
  ).slice(0, 12);
  const forms = $("form").length;
  const inputs = unique(
    $("input, select, textarea").map((_, element) =>
      $(element).attr("name") || $(element).attr("type") || element.tagName,
    ).get(),
  ).slice(0, 12);
  return {
    url,
    title,
    description,
    kind: classifyPage(url, title, forms),
    ctas,
    forms,
    inputs,
    technologies: detectTechnology(html),
    pixels: detectPixels(html),
    evidence: [
      ...ctas.slice(0, 6).map((value) => ({ type: "cta" as const, value, selector: "a, button, input[type=submit]" })),
      ...(forms ? [{ type: "form" as const, value: `${forms} formulario(s)`, selector: "form" }] : []),
      ...detectTechnology(html).map((value) => ({ type: "technology" as const, value, selector: "firma en HTML/script" })),
      ...detectPixels(html).map((value) => ({ type: "pixel" as const, value, selector: "firma en script" })),
    ],
  };
}

async function discoverPublicFiles(origin: URL) {
  let robotsAllowed: boolean | null = null;
  let sitemapUrls: string[] = [];
  try {
    const robots = await fetchText(new URL("/robots.txt", origin).toString());
    robotsAllowed = !/User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robots);
    const declared = [...robots.matchAll(/Sitemap:\s*(https?:\/\/\S+)/gi)].map((match) => match[1]);
    sitemapUrls.push(...declared);
  } catch {
    robotsAllowed = null;
  }
  if (!sitemapUrls.length) sitemapUrls.push(new URL("/sitemap.xml", origin).toString());
  const discovered: string[] = [];
  for (const sitemap of sitemapUrls.slice(0, 3)) {
    try {
      const xml = await fetchText(sitemap);
      discovered.push(...[...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)].map((match) => match[1].replaceAll("&amp;", "&")));
    } catch {
      // Optional discovery source.
    }
  }
  return { robotsAllowed, urls: unique(discovered).filter((url) => {
    try { return new URL(url).origin === origin.origin; } catch { return false; }
  }) };
}

async function renderWithBrowser(url: string) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await desktop.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await desktop.waitForTimeout(800);
      const html = await desktop.content();
      const desktopImage = await desktop.screenshot({ type: "jpeg", quality: 55, fullPage: false });
      const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
      await mobile.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await mobile.waitForTimeout(500);
      const mobileImage = await mobile.screenshot({ type: "jpeg", quality: 50, fullPage: false });
      return {
        html,
        desktop: `data:image/jpeg;base64,${desktopImage.toString("base64")}`,
        mobile: `data:image/jpeg;base64,${mobileImage.toString("base64")}`,
      };
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}

function discoverLinks(origin: URL, html: string) {
  const $ = cheerio.load(html);
  const weighted = $("a[href]")
    .map((_, element) => {
      try {
        const url = new URL($(element).attr("href") || "", origin);
        url.hash = "";
        if (url.origin !== origin.origin || !["http:", "https:"].includes(url.protocol)) return null;
        const text = `${url.pathname} ${$(element).text()}`.toLowerCase();
        const score = /checkout|cart|thank|contact|apply|demo|book|product|pricing|offer|landing|quote/.test(text) ? 10 : 1;
        return { url: url.toString(), score };
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean) as Array<{ url: string; score: number }>;
  return [...new Map(weighted.sort((a, b) => b.score - a.score).map((item) => [item.url, item])).values()]
    .slice(0, PAGE_LIMIT - 1)
    .map((item) => item.url);
}

async function pageSpeed(url: string): Promise<FunnelSpyAnalysis["performance"]> {
  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", "mobile");
    ["performance", "accessibility", "seo", "best-practices"].forEach((value) => endpoint.searchParams.append("category", value));
    if (process.env.GOOGLE_API_KEY) endpoint.searchParams.set("key", process.env.GOOGLE_API_KEY);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
    if (!response.ok) throw new Error("PageSpeed no disponible");
    const data = await response.json();
    const categories = data.lighthouseResult?.categories || {};
    const score = (key: string) => typeof categories[key]?.score === "number" ? Math.round(categories[key].score * 100) : null;
    return {
      status: "success",
      performance: score("performance"),
      accessibility: score("accessibility"),
      seo: score("seo"),
      bestPractices: score("best-practices"),
      lcp: data.lighthouseResult?.audits?.["largest-contentful-paint"]?.displayValue || null,
    };
  } catch {
    return { status: "unavailable", performance: null, accessibility: null, seo: null, bestPractices: null, lcp: null };
  }
}

async function rdap(domain: string): Promise<FunnelSpyAnalysis["domainIntel"]> {
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("RDAP no disponible");
    const data = await response.json();
    const event = (name: string) => data.events?.find((item: { eventAction?: string }) => item.eventAction === name)?.eventDate || null;
    const createdAt = event("registration");
    const registrar = data.entities?.find((item: { roles?: string[] }) => item.roles?.includes("registrar"))?.vcardArray?.[1]
      ?.find((item: unknown[]) => item[0] === "fn")?.[3] || null;
    return {
      status: "success",
      registrar,
      createdAt,
      ageYears: createdAt ? Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 31_557_600_000)) : null,
      nameservers: (data.nameservers || []).map((item: { ldhName?: string }) => item.ldhName).filter(Boolean).slice(0, 6),
    };
  } catch {
    return { status: "unavailable", registrar: null, createdAt: null, ageYears: null, nameservers: [] };
  }
}

async function urlscanScreenshot(domain: string) {
  try {
    const response = await fetch(`https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}&size=1`, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    const id = data.results?.[0]?._id;
    return id ? `https://urlscan.io/screenshots/${id}.png` : null;
  } catch {
    return null;
  }
}

export async function analyzeFunnel(input: string): Promise<FunnelSpyAnalysis> {
  const origin = normalizeUrl(input);
  await assertPublicHost(origin);
  const [rawHomeHtml, publicFiles, rendered] = await Promise.all([
    fetchText(origin.toString()),
    discoverPublicFiles(origin),
    renderWithBrowser(origin.toString()),
  ]);
  const homeHtml = rendered?.html || rawHomeHtml;
  const visualIdentity = extractVisualIdentity(origin.toString(), homeHtml);
  const prioritySitemapUrls = publicFiles.urls
    .filter((url) => /checkout|cart|thank|contact|apply|demo|book|product|pricing|offer|landing|quote/i.test(url))
    .slice(0, 3);
  const urls = unique([origin.toString(), ...prioritySitemapUrls, ...discoverLinks(origin, homeHtml)]).slice(0, PAGE_LIMIT);
  const pages = await Promise.all(
    urls.map(async (url, index) => {
      try {
        return parsePage(url, index === 0 ? homeHtml : await fetchText(url));
      } catch {
        return null;
      }
    }),
  ).then((items) => items.filter(Boolean) as FunnelPage[]);

  if (!pages.length) throw new Error("Could not read public HTML pages for the domain.");
  const technologies = unique(pages.flatMap((page) => page.technologies));
  const pixels = unique(pages.flatMap((page) => page.pixels));
  const allCtas = pages.flatMap((page) => page.ctas);
  const formCount = pages.reduce((sum, page) => sum + page.forms, 0);
  const hasCheckout = pages.some((page) => page.kind === "checkout");
  const hasThankYou = pages.some((page) => page.kind === "thank-you");
  const hasOffer = pages.some((page) => ["landing", "product"].includes(page.kind));
  const score = calculateFunnelScore({
    pages: pages.length, ctas: allCtas.length, forms: formCount,
    pixels: pixels.length, hasCheckout, hasThankYou,
  });
  const [performance, domainIntel, publicScreenshot] = await Promise.all([
    pageSpeed(origin.toString()),
    rdap(origin.hostname),
    urlscanScreenshot(origin.hostname),
  ]);
  const screenshot = rendered?.desktop || publicScreenshot;
  const stage = (name: string, found: boolean, probable: boolean, evidence: string) => ({
    name,
    status: found ? "detected" as const : probable ? "probable" as const : "missing" as const,
    evidence,
  });
  return {
    version: { auditSchema: "funnel-audit-v1", crawler: "funnelspy-crawler-v1", score: "funnelspy-score-v1" },
    analyzedAt: new Date().toISOString(),
    origin: origin.origin,
    domain: origin.hostname,
    score,
    scoreLabel: score >= 80 ? "Advanced funnel" : score >= 60 ? "Solid funnel" : score >= 40 ? "Basic funnel" : "Presence with no clear funnel",
    pages,
    funnelStages: [
      stage("Discovery", true, true, `${pages.length} public pages found`),
      stage("Offer", hasOffer, allCtas.length > 2, hasOffer ? "Offer or product page detected" : "CTAs suggest an offer"),
      stage("Capture", formCount > 0, pages.some((page) => page.kind === "form"), `${formCount} forms found`),
      stage("Conversion", hasCheckout, formCount > 0, hasCheckout ? "Public checkout detected" : "Inferred from forms"),
      stage("Confirmation", hasThankYou, hasCheckout || formCount > 0, hasThankYou ? "Confirmation page detected" : "The page may be protected behind an action"),
    ],
    totals: { pages: pages.length, ctas: unique(allCtas).length, forms: formCount, pixels: pixels.length, technologies: technologies.length },
    technologies,
    pixels,
    performance,
    domainIntel,
    screenshot,
    screenshotMobile: rendered?.mobile || null,
    visualIdentity,
    discovery: {
      robotsAllowed: publicFiles.robotsAllowed,
      sitemapUrls: publicFiles.urls.length,
      renderedWithBrowser: Boolean(rendered),
    },
    warnings: [
      "The analysis uses only public content and does not submit forms or access private areas.",
      ...(performance.status === "unavailable" ? ["PageSpeed did not return data for this run."] : []),
      ...(domainIntel.status === "unavailable" ? ["RDAP did not return data for this domain."] : []),
    ],
  };
}
