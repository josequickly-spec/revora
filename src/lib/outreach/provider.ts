export type ProviderMessage = { to:string; from:string; replyTo:string; subject:string; html:string; text:string; idempotencyKey:string };
export type ProviderSendResult = { provider:"dry-run"; providerMessageId:string; accepted:false; status:"dry_run"; requestId:null; latencyMs:number; warnings:string[]; safeErrorCode:null };
export interface OutreachProvider { send(message: ProviderMessage): Promise<ProviderSendResult> }
export class DryRunOutreachProvider implements OutreachProvider {
  async send(message: ProviderMessage): Promise<ProviderSendResult> {
    const started=Date.now();
    void message;
    return { provider:"dry-run", providerMessageId:`dry-${message.idempotencyKey.slice(0,16)}`, accepted:false, status:"dry_run", requestId:null, latencyMs:Date.now()-started, warnings:["Dry-run mode: no email was transmitted."], safeErrorCode:null };
  }
}
export function getOutreachProvider() { return new DryRunOutreachProvider(); }
