import { getNextStep, shouldSendFollowUp, type BranchingState, type OutreachStep } from "./branching";
import { saveApprovedInsights } from "./save-insights";

/**
 * Outreach Worker - handles the decision tree and follow-up logic
 * This should be called daily by a cron job or manually from the dashboard.
 */
export async function processOutreachFollowUps() {
  // In a real implementation, this would query the database
  // for all active campaigns and check if they need a follow-up.
  
  console.log("[Outreach Worker] Checking follow-ups...");

  // Example: This is where you would loop through campaigns
  // const campaigns = await db.query.outreachCampaigns.findMany({ where: { status: "sent" } });

  // For now, this is a placeholder that shows the logic
  return {
    processed: 0,
    sent: 0,
    message: "Worker ready. Connect to real DB to process campaigns.",
  };
}

/**
 * Determines the next action for a specific campaign
 */
export function getCampaignNextAction(state: BranchingState) {
  if (state.responded) {
    return {
      action: "paused",
      reason: "Prospect responded",
      nextStep: "responded" as OutreachStep,
    };
  }

  const shouldSend = shouldSendFollowUp(state);
  const nextStep = getNextStep(state.currentStep, false);

  return {
    action: shouldSend ? "send" : "wait",
    nextStep,
    daysToWait: shouldSend ? 0 : 3,
  };
}
