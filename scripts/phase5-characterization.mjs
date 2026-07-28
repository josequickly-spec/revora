import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { proposalCreateSchema, proposalUpdateSchema } from "../src/lib/proposal-builder/contracts.ts";
import { calculateProposalPricing } from "../src/lib/proposal-builder/pricing.ts";
import { assertProposalTransition } from "../src/lib/proposal-builder/lifecycle.ts";
import { createPublicProposalToken, hashPublicProposalToken, tokenHashesEqual } from "../src/lib/proposal-builder/public-token.ts";
import { assertNoUnsupportedFinancialClaims, escapeHtml, sanitizeProposalText } from "../src/lib/proposal-builder/sanitization.ts";
import { blankContent, defaultTerms, proposalTemplates, standardDisclaimers } from "../src/lib/proposal-builder/template.ts";
import { validateProposalForReady } from "../src/lib/proposal-builder/validation.ts";
import { exportProposalHtml, exportProposalJson, publicProposalPayload } from "../src/lib/proposal-builder/export.ts";
import { calculateFunnelScore } from "../src/lib/funnel-score.ts";

const auditId = "11111111-1111-4111-8111-111111111111";
const create = proposalCreateSchema.parse({ businessId: 7, auditId, proposalType: "funnel_optimization", creationMode: "evidence_assisted" });
assert.equal(create.businessId, 7);
assert.equal(create.locale, "en");
assert.equal(create.currency, "USD");
assert.equal(proposalCreateSchema.safeParse({ ...create, businessId: 0 }).success, false);
assert.equal(proposalCreateSchema.safeParse({ ...create, auditId: "bad" }).success, false);
assert.equal(proposalCreateSchema.safeParse({ ...create, creationMode: "automatic" }).success, false);
assert.equal(proposalCreateSchema.safeParse({ ...create, provider: "openai" }).success, false);

const pricingInput = {
  pricingModel: "fixed", currency: "USD",
  lineItems: [
    { id: "setup", name: "Setup", quantity: 2, unitAmountMinor: 12_345, recurringInterval: null, taxable: true },
    { id: "care", name: "Care", quantity: 1, unitAmountMinor: 5_000, recurringInterval: "month", taxable: false },
  ],
  discount: { type: "percentage", value: 1_250 },
  taxRateBasisPoints: 825,
  deposit: { type: "percentage", value: 5_000 },
};
const pricing = calculateProposalPricing(pricingInput);
assert.equal(pricing.subtotalMinor, 29_690);
assert.equal(pricing.discountMinor, 3_711);
assert.equal(pricing.taxMinor, 2_143);
assert.equal(pricing.totalMinor, 28_122);
assert.equal(pricing.depositMinor, 14_061);
assert.equal(pricing.remainingMinor, 14_061);
assert.equal(pricing.recurringTotalMinor, 5_000);
assert.equal(pricing.calculationVersion, "proposal-pricing-v1");
assert.equal(calculateProposalPricing({ ...pricingInput, discount: { type: "fixed", value: 99_999 } }).totalMinor, 0);
assert.equal(calculateProposalPricing({ ...pricingInput, deposit: { type: "fixed", value: 99_999 } }).remainingMinor, 0);

assert.doesNotThrow(() => assertProposalTransition("draft", "ready"));
assert.doesNotThrow(() => assertProposalTransition("ready", "published"));
assert.doesNotThrow(() => assertProposalTransition("published", "archived"));
assert.throws(() => assertProposalTransition("draft", "published"), /invalid_transition/);
assert.throws(() => assertProposalTransition("archived", "draft"), /invalid_transition/);
assert.throws(() => assertProposalTransition("accepted", "draft"), /invalid_transition/);

const firstToken = createPublicProposalToken();
const secondToken = createPublicProposalToken();
assert.ok(firstToken.token.length >= 40);
assert.equal(firstToken.hash.length, 64);
assert.equal(firstToken.prefix.length, 8);
assert.notEqual(firstToken.token, secondToken.token);
assert.notEqual(firstToken.hash, secondToken.hash);
assert.equal(hashPublicProposalToken(firstToken.token), firstToken.hash);
assert.equal(tokenHashesEqual(firstToken.hash, hashPublicProposalToken(firstToken.token)), true);
assert.equal(tokenHashesEqual(firstToken.hash, secondToken.hash), false);

assert.equal(sanitizeProposalText(" a\u0000b "), "ab");
assert.equal(sanitizeProposalText("<script>alert(1)</script>Safe"), "Safe");
assert.equal(escapeHtml(`<b title="x">&'</b>`), "&lt;b title=&quot;x&quot;&gt;&amp;&#39;&lt;/b&gt;");
assert.doesNotThrow(() => assertNoUnsupportedFinancialClaims("Potential qualitative improvement."));
assert.throws(() => assertNoUnsupportedFinancialClaims("Guaranteed revenue of $10,000"), /unsupported_financial_claim/);
assert.throws(() => assertNoUnsupportedFinancialClaims({ summary: "Will double conversions" }), /unsupported_financial_claim/);

assert.equal(proposalTemplates.length, 6);
assert.ok(proposalTemplates.some(item => item.type === "funnel_optimization"));
assert.equal(standardDisclaimers.length, 4);
assert.ok(standardDisclaimers.some(item => item.includes("not guaranteed")));
const content = blankContent();
assert.equal(content.recommendedServices.length, 0);
assert.equal(content.evidenceReferences.length, 0);
assert.equal(content.disclaimers.length, 4);
assert.equal(defaultTerms().validityDays, 30);

const evidence = {
  id: "ev-1", sourceType: "funnel_audit", sourceId: auditId, sourceVersion: "funnelspy-score-v1",
  label: "Lead capture", fact: "No form was detected.", advisory: false, capturedAt: "2026-07-28T12:00:00.000Z",
};
const readyContent = {
  ...content, executiveSummary: "The detected capture path should be reviewed.",
  recommendedServices: [{ id: "service-1", name: "Lead capture review", description: "Review forms.", reason: "Observed gap.", deliverables: ["Reviewed form"], relatedOpportunityIds: ["opp-1"], evidenceReferenceIds: ["ev-1"], selected: true }],
  deliverables: ["Reviewed form"], timeline: "Two weeks", assumptions: ["Access will be provided."],
  exclusions: ["Media spend."], evidenceReferences: [evidence],
};
const proposal = {
  id: "22222222-2222-4222-8222-222222222222", businessId: 7, auditId, consultantReportId: null,
  title: "Evidence proposal", proposalType: "funnel_optimization", status: "draft", currency: "USD", locale: "en",
  currentVersion: 1, publishedVersion: null, templateVersion: "proposal-template-v1", contentSchemaVersion: "proposal-schema-v1",
  publicTokenPrefix: "secret12", publicTokenCreatedAt: null, publicExpiresAt: null, firstViewedAt: null, lastViewedAt: null,
  viewCount: 0, createdAt: "2026-07-28T12:00:00.000Z", updatedAt: "2026-07-28T12:00:00.000Z",
  publishedAt: null, archivedAt: null, content: readyContent, pricing, terms: defaultTerms(),
  evidenceSnapshot: [evidence], internalNotes: "Never expose me", warnings: [],
};
assert.equal(validateProposalForReady(proposal), true);
assert.throws(() => validateProposalForReady({ ...proposal, title: "" }), /title_required/);
assert.throws(() => validateProposalForReady({ ...proposal, content: { ...readyContent, executiveSummary: "" } }), /executive_summary_required/);
assert.throws(() => validateProposalForReady({ ...proposal, content: { ...readyContent, evidenceReferences: [{ ...evidence, id: "invented" }] } }), /unknown_evidence/);
assert.throws(() => validateProposalForReady({ ...proposal, content: { ...readyContent, executiveSummary: "Guaranteed ROI of 50%" } }), /unsupported_financial_claim/);
assert.equal(proposalUpdateSchema.safeParse({ expectedVersion: 1, title: proposal.title, content: readyContent, pricingInput, terms: proposal.terms, internalNotes: "" }).success, true);
assert.equal(proposalUpdateSchema.safeParse({ expectedVersion: 0, title: proposal.title, content: readyContent, pricingInput, terms: proposal.terms, internalNotes: "" }).success, false);

const jsonExport = exportProposalJson(proposal);
const htmlExport = exportProposalHtml({ ...proposal, title: "<script>unsafe</script>" });
assert.doesNotMatch(jsonExport, /Never expose me/);
assert.doesNotMatch(jsonExport, /secret12/);
assert.match(jsonExport, /Draft proposal/);
assert.doesNotMatch(htmlExport, /<script>unsafe/);
assert.match(htmlExport, /&lt;script&gt;unsafe&lt;\/script&gt;/);
const publicPayload = publicProposalPayload({ ...proposal, status: "published", publishedVersion: 1 });
assert.equal("internalNotes" in publicPayload, false);
assert.equal("publicTokenPrefix" in publicPayload, false);

assert.equal(calculateFunnelScore({ pages: 1, ctas: 0, forms: 0, pixels: 0, hasCheckout: false, hasThankYou: false }), 33);
assert.equal(calculateFunnelScore({ pages: 8, ctas: 20, forms: 3, pixels: 2, hasCheckout: true, hasThankYou: true }), 100);

const store = await readFile(new URL("../src/lib/proposal-builder/store.ts", import.meta.url), "utf8");
const evidenceSource = await readFile(new URL("../src/lib/proposal-builder/evidence.ts", import.meta.url), "utf8");
const createRoute = await readFile(new URL("../src/app/api/proposals/route.ts", import.meta.url), "utf8");
const publicRoute = await readFile(new URL("../src/app/api/public/proposals/[token]/route.ts", import.meta.url), "utf8");
const consultantView = await readFile(new URL("../src/components/consultant/ConsultantView.tsx", import.meta.url), "utf8");
assert.match(store, /optimistic_conflict/);
assert.match(store, /published_version/);
assert.match(store, /public_token_hash/);
assert.match(store, /ON DELETE RESTRICT/);
assert.match(store, /status IN \('published','viewed'\)/);
assert.match(store, /view_count=view_count\+1/);
assert.doesNotMatch(store, /OPENAI|ANTHROPIC|createFunnel|outreach|CRM/);
assert.match(evidenceSource, /association_mismatch/);
assert.match(evidenceSource, /consultant_association_mismatch/);
assert.match(evidenceSource, /deriveOpportunities/);
assert.doesNotMatch(evidenceSource, /generateStructuredReport|responses\.parse/);
assert.match(createRoute, /export async function POST/);
assert.match(publicRoute, /getPublicProposal/);
assert.match(consultantView, /\/proposals\/new\?businessId=/);

console.log("Phase 5 characterization: 67 assertions passed; pure/local validation only, no network, database, AI provider, outreach, CRM, or funnel mutation used.");
