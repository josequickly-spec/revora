import { createHash } from "node:crypto";
export function messageIdempotencyKey(campaignId: string, recipientId: string, stepId: string, contentVersion: number, scheduledAt: string) {
  return createHash("sha256").update([campaignId,recipientId,stepId,contentVersion,scheduledAt].join(":")).digest("hex");
}
