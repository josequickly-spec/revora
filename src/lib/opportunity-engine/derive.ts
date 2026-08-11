import type { StoredAudit } from "@/lib/funnelspy-store";
import type {
  Opportunity,
  OpportunityCategory,
  OpportunityEffort,
  OpportunityPriority,
  OpportunityResult,
} from "./contracts";

export const OPPORTUNITY_RULES_VERSION = "opportunity-rules-v1" as const;

type AddInput = {
  rule: string;
  category: OpportunityCategory;
  title: string;
  description: string;
  fact: string;
  value: string | number | boolean | null;
  priority: OpportunityPriority;
  effort: OpportunityEffort;
  confidence?: Opportunity["confidence"];
  action: string;
  pages?: string[];
};

export function deriveOpportunities(audit: StoredAudit): OpportunityResult {
  const analysis = audit.analysis;
  const warnings: string[] = [];
  if (!analysis.pages?.length) {
    return { opportunities: [], warnings: ["The persisted audit has no page evidence; opportunities cannot be derived."], rulesVersion: OPPORTUNITY_RULES_VERSION };
  }
  if (analysis.performance.status === "unavailable") warnings.push("PageSpeed evidence is unavailable; performance opportunities were not inferred.");
  const derivedAt = audit.createdAt;
  const opportunities = new Map<string, Opportunity>();
  const add = (input: AddInput) => {
    const id = `${audit.id}:${OPPORTUNITY_RULES_VERSION}:${input.rule}`;
    if (opportunities.has(id)) return;
    opportunities.set(id, {
      id, businessId: audit.businessId, auditId: audit.id, category: input.category,
      title: input.title, description: input.description,
      evidence: [{ fact: input.fact, value: input.value, pageUrl: input.pages?.[0] || null }],
      evidenceSource: "funnelspy_persisted_audit", affectedPages: [...new Set(input.pages || [])],
      priority: input.priority, impact: input.priority, effort: input.effort,
      confidence: input.confidence || "high", status: "derived",
      recommendedAction: input.action, sourceRule: input.rule, derivedAt,
      rulesVersion: OPPORTUNITY_RULES_VERSION,
    });
  };

  for (const stage of analysis.funnelStages.filter(item => item.status === "missing")) {
    const key = stage.name.toLowerCase();
    const critical = /captura|conversi/.test(key);
    add({
      rule: `missing-stage-${slug(key)}`, category: "funnel_stage",
      title: `${stage.name} stage was not detected`,
      description: "The persisted crawl did not find direct evidence for this funnel stage.",
      fact: stage.evidence, value: stage.status, priority: critical ? "high" : "medium",
      effort: "medium", confidence: "high",
      action: `Review the audited pages and add a clearly evidenced ${stage.name.toLowerCase()} step.`,
    });
  }
  if (analysis.totals.forms === 0) add({
    rule: "no-lead-capture-form", category: "lead_capture", title: "No lead-capture form detected",
    description: `FunnelSpy inspected ${analysis.totals.pages} public pages and found no forms.`,
    fact: "forms", value: 0, priority: "high", effort: "low",
    action: "Add an accessible lead-capture form with clear consent and a defined follow-up path.",
    pages: analysis.pages.map(page => page.url),
  });
  if (analysis.totals.ctas === 0) add({
    rule: "no-primary-cta", category: "conversion", title: "No call to action detected",
    description: "No button, link or submit control met the crawler evidence criteria.",
    fact: "ctas", value: 0, priority: "critical", effort: "low",
    action: "Add a clear primary action and verify it is visible and keyboard accessible.",
    pages: analysis.pages.map(page => page.url),
  });
  if (analysis.pixels.length === 0) add({
    rule: "no-tracking-pixel", category: "tracking", title: "No analytics or advertising pixel detected",
    description: "The persisted HTML evidence contains no supported tracking signature.",
    fact: "pixels", value: 0, priority: "medium", effort: "low",
    action: "Confirm the measurement plan and install consent-aware analytics if appropriate.",
    pages: analysis.pages.map(page => page.url),
  });
  const performance = analysis.performance.performance;
  if (analysis.performance.status === "success" && performance != null && performance < 50) add({
    rule: "mobile-performance-below-50", category: "performance", title: "Mobile performance is below 50",
    description: "The stored PageSpeed mobile performance score crossed the documented severe threshold.",
    fact: "PageSpeed mobile performance", value: performance, priority: "high", effort: "medium",
    action: "Profile the largest mobile bottlenecks and prioritize LCP, JavaScript and image delivery.",
    pages: [analysis.origin],
  });
  const accessibility = analysis.performance.accessibility;
  if (analysis.performance.status === "success" && accessibility != null && accessibility < 70) add({
    rule: "accessibility-below-70", category: "accessibility", title: "Accessibility score is below 70",
    description: "The stored PageSpeed accessibility score crossed the documented review threshold.",
    fact: "PageSpeed accessibility", value: accessibility, priority: "high", effort: "medium",
    action: "Review automated findings, then perform keyboard and screen-reader checks.",
    pages: [analysis.origin],
  });
  const seo = analysis.performance.seo;
  if (analysis.performance.status === "success" && seo != null && seo < 70) add({
    rule: "seo-below-70", category: "seo", title: "SEO score is below 70",
    description: "The stored PageSpeed SEO score crossed the documented review threshold.",
    fact: "PageSpeed SEO", value: seo, priority: "medium", effort: "medium",
    action: "Review the saved PageSpeed findings and correct confirmed crawl/indexing issues.",
    pages: [analysis.origin],
  });
  if (analysis.discovery.robotsAllowed === false) add({
    rule: "robots-blocks-public-crawl", category: "technical", title: "robots.txt blocks the public crawler",
    description: "FunnelSpy found an explicit global crawl restriction.",
    fact: "robotsAllowed", value: false, priority: "medium", effort: "low",
    action: "Confirm the restriction is intentional and does not block required public discovery.",
    pages: [analysis.origin],
  });

  return {
    opportunities: [...opportunities.values()].sort((a, b) => rank(a.priority) - rank(b.priority) || a.id.localeCompare(b.id)),
    warnings,
    rulesVersion: OPPORTUNITY_RULES_VERSION,
  };
}

function slug(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function rank(value: OpportunityPriority) { return ({ critical: 0, high: 1, medium: 2, low: 3 })[value]; }
