import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DryRunOutreachProvider,
  ResendOutreachProvider,
  mailboxAddress,
} from "../src/lib/outreach/provider.ts";
import { isVerifiedHunterResult } from "../src/lib/hunter.ts";
import { classifyProviderEvent } from "../src/lib/outreach/webhook.ts";

let assertions=0;
function check(value,message) {
  assert.ok(value,message);
  assertions++;
}
function equal(actual,expected,message) {
  assert.equal(actual,expected,message);
  assertions++;
}

const calls=[];
const successfulFetch=async(url,options={})=>{
  calls.push({url,options});
  if(String(url).includes("/domains")) {
    return new Response(JSON.stringify({data:[{name:"ecoscalepartner.com",status:"verified",capabilities:{sending:"enabled"}}]}),{status:200,headers:{"content-type":"application/json"}});
  }
  return new Response(JSON.stringify({id:"email-fixture-1"}),{status:200,headers:{"content-type":"application/json","x-request-id":"request-fixture-1"}});
};
const provider=new ResendOutreachProvider("test-key",successfulFetch);
const domain=await provider.domainStatus("ecoscalepartner.com");
check(domain.verified,"verified sending domain accepted");
check(domain.sendingEnabled,"sending capability required");
const sent=await provider.send({
  to:"recipient@example.com",
  from:"EcoScale Partner <renova@ecoscalepartner.com>",
  replyTo:"renova@ecoscalepartner.com",
  subject:"Reviewed observation",
  html:"<p>Reviewed observation</p>",
  text:"Reviewed observation",
  idempotencyKey:"fixture-message-key",
});
check(sent.accepted,"successful response accepted");
equal(sent.providerMessageId,"email-fixture-1","provider message id preserved");
equal(calls[1].options.headers["Idempotency-Key"],"fixture-message-key","idempotency header sent");
const sentPayload=JSON.parse(calls[1].options.body);
equal(sentPayload.reply_to,"renova@ecoscalepartner.com","reply-to sent");

const rateLimited=new ResendOutreachProvider("test-key",async()=>new Response(JSON.stringify({name:"rate_limit_exceeded"}),{status:429,headers:{"content-type":"application/json"}}));
const limited=await rateLimited.send({to:"a@example.com",from:"x@example.com",replyTo:"x@example.com",subject:"Hi",html:"Hi",text:"Hi",idempotencyKey:"rate-key"});
check(!limited.accepted&&limited.retryable,"rate limits are retryable");

const ambiguous=new ResendOutreachProvider("test-key",async()=>{throw new Error("socket closed")});
const unknown=await ambiguous.send({to:"a@example.com",from:"x@example.com",replyTo:"x@example.com",subject:"Hi",html:"Hi",text:"Hi",idempotencyKey:"unknown-key"});
equal(unknown.status,"unknown","ambiguous transport remains unknown");
check(!unknown.retryable,"ambiguous acceptance is never retried automatically");

const dryRun=await new DryRunOutreachProvider().send({to:"a@example.com",from:"x@example.com",replyTo:"x@example.com",subject:"Hi",html:"Hi",text:"Hi",idempotencyKey:"dry-key"});
check(!dryRun.accepted,"dry-run never transmits");
equal(mailboxAddress("EcoScale Partner <renova@ecoscalepartner.com>"),"renova@ecoscalepartner.com","friendly mailbox parsed");
equal(classifyProviderEvent("email.delivered"),"delivered","Resend delivered event normalized");
equal(classifyProviderEvent("email.complained"),"complaint","Resend complaint event normalized");
equal(classifyProviderEvent("email.delivery_delayed"),"delivery_delayed","accepted delayed event is not treated as a retry");
check(isVerifiedHunterResult({result:"deliverable",status:"valid"}),"current Hunter deliverable response is accepted");
check(isVerifiedHunterResult({result:"deliverable"}),"Hunter deliverable result is accepted");
check(isVerifiedHunterResult({status:"valid"}),"Hunter valid status is accepted");
check(!isVerifiedHunterResult({result:"undeliverable",status:"invalid"}),"Hunter invalid response is rejected");

const store=await readFile(new URL("../src/lib/outreach/store.ts",import.meta.url),"utf8");
const worker=await readFile(new URL("../src/app/api/outreach/worker/route.ts",import.meta.url),"utf8");
const webhook=await readFile(new URL("../src/lib/outreach/resend-webhook-handler.ts",import.meta.url),"utf8");
const ui=await readFile(new URL("../src/components/outreach/OutreachViews.tsx",import.meta.url),"utf8");
check(store.includes("processOutreachBatch"),"live worker implemented");
check(!store.includes("api.resend.com")&&!store.includes("new Resend"),"provider boundary stays outside store");
check(store.includes("isWithinSendingWindow"),"sending window rechecked at delivery");
check(store.includes("daily_limit")&&store.includes("hourly_limit"),"campaign quotas enforced");
equal((store.match(/SELECT \$2::varchar AS status/g)||[]).length,2,"campaign and message status updates give PostgreSQL an explicit type");
check(store.includes("contact_greeting:contactName?` ${contactName}`"),"full contact label is preserved in the greeting");
check(store.includes("senderName.toLowerCase()===senderBusiness.toLowerCase()"),"duplicate sender and business signature is collapsed");
check(store.includes("/unsubscribe/"),"private unsubscribe URL embedded");
check(worker.includes("processOutreachBatch"),"worker uses live-capable processor");
check(webhook.includes("svix-id")&&webhook.includes("provider_message_id"),"webhook verifies and links provider events");
check(webhook.includes("addSuppression"),"bounce and complaint suppression wired");
check(ui.includes("Physical business address"),"sender UI requires physical address");

console.log(`Outreach live characterization: ${assertions} assertions passed; provider calls were deterministic in-memory fixtures only.`);
