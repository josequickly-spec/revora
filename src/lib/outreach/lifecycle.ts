import type { CampaignStatus } from "./contracts.ts";

const transitions: Partial<Record<CampaignStatus, CampaignStatus[]>> = {
  draft: ["review_required","cancelled"],
  review_required: ["draft","approved","cancelled"],
  approved: ["scheduled","cancelled"],
  scheduled: ["running","cancelled"],
  running: ["paused","completed","cancelled","failed"],
  paused: ["running","cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  failed: ["archived"],
};

export function assertCampaignTransition(from: CampaignStatus, to: CampaignStatus) {
  if (!transitions[from]?.includes(to)) throw new Error(`invalid_transition:${from}:${to}`);
}
