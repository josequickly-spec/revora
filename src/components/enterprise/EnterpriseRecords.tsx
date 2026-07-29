"use client";
import Link from "next/link";
import { useEffect,useState } from "react";

export default function EnterpriseRecords({endpoint,collection,empty}:{endpoint:string;collection:string;empty:string}){
  const [rows,setRows]=useState<Record<string,unknown>[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{fetch(endpoint,{credentials:"same-origin"}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(response.status===401?"Authentication required.":body.error||"Data unavailable.");const value=body[collection]??body.data??[];setRows(Array.isArray(value)?value:[]);}).catch(reason=>setError(reason instanceof Error?reason.message:"Data unavailable.")).finally(()=>setLoading(false));},[endpoint,collection]);
  if(loading)return <div className="h-52 animate-pulse rounded-3xl bg-white/[.04]" aria-label="Loading enterprise records"/>;
  if(error)return <div role="alert" className="rounded-3xl border border-amber-300/20 bg-amber-300/[.05] p-6 text-sm text-amber-100">{error} {error.includes("Authentication")&&<Link className="ml-2 font-bold text-cyan-300" href="/login">Sign in</Link>}</div>;
  if(!rows.length)return <div role="status" className="rounded-3xl border border-white/[.08] bg-white/[.03] p-8 text-sm text-slate-400">{empty}</div>;
  return <div className="overflow-hidden rounded-3xl border border-white/[.08] bg-white/[.025]"><ul className="divide-y divide-white/[.06]">{rows.map((row,index)=><li key={String(row.id??index)} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto]"><div><strong className="text-sm text-white">{String(row.name??row.title??row.jobType??row.metric??`Record ${index+1}`)}</strong><p className="mt-1 text-xs text-slate-500">{String(row.domain??row.stage??row.status??row.priority??"Recorded")}</p></div><span className="text-xs text-slate-500">{formatDate(row.updatedAt??row.createdAt??row.dueAt)}</span></li>)}</ul></div>;
}
function formatDate(value:unknown){if(!value)return "";const date=new Date(String(value));return Number.isNaN(date.valueOf())?"":date.toLocaleDateString();}
