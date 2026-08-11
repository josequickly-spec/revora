import { assertSafeOutreachContent } from "./sanitization.ts";
import { isEligibleVerification, isEmailSyntaxValid } from "./recipient.ts";

export type ComplianceInput = {
  campaignStatus:string; recipientEmail:string; verificationStatus:string; riskyApproved:boolean;
  suppressed:boolean; unsubscribed:boolean; hardBounced:boolean;
  senderVerified:boolean; providerVerified:boolean; physicalAddress:string;
  subject:string; body:string; timezone:string; activeSteps:number;
};
export function validateCompliance(input: ComplianceInput) {
  const errors:string[]=[];
  if (input.campaignStatus !== "review_required") errors.push("review_required");
  if (!isEmailSyntaxValid(input.recipientEmail)) errors.push("invalid_email");
  if (!isEligibleVerification(input.verificationStatus,input.riskyApproved)) errors.push("verification_insufficient");
  if (input.suppressed) errors.push("suppressed");
  if (input.unsubscribed) errors.push("unsubscribed");
  if (input.hardBounced) errors.push("hard_bounced");
  if (!input.senderVerified) errors.push("sender_unverified");
  if (!input.providerVerified) errors.push("provider_unavailable");
  if (!input.physicalAddress.trim()) errors.push("physical_address_required");
  if (!input.timezone) errors.push("timezone_required");
  if (input.activeSteps < 1) errors.push("active_step_required");
  try { assertSafeOutreachContent(input.subject,input.body); } catch (error) { errors.push(error instanceof Error ? error.message : "invalid_content"); }
  if (errors.length) throw new Error(`compliance_failed:${[...new Set(errors)].join(",")}`);
  return true;
}

export function suppressionPrecedence(types:string[]) {
  const order=["complaint","global_unsubscribe","hard_bounce","legal_hold","manual_block","invalid_address","provider_block","repeated_soft_bounce","campaign_unsubscribe"];
  return order.find(type=>types.includes(type)) || null;
}
