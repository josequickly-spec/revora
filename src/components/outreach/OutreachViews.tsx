"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";
import { outreachTemplates } from "@/lib/outreach/template";

type Sender = {
  id:string;
  display_name:string;
  from_email:string;
  business_name:string;
  domain:string;
  verification_status:string;
  provider_connection_id:string;
  provider:string;
  provider_label:string;
  provider_status:string;
};
type Provider = {
  id:string;
  provider:string;
  display_label:string;
  verification_status:string;
};
type SenderData = {
  senders?:Sender[];
  providers?:Provider[];
  configuredFromEmail?:string|null;
};

function Card({children}:{children:React.ReactNode}) {
  return <section className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5">{children}</section>;
}

export function CampaignListView() {
  const [campaigns,setCampaigns]=useState<Array<{id:string;name:string;status:string;businessId:number;version:number}>>([]);
  const [mode,setMode]=useState("checking");
  useEffect(()=>{
    Promise.all([
      fetch("/api/outreach/campaigns").then(response=>response.json()),
      fetch("/api/outreach/sender-identities").then(response=>response.json()),
    ]).then(([campaignData,senderData])=>{
      setCampaigns(campaignData.campaigns||[]);
      setMode(senderData.mode||"dry-run");
    });
  },[]);
  return <div className="space-y-4">
    <Card>
      <p className="text-sm text-amber-100">
        <ShieldCheck className="mr-2 inline size-4"/>
        Campaigns require explicit review, approval and scheduling. Compliance safeguards do not guarantee legal compliance.
      </p>
      <p className="mt-2 text-xs text-slate-400">Delivery mode: {mode==="live_available"?"Resend available; sender verification still required.":"Dry-run only until a verified Resend sender is configured."}</p>
    </Card>
    {campaigns.length?<div className="grid gap-4 lg:grid-cols-2">{campaigns.map(campaign=>
      <Link href={`/outreach/campaigns/${campaign.id}`} key={campaign.id} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5">
        <div className="flex justify-between"><strong>{campaign.name}</strong><span className="text-cyan-300">{campaign.status}</span></div>
        <p className="mt-2 text-xs text-slate-500">Business #{campaign.businessId} · version {campaign.version}</p>
      </Link>
    )}</div>:<Card><p className="text-slate-400">No campaigns exist. Nothing is created automatically.</p></Card>}
  </div>;
}

export function NewCampaignView({businessId,proposalId}:{businessId?:number;proposalId?:string}) {
  const [businesses,setBusinesses]=useState<Array<{id:number;name:string}>>([]);
  const [senders,setSenders]=useState<Sender[]>([]);
  const [business,setBusiness]=useState(businessId||0);
  const [senderId,setSenderId]=useState("");
  const [name,setName]=useState("");
  const [objective,setObjective]=useState("Share a reviewed business observation");
  const [timezone,setTimezone]=useState("");
  const [error,setError]=useState("");
  useEffect(()=>{
    Promise.all([
      fetch("/api/businesses").then(response=>response.json()),
      fetch("/api/outreach/sender-identities").then(response=>response.json()),
    ]).then(([businessData,senderData])=>{
      setBusinesses(businessData.businesses||[]);
      setSenders(senderData.senders||[]);
      const preferred=(senderData.senders||[]).find((sender:Sender)=>sender.verification_status==="provider_verified")||(senderData.senders||[])[0];
      setSenderId(preferred?.id||"");
    });
  },[]);
  async function create() {
    setError("");
    const sender=senders.find(item=>item.id===senderId);
    const response=await fetch("/api/outreach/campaigns",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        name,businessId:business,proposalId:proposalId||undefined,objective,
        senderIdentityId:sender?.id,providerConnectionId:sender?.provider_connection_id,
        timezone,sendingWindow:{weekdays:[1,2,3,4,5],startHour:9,endHour:17},dailyLimit:25,hourlyLimit:10,
      }),
    });
    const data=await response.json();
    if(!response.ok) {
      setError(data.error);
      return;
    }
    location.assign(`/outreach/campaigns/${data.campaign.id}`);
  }
  const selected=senders.find(item=>item.id===senderId);
  return <div className="space-y-4">
    <Card><h2 className="font-black">Explicit campaign draft</h2><p className="mt-2 text-sm text-slate-400">Creating this record does not approve, schedule or send anything.</p></Card>
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <label>Campaign name<input value={name} onChange={event=>setName(event.target.value)} className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
        <label>Business<select value={business} onChange={event=>setBusiness(Number(event.target.value))} className="mt-2 w-full rounded-xl bg-[#0c1220] p-3"><option value={0}>Select business</option>{businesses.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Timezone<input value={timezone} onChange={event=>setTimezone(event.target.value)} placeholder="America/New_York" className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
        <label>Sender<select value={senderId} onChange={event=>setSenderId(event.target.value)} className="mt-2 w-full rounded-xl bg-[#0c1220] p-3"><option value="">Select sender</option>{senders.map(sender=><option value={sender.id} key={sender.id}>{sender.display_name} · {sender.provider_label} · {sender.verification_status}</option>)}</select></label>
      </div>
      {selected&&<p className="mt-3 text-xs text-slate-400">Provider: {selected.provider} · domain: {selected.domain} · status: {selected.verification_status}</p>}
      <label className="mt-4 block">Objective<textarea value={objective} onChange={event=>setObjective(event.target.value)} className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
      {proposalId&&<p className="mt-3 text-xs text-violet-200">Published proposal preselected. It will be validated server-side.</p>}
    </Card>
    {error&&<Card><p className="text-rose-200">{error}</p></Card>}
    <button disabled={!business||!name||!timezone||!selected} onClick={create} className="w-full rounded-xl bg-cyan-300 p-3 font-black text-slate-950 disabled:opacity-40"><FilePlus2 className="mr-2 inline size-5"/>Create Campaign Draft</button>
  </div>;
}

type CampaignDetail = {
  id:string;name:string;status:string;version:number;businessId:number;
  providerName:string|null;providerStatus:string|null;senderStatus:string|null;
  recipients:Array<Record<string,unknown>>;
  steps:Array<Record<string,unknown>>;
  messages:Array<Record<string,unknown>>;
  events:Array<{event_type:string;created_at:string}>;
};

export function CampaignDetailView({id}:{id:string}) {
  const [campaign,setCampaign]=useState<CampaignDetail|null>(null);
  const [contacts,setContacts]=useState<Array<{id:number;businessId:number;name:string;role:string;status:string}>>([]);
  const [contactId,setContactId]=useState(0);
  const [templateId,setTemplateId]=useState("simple-introduction");
  const [message,setMessage]=useState("");
  const [busyAction,setBusyAction]=useState("");
  const load=useCallback(()=>fetch(`/api/outreach/campaigns/${id}`).then(async response=>{
    const data=await response.json();
    if(!response.ok||!data.campaign)throw new Error(data.error||"Campaign could not be loaded.");
    setCampaign(data.campaign);
  }),[id]);
  useEffect(()=>{load();fetch("/api/contacts").then(response=>response.json()).then(data=>setContacts(data.contacts||[]));},[load]);
  function actionError(value:unknown) {
    const code=String(value||"");
    if(code.includes("duplicate")||code.includes("unique"))return "This contact or sequence position is already present.";
    if(code.includes("maximum_five_steps"))return "This campaign already has the maximum of five sequence steps.";
    if(code.includes("campaign_not_editable"))return "This campaign is no longer editable. Return it to draft before changing recipients or steps.";
    if(code.includes("suppressed"))return "This contact is suppressed and cannot be added to the campaign.";
    if(code.includes("sender")||code.includes("provider"))return "Configure and verify a sender before completing compliance review.";
    if(code.includes("recipient")||code.includes("contact"))return "Select a valid associated contact that has not already been added.";
    return code||"The action could not be completed.";
  }
  async function action(path:string,body:Record<string,unknown>={},successMessage="Action completed.") {
    if(!campaign) return;
    setBusyAction(path);setMessage("");
    try{
      const versioned=!['recipients','sequence'].includes(path);
      const response=await fetch(`/api/outreach/campaigns/${id}/${path}`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...body,...(versioned?{expectedVersion:campaign.version}:{})}),
      });
      const data=await response.json();
      if(!response.ok)throw new Error(actionError(data.error));
      setMessage(successMessage);
      setContactId(0);
      await load();
    }catch(error){setMessage(actionError(error instanceof Error?error.message:error));}
    finally{setBusyAction("");}
  }
  async function addRecipient() {
    if(!contactId){setMessage("Select an available associated contact first.");return;}
    await action("recipients",{contactId,provenance:"existing_repository_data",verificationStatus:"syntax_valid",verificationSource:"existing repository contact",verificationDate:new Date().toISOString(),riskyApproved:false},"Contact added and validated for this campaign.");
  }
  async function addStep() {
    if(!campaign) return;
    const template=outreachTemplates.find(item=>item.id===templateId)!;
    await action("sequence",{position:campaign.steps.length+1,delayValue:campaign.steps.length?2:0,delayUnit:"day",subjectTemplate:template.subject,bodyTemplate:template.body,messageType:template.messageType,requiresManualReview:true,enabled:true},`Step ${campaign.steps.length+1} added for manual review.`);
  }
  if(!campaign) return <Card>Loading campaign…</Card>;
  const existingContactIds=new Set(campaign.recipients.map(recipient=>Number(recipient.contact_id??recipient.contactId)));
  const eligibleContacts=contacts.filter(contact=>Number(contact.businessId)===campaign.businessId&&!existingContactIds.has(contact.id));
  const live=campaign.providerName==="resend"&&campaign.providerStatus==="verified"&&campaign.senderStatus==="provider_verified";
  return <div className="space-y-4">
    <Card>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className={`text-xs ${live?"text-emerald-300":"text-amber-300"}`}>{live?"RESEND LIVE · EXPLICIT SCHEDULING REQUIRED":"NO LIVE DELIVERY · CONFIGURATION INCOMPLETE"}</p>
          <h2 className="mt-2 text-xl font-black">{campaign.name}</h2>
        </div>
        <div className="text-right"><strong className="text-violet-200">{campaign.status}</strong><p className="text-xs text-slate-500">version {campaign.version}</p></div>
      </div>
    </Card>
    {message&&<Card><p role="status" className="text-amber-100">{message}</p></Card>}
    <div className="grid gap-4 md:grid-cols-3"><Card><strong>Recipients</strong><p className="mt-2 text-3xl">{campaign.recipients.length}</p></Card><Card><strong>Sequence steps</strong><p className="mt-2 text-3xl">{campaign.steps.length}</p></Card><Card><strong>Messages</strong><p className="mt-2 text-3xl">{campaign.messages.length}</p></Card></div>
    {campaign.status==="draft"&&<div className="grid gap-4 lg:grid-cols-2">
      <Card><h3 className="font-black">Add verified contact candidate</h3>{eligibleContacts.length?<><select value={contactId} onChange={event=>setContactId(Number(event.target.value))} className="mt-3 w-full rounded-xl bg-[#0c1220] p-3"><option value={0}>Select associated contact</option>{eligibleContacts.map(contact=><option value={contact.id} key={contact.id}>{contact.name} · {contact.role} · {contact.status}</option>)}</select><button disabled={!contactId||Boolean(busyAction)} onClick={addRecipient} className="mt-3 rounded-xl border border-cyan-300/20 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40">{busyAction==="recipients"?"Validating…":"Add recipient"}</button></>:<p className="mt-3 rounded-xl bg-emerald-400/[.07] p-3 text-sm text-emerald-200">All associated contacts are already added. Add another contact from the business profile if needed.</p>}<p className="mt-2 text-xs text-slate-500">Association, syntax, provenance and suppression are validated by the server.</p></Card>
      <Card><h3 className="font-black">Add reviewed sequence step</h3><select value={templateId} onChange={event=>setTemplateId(event.target.value)} disabled={campaign.steps.length>=5||Boolean(busyAction)} className="mt-3 w-full rounded-xl bg-[#0c1220] p-3 disabled:opacity-40">{outreachTemplates.map(template=><option value={template.id} key={template.id}>{template.name}</option>)}</select><button disabled={campaign.steps.length>=5||Boolean(busyAction)} onClick={addStep} className="mt-3 rounded-xl border border-violet-300/20 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40">{busyAction==="sequence"?"Adding…":campaign.steps.length>=5?"Five-step limit reached":"Add template step"}</button><p className="mt-2 text-xs text-slate-500">{campaign.steps.length}/5 steps configured. Every step requires manual review.</p></Card>
    </div>}
    <Card><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">Compliance review</h3><p className="mt-1 text-xs text-slate-500">This validates readiness; it never sends or schedules messages.</p></div>{campaign.status==="draft"&&<button disabled={!campaign.recipients.length||!campaign.steps.length||Boolean(busyAction)} onClick={()=>action("review",{},"Compliance review completed. Campaign now requires explicit approval.")} className="rounded-xl border border-cyan-300/20 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">{busyAction==="review"?"Reviewing…":"Run compliance review"}</button>}</div><ul className="mt-3 space-y-1 text-sm text-slate-400"><li>{campaign.recipients.length?"✓":"○"} At least one validated recipient</li><li>{campaign.steps.length?"✓":"○"} Reviewed sequence step configured</li><li>{live?"✓":"○"} Provider-verified sender {live?"ready":"still required for live delivery"}</li><li>✓ Suppression is checked before scheduling and delivery</li><li>✓ Approval and scheduling remain separate actions</li></ul></Card>
    {!live&&<Card><p className="text-amber-200"><AlertTriangle className="mr-2 inline size-4"/>Create a provider-verified sender identity before reviewing a live campaign.</p></Card>}
    <div className="flex flex-wrap gap-2">
      {campaign.status==="review_required"&&<button disabled={Boolean(busyAction)} onClick={()=>action("approve",{},"Campaign approved explicitly. It is not scheduled yet.")} className="rounded-xl border border-emerald-300/20 px-4 py-2 disabled:opacity-40"><CheckCircle2 className="mr-2 inline size-4"/>Approve explicitly</button>}
      {campaign.status==="approved"&&<button disabled={Boolean(busyAction)} onClick={()=>action("schedule",{startAt:new Date(Date.now()+86_400_000).toISOString()},"Campaign scheduled explicitly.")} className="rounded-xl border border-violet-300/20 px-4 py-2 disabled:opacity-40"><Clock3 className="mr-2 inline size-4"/>Schedule explicitly</button>}
      {["running","paused"].includes(campaign.status)&&<button disabled={Boolean(busyAction)} onClick={()=>action(campaign.status==="paused"?"resume":"pause",{},campaign.status==="paused"?"Campaign resumed.":"Campaign paused.")} className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40">{campaign.status==="paused"?<Play className="mr-2 inline size-4"/>:<Pause className="mr-2 inline size-4"/>}{campaign.status==="paused"?"Resume":"Pause"}</button>}
    </div>
    <Card><h3 className="font-black">Events</h3><ul className="mt-3 space-y-2 text-sm text-slate-400">{campaign.events.map((event,index)=><li key={`${event.created_at}-${index}`}>{event.event_type} · {new Date(event.created_at).toLocaleString()}</li>)}</ul></Card>
  </div>;
}

export function TemplatesView() {
  const templates=["Simple Introduction","Audit Insight","Proposal Delivery","Value Follow-Up","Final Follow-Up"];
  return <div className="grid gap-4 md:grid-cols-2">{templates.map(template=><Card key={template}><h2 className="font-black">{template}</h2><p className="mt-2 text-sm text-slate-400">Deterministic, review-required and includes unsubscribe plus sender-address controls.</p></Card>)}</div>;
}

export function SuppressionsView() {
  const [suppressions,setSuppressions]=useState<Array<{id:string;suppression_type:string;scope:string;source:string}>>([]);
  useEffect(()=>{fetch("/api/outreach/suppressions").then(response=>response.json()).then(data=>setSuppressions(data.suppressions||[]));},[]);
  return <Card><h2 className="font-black">Suppression records</h2><p className="mt-2 text-sm text-slate-500">Addresses are intentionally omitted from this list view.</p><ul className="mt-4 space-y-2">{suppressions.map(item=><li key={item.id} className="rounded-xl bg-black/20 p-3 text-sm">{item.suppression_type} · {item.scope} · {item.source}</li>)}</ul></Card>;
}

export function SendersView() {
  const [senders,setSenders]=useState<Sender[]>([]);
  const [providers,setProviders]=useState<Provider[]>([]);
  const [form,setForm]=useState({displayName:"EcoScale Partner",fromEmail:"",replyTo:"",businessName:"EcoScale Partner",physicalAddress:"",domain:"",providerConnectionId:""});
  const [message,setMessage]=useState("");
  const applySenderData=useCallback((data:SenderData)=>{
    setSenders(data.senders||[]);
    setProviders(data.providers||[]);
    const resend=(data.providers||[]).find((provider:Provider)=>provider.provider==="resend");
    const email=data.configuredFromEmail||"";
    setForm(current=>({
      ...current,
      fromEmail:current.fromEmail||email,
      replyTo:current.replyTo||email,
      domain:current.domain||email.split("@")[1]||"",
      providerConnectionId:current.providerConnectionId||resend?.id||"",
    }));
  },[]);
  const load=useCallback(async()=>{
    const data=await fetch("/api/outreach/sender-identities").then(response=>response.json()) as SenderData;
    applySenderData(data);
  },[applySenderData]);
  useEffect(()=>{
    fetch("/api/outreach/sender-identities")
      .then(response=>response.json() as Promise<SenderData>)
      .then(applySenderData);
  },[applySenderData]);
  async function create() {
    setMessage("");
    const response=await fetch("/api/outreach/sender-identities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const data=await response.json();
    setMessage(response.ok?"Verified sender identity created.":data.error||"Sender creation failed.");
    if(response.ok) await load();
  }
  const selectedProvider=providers.find(provider=>provider.id===form.providerConnectionId);
  return <div className="space-y-4">
    <Card>
      <h2 className="font-black">Create a verified sender</h2>
      <p className="mt-2 text-sm text-slate-400">The domain is checked against Resend. A real physical business address is mandatory and is added to every message.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label>Display name<input value={form.displayName} onChange={event=>setForm({...form,displayName:event.target.value})} className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
        <label>Business name<input value={form.businessName} onChange={event=>setForm({...form,businessName:event.target.value})} className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
        <label>From email<input value={form.fromEmail} onChange={event=>setForm({...form,fromEmail:event.target.value})} className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
        <label>Reply-to<input value={form.replyTo} onChange={event=>setForm({...form,replyTo:event.target.value})} className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
        <label>Domain<input value={form.domain} onChange={event=>setForm({...form,domain:event.target.value})} className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
        <label>Provider<select value={form.providerConnectionId} onChange={event=>setForm({...form,providerConnectionId:event.target.value})} className="mt-2 w-full rounded-xl bg-[#0c1220] p-3"><option value="">Select provider</option>{providers.map(provider=><option value={provider.id} key={provider.id}>{provider.display_label} · {provider.verification_status}</option>)}</select></label>
      </div>
      <label className="mt-3 block">Physical business address<textarea value={form.physicalAddress} onChange={event=>setForm({...form,physicalAddress:event.target.value})} placeholder="Street, city, state, postal code, country" className="mt-2 w-full rounded-xl bg-black/20 p-3"/></label>
      <button disabled={!form.displayName||!form.fromEmail||!form.replyTo||!form.domain||!form.physicalAddress||!form.providerConnectionId||selectedProvider?.verification_status!=="verified"} onClick={create} className="mt-4 rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-40">Verify and save sender</button>
      {message&&<p className="mt-3 text-sm text-amber-100">{message}</p>}
    </Card>
    {senders.map(sender=><Card key={sender.id}><div className="flex justify-between gap-3"><strong>{sender.display_name}</strong><span className={sender.verification_status==="provider_verified"?"text-emerald-300":"text-amber-300"}>{sender.verification_status}</span></div><p className="mt-2 text-sm text-slate-500">{sender.business_name} · {sender.domain} · {sender.provider_label}</p><p className="mt-2 text-xs text-slate-400">{sender.from_email}</p></Card>)}
  </div>;
}

export default function UnsubscribeView({token}:{token:string}) {
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);
  async function submit() {
    setLoading(true);
    await fetch(`/api/public/unsubscribe/${token}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({global:true})});
    setDone(true);
    setLoading(false);
  }
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4 text-slate-900"><section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-2xl font-black">{done?"You have been unsubscribed":"Stop future outreach"}</h1><p className="mt-3 text-slate-600">{done?"Future campaign messages have been cancelled.":"This action removes the address associated with this private link from future outreach."}</p>{!done&&<button onClick={submit} disabled={loading||token.length<40} className="mt-6 w-full rounded-xl bg-slate-900 p-3 font-bold text-white">{loading?"Processing…":"Unsubscribe"}</button>}</section></main>;
}
