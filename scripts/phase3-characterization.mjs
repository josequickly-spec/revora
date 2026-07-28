import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { funnelAuditRequestSchema } from "../src/lib/funnel-audit/contracts.ts";
import { AUDIT_FRESHNESS_DAYS, isReusableAudit, normalizeAuditDomain } from "../src/lib/funnel-audit/reuse.ts";
import { deriveOpportunities, OPPORTUNITY_RULES_VERSION } from "../src/lib/opportunity-engine/derive.ts";
import { calculateFunnelScore } from "../src/lib/funnel-score.ts";
import { isPrivateOrLocalAddress, normalizePublicHttpUrl } from "../src/lib/public-url-security.ts";

const request = funnelAuditRequestSchema.parse({ url: "https://example.com", businessId: 4 });
assert.equal(request.businessId, 4);
assert.equal(request.forceRefresh, false);
assert.equal(funnelAuditRequestSchema.safeParse({ url: "", businessId: -1 }).success, false);
assert.equal(normalizeAuditDomain("HTTPS://WWW.Example.com/path"), "example.com");
assert.equal(AUDIT_FRESHNESS_DAYS, 7);
assert.equal(calculateFunnelScore({ pages: 1, ctas: 0, forms: 0, pixels: 0, hasCheckout: false, hasThankYou: false }), 33);
assert.equal(calculateFunnelScore({ pages: 8, ctas: 20, forms: 3, pixels: 2, hasCheckout: true, hasThankYou: true }), 100);
for (const destination of ["http://localhost", "http://127.0.0.1", "http://169.254.169.254/latest/meta-data", "http://[::1]", "http://[fe80::1]", "ftp://example.com"]) {
  assert.throws(() => normalizePublicHttpUrl(destination));
}
assert.equal(isPrivateOrLocalAddress("10.0.0.1"), true);
assert.equal(isPrivateOrLocalAddress("172.31.0.1"), true);
assert.equal(isPrivateOrLocalAddress("192.168.1.1"), true);
assert.equal(isPrivateOrLocalAddress("::ffff:127.0.0.1"), true);
assert.equal(isPrivateOrLocalAddress("8.8.8.8"), false);

const analysis = {
  analyzedAt: "2026-07-28T12:00:00.000Z", origin: "https://example.com", domain: "example.com",
  score: 38, scoreLabel: "fixture", pages: [{
    url: "https://example.com", title: "Example", description: "Fixture", kind: "home",
    ctas: [], forms: 0, inputs: [], technologies: [], pixels: [], evidence: [],
  }],
  funnelStages: [
    { name: "Descubrimiento", status: "detected", evidence: "1 page" },
    { name: "Captura", status: "missing", evidence: "0 forms" },
    { name: "Conversión", status: "missing", evidence: "No checkout" },
  ],
  totals: { pages: 1, ctas: 0, forms: 0, pixels: 0, technologies: 0 },
  technologies: [], pixels: [],
  performance: { status: "success", performance: 42, accessibility: 65, seo: 68, bestPractices: 80, lcp: "4.2 s" },
  domainIntel: { status: "unavailable", registrar: null, createdAt: null, ageYears: null, nameservers: [] },
  screenshot: null, screenshotMobile: null,
  discovery: { robotsAllowed: false, sitemapUrls: 0, renderedWithBrowser: false },
  warnings: [],
};
const audit = {
  id: "audit-fixture", domain: "example.com", analysis, report: null,
  createdAt: "2026-07-28T12:00:00.000Z", shareToken: "share-fixture",
  businessId: 4, storageMode: "postgres", businessName: "Example",
};
const first = deriveOpportunities(audit);
const second = deriveOpportunities(audit);
assert.equal(first.rulesVersion, OPPORTUNITY_RULES_VERSION);
assert.deepEqual(first, second);
assert.equal(new Set(first.opportunities.map(item => item.id)).size, first.opportunities.length);
assert.ok(first.opportunities.every(item => item.evidence.length > 0));
assert.ok(first.opportunities.some(item => item.sourceRule === "no-lead-capture-form"));
assert.equal(first.opportunities.find(item => item.sourceRule === "no-primary-cta")?.priority, "critical");
assert.equal(isReusableAudit(audit, new Date("2026-07-30T12:00:00.000Z").getTime()), true);
assert.equal(isReusableAudit(audit, new Date("2026-08-10T12:00:00.000Z").getTime()), false);
assert.equal(deriveOpportunities({ ...audit, analysis: { ...analysis, pages: [] } }).opportunities.length, 0);

const funnelspySource = await readFile(new URL("../src/lib/funnelspy.ts", import.meta.url), "utf8");
assert.match(funnelspySource, /score: "funnelspy-score-v1"/);
const opportunitySource = await readFile(new URL("../src/lib/opportunity-engine/derive.ts", import.meta.url), "utf8");
assert.doesNotMatch(opportunitySource, /OpenAI|fetch\(|analyzeFunnel|Hunter|BuiltWith/);
const analyzeRoute = await readFile(new URL("../src/app/api/funnelspy/analyze/route.ts", import.meta.url), "utf8");
const storeSource = await readFile(new URL("../src/lib/funnelspy-store.ts", import.meta.url), "utf8");
assert.match(analyzeRoute, /The requested URL does not match the selected business/);
assert.match(analyzeRoute, /saveAudit\(analysis, null, \{ businessId: input\.businessId \}\)/);
assert.match(storeSource, /INSERT INTO funnelspy_audits \(id, domain, analysis, report, share_token, created_at, business_id\)/);
assert.match(storeSource, /non-durable in-memory storage/);
const monitorSource = await readFile(new URL("../src/app/api/funnelspy/monitor/route.ts", import.meta.url), "utf8");
assert.match(monitorSource, /saveAudit\(analysis, null, \{ businessId: monitor\.business_id \}\)/);

console.log("Phase 3 characterization: 36 assertions passed; no crawl, AI or provider calls used.");
