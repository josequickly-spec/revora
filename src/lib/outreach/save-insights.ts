import { saveSelectedInsights, approveInsights, type SelectedInsight } from "./insights";

export interface SaveInsightsParams {
  businessId: number;
  campaignId?: string;
  insights: SelectedInsight[];
  approvedBy?: string;
}

/**
 * Saves the 2 selected insights for a business/campaign.
 * This should be called after the user approves the insights in the ApprovalGate.
 */
export async function saveApprovedInsights(params: SaveInsightsParams) {
  const { businessId, insights, approvedBy } = params;

  // Save in memory (replace this with DB call when ready)
  const record = saveSelectedInsights(businessId, insights);
  
  // Mark as approved
  approveInsights(businessId, approvedBy);

  return {
    success: true,
    businessId,
    insightsCount: insights.length,
    approved: true,
    record,
  };
}

/**
 * Prepares the payload for the email generator using the approved insights.
 */
export function prepareOutreachPayloadWithInsights(
  basePayload: any,
  approvedInsights: SelectedInsight[]
) {
  return {
    ...basePayload,
    selectedInsights: approvedInsights,
  };
}
