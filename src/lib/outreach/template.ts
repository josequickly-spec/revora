import { sanitizeOutreachText } from "./sanitization.ts";
import { OUTREACH_TEMPLATE_VERSION } from "./versions.ts";

const footer = "\n\nIf you prefer not to receive further messages, unsubscribe here: {{unsubscribe_url}}\n{{sender_business}}\n{{physical_address}}";
export const outreachTemplates = [
  { id:"simple-introduction", name:"Simple Introduction", messageType:"introduction", subject:"A quick introduction for {{business_name}}", body:"Hello{{contact_greeting}},\n\nI reviewed the public website for {{business_name}} and wanted to share a concise idea that may be useful. Would you be open to reviewing it?\n\n{{sender_name}}"+footer },
  { id:"audit-insight", name:"Audit Insight", messageType:"audit_summary", subject:"A documented website observation", body:"Hello{{contact_greeting}},\n\nA recent review recorded this observation for {{business_name}}: {{audit_insight}}. This is based on available public evidence and outcomes are not guaranteed.\n\n{{sender_name}}"+footer },
  { id:"proposal-delivery", name:"Proposal Delivery", messageType:"proposal_delivery", subject:"Proposal for your review", body:"Hello{{contact_greeting}},\n\nHere is the proposal prepared for {{business_name}}: {{proposal_url}}\n\nFinal scope, pricing and terms remain subject to your review.\n\n{{sender_name}}"+footer },
  { id:"value-follow-up", name:"Value Follow-Up", messageType:"follow_up", subject:"Following up with context", body:"Hello{{contact_greeting}},\n\nI wanted to follow up with one useful context point: {{audit_insight}}. No response is required if this is not relevant.\n\n{{sender_name}}"+footer },
  { id:"final-follow-up", name:"Final Follow-Up", messageType:"final_follow_up", subject:"Closing the loop", body:"Hello{{contact_greeting}},\n\nI am closing the loop on my earlier note. If the documented observation is useful, I am available to discuss it. Otherwise I will not continue this sequence.\n\n{{sender_name}}"+footer },
] as const;

export function renderTemplate(template: string, variables: Record<string,string | null | undefined>) {
  return sanitizeOutreachText(template.replace(/\{\{([a-z_]+)\}\}/g, (_match,key) => variables[key] || ""), 10_000);
}
export const templateVersion = OUTREACH_TEMPLATE_VERSION;
