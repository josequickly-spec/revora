import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { z } from "zod";

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
  discovery: { robotsAllowed: boolean | null; sitemapUrls: number; renderedWithBrowser: boolean };
  warnings: string[];
};

const PAGE_LIMIT = 8;
const FETCH_TIMEOUT = 12_000;

function normalizeUrl(input: string) {
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(candidate);
  url.hash = "";
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Solo se admiten URLs HTTP o HTTPS.");
  return url;
}

async function assertPublicHost(url: URL) {
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) throw new Error("El dominio debe ser público.");
  const addresses = await lookup(host, { all: true });
  const blocked = addresses.some(({ address }) =>
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|fc|fd|fe80)/i.test(address) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address),
  );
  if (blocked) throw new Error("No se permiten redes privadas o locales.");
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
    headers: { "User-Agent": "Mozilla/5.0 FunnelSpyBot/1.0 (+public-site-audit)" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") && !type.includes("xml") && !type.includes("text/plain")) {
    throw new Error("Contenido no compatible");
  }
  return response.text();
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
  const description = $('meta[name="description"]').attr("content")?.trim() || $("main p, article p, p").first().text().trim().slice(0, 220) || "Sin descripción pública.";
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

  if (!pages.length) throw new Error("No fue posible leer páginas HTML públicas del dominio.");
  const technologies = unique(pages.flatMap((page) => page.technologies));
  const pixels = unique(pages.flatMap((page) => page.pixels));
  const allCtas = pages.flatMap((page) => page.ctas);
  const formCount = pages.reduce((sum, page) => sum + page.forms, 0);
  const hasCheckout = pages.some((page) => page.kind === "checkout");
  const hasThankYou = pages.some((page) => page.kind === "thank-you");
  const hasOffer = pages.some((page) => ["landing", "product"].includes(page.kind));
  const score = Math.min(100, 28 + Math.min(pages.length * 5, 20) + Math.min(allCtas.length, 15) + Math.min(formCount * 9, 18) + Math.min(pixels.length * 5, 10) + (hasCheckout ? 5 : 0) + (hasThankYou ? 4 : 0));
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
    analyzedAt: new Date().toISOString(),
    origin: origin.origin,
    domain: origin.hostname,
    score,
    scoreLabel: score >= 80 ? "Embudo avanzado" : score >= 60 ? "Embudo sólido" : score >= 40 ? "Embudo básico" : "Presencia sin embudo claro",
    pages,
    funnelStages: [
      stage("Descubrimiento", true, true, `${pages.length} páginas públicas encontradas`),
      stage("Oferta", hasOffer, allCtas.length > 2, hasOffer ? "Página de oferta o producto detectada" : "CTAs sugieren una oferta"),
      stage("Captura", formCount > 0, pages.some((page) => page.kind === "form"), `${formCount} formularios encontrados`),
      stage("Conversión", hasCheckout, formCount > 0, hasCheckout ? "Checkout público detectado" : "Inferido a partir de formularios"),
      stage("Confirmación", hasThankYou, hasCheckout || formCount > 0, hasThankYou ? "Página de confirmación detectada" : "La página podría estar protegida tras una acción"),
    ],
    totals: { pages: pages.length, ctas: unique(allCtas).length, forms: formCount, pixels: pixels.length, technologies: technologies.length },
    technologies,
    pixels,
    performance,
    domainIntel,
    screenshot,
    screenshotMobile: rendered?.mobile || null,
    discovery: {
      robotsAllowed: publicFiles.robotsAllowed,
      sitemapUrls: publicFiles.urls.length,
      renderedWithBrowser: Boolean(rendered),
    },
    warnings: [
      "El análisis usa únicamente contenido público y no envía formularios ni accede a áreas privadas.",
      ...(performance.status === "unavailable" ? ["PageSpeed no devolvió datos en esta ejecución."] : []),
      ...(domainIntel.status === "unavailable" ? ["RDAP no devolvió datos para este dominio."] : []),
    ],
  };
}
