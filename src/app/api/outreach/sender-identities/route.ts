import { NextResponse } from "next/server";
import { senderIdentitySchema } from "@/lib/outreach/contracts";
import {
  createSenderIdentity,
  ensureConfiguredOutreachProviders,
  listSenderIdentities,
} from "@/lib/outreach/store";

export async function GET() {
  const readiness=await ensureConfiguredOutreachProviders();
  return NextResponse.json({
    senders:await listSenderIdentities(),
    providers:readiness.providers,
    configuredFromEmail:readiness.configuredFromEmail,
    mode:readiness.resendStatus?.verified?"live_available":"dry-run",
  });
}

export async function POST(request:Request) {
  try {
    await ensureConfiguredOutreachProviders();
    const sender=await createSenderIdentity(senderIdentitySchema.parse(await request.json()));
    return NextResponse.json({sender},{status:201});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Invalid sender identity."},{status:400});
  }
}
