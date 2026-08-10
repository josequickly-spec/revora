import { OUTREACH_MASTER_PROMPT } from "./prompt";
import type { SelectedInsight } from "./insights";

interface OutreachPayload {
  businessName: string;
  domain: string;
  industry: string;
  country: string;
  businessDescription?: string;
  targetAudience?: string;
  currentOffer?: string;
  contactName?: string;
  contactRole?: string;
  auditOpportunities: string;
  auditEvidence: string;
  priorityIssues: string;
  hook?: string;
  coreOffer?: string;
  upsell?: string;
  downsell?: string;
  customerJourney?: string;
  valueProposition?: string;
  previewAvailable: boolean;
  previewUrl?: string;
  previewDescription?: string;
}

export async function generatePersonalizedEmail(
  payload: OutreachPayload,
  selectedInsights?: SelectedInsight[]
): Promise<any> {
  // Replace all placeholders in the prompt
  let finalPrompt = OUTREACH_MASTER_PROMPT
    .replace(/{{businessName}}/g, payload.businessName)
    .replace(/{{domain}}/g, payload.domain)
    .replace(/{{industry}}/g, payload.industry)
    .replace(/{{country}}/g, payload.country)
    .replace(/{{businessDescription}}/g, payload.businessDescription || "Not available")
    .replace(/{{targetAudience}}/g, payload.targetAudience || "Not available")
    .replace(/{{currentOffer}}/g, payload.currentOffer || "Not available")
    .replace(/{{contactName}}/g, payload.contactName || "")
    .replace(/{{contactRole}}/g, payload.contactRole || "")
    .replace(/{{auditOpportunities}}/g, payload.auditOpportunities)
    .replace(/{{auditEvidence}}/g, payload.auditEvidence)
    .replace(/{{priorityIssues}}/g, payload.priorityIssues)
    .replace(/{{hook}}/g, payload.hook || "Not defined")
    .replace(/{{coreOffer}}/g, payload.coreOffer || "Not defined")
    .replace(/{{upsell}}/g, payload.upsell || "Not defined")
    .replace(/{{downsell}}/g, payload.downsell || "Not defined")
    .replace(/{{customerJourney}}/g, payload.customerJourney || "Not defined")
    .replace(/{{valueProposition}}/g, payload.valueProposition || "Not defined")
    .replace(/{{previewAvailable}}/g, payload.previewAvailable ? "true" : "false")
    .replace(/{{previewUrl}}/g, payload.previewUrl || "")
    .replace(/{{previewDescription}}/g, payload.previewDescription || "");

  // If we already have selected insights, add them to the prompt
  if (selectedInsights && selectedInsights.length === 2) {
    const insightsText = selectedInsights.map((i, idx) => 
      `${idx + 1}. ${i.title} — ${i.observation} (Evidence: ${i.evidence})`
    ).join("\n");
    
    finalPrompt += `\n\nIMPORTANT: Use these two pre-selected insights:\n${insightsText}`;
  }

  // Here you would call your LLM (OpenAI, Anthropic, etc.)
  // For now we return the constructed prompt
  return {
    prompt: finalPrompt,
    payload,
    selectedInsights: selectedInsights || null,
  };
}
