import { handleResendWebhook } from "@/lib/outreach/resend-webhook-handler";

export async function POST(request: Request) {
  return handleResendWebhook(request);
}
