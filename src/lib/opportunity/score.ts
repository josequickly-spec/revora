export interface OpportunityScoreInput {
  monthlyRevenue: number;
  hasWebsite: boolean;
  hasEcommerce: boolean;
  hasContactForm: boolean;
  hasSocialProof: boolean;
  platform?: string;
  country?: string;
}

export interface OpportunityScoreResult {
  score: number;
  priority: "A" | "B" | "C" | "D";
  reasons: string[];
  recommendation: string;
}

export function calculateOpportunityScore(input: OpportunityScoreInput): OpportunityScoreResult {
  let score = 0;
  const reasons: string[] = [];

  if (input.monthlyRevenue >= 100000) { score += 35; reasons.push("High monthly revenue (100k+)"); }
  else if (input.monthlyRevenue >= 50000) { score += 28; reasons.push("Good monthly revenue (50k+)"); }
  else if (input.monthlyRevenue >= 25000) { score += 20; reasons.push("Medium monthly revenue (25k+)"); }
  else if (input.monthlyRevenue >= 10000) { score += 12; reasons.push("Low but existing revenue"); }
  else { reasons.push("Very low or unverified revenue"); }

  if (input.hasWebsite) { score += 10; reasons.push("Has active website"); }
  if (input.hasEcommerce) { score += 10; reasons.push("Has ecommerce capability"); }
  if (input.hasContactForm) { score += 5; reasons.push("Has contact form"); }

  if (input.hasSocialProof) { score += 20; reasons.push("Has social proof elements"); }

  if (input.platform === "Shopify" || input.platform === "WooCommerce") { score += 10; reasons.push("Modern ecommerce platform detected"); }
  else if (input.platform) { score += 5; reasons.push("Known platform detected"); }

  const strongMarkets = ["Spain", "United States", "Canada", "Mexico", "Colombia", "Argentina"];
  if (input.country && strongMarkets.includes(input.country)) { score += 10; reasons.push("Strong market country"); }

  score = Math.min(100, Math.max(0, score));

  let priority: "A" | "B" | "C" | "D";
  let recommendation: string;

  if (score >= 80) { priority = "A"; recommendation = "Excellent candidate. High probability of interest."; }
  else if (score >= 65) { priority = "B"; recommendation = "Good candidate. Worth pursuing."; }
  else if (score >= 45) { priority = "C"; recommendation = "Average candidate. Consider only if time allows."; }
  else { priority = "D"; recommendation = "Low priority. Skip unless specific reason."; }

  return { score, priority, reasons, recommendation };
}
