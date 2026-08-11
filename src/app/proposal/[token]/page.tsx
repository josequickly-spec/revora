import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProposal } from "@/lib/proposal-builder/store";
import { formatMoney } from "@/lib/proposal-builder/pricing";

export const metadata: Metadata = { title: "Client proposal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = token.length >= 40 ? await getPublicProposal(token) : null;
  if (!proposal) notFound();
  return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800"><article className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-xl sm:p-10">
    <div className="flex flex-wrap justify-between gap-3 border-b pb-6"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Client proposal</p><h1 className="mt-2 text-3xl font-black">{proposal.title}</h1></div><div className="text-right text-sm text-slate-500"><p>Version {proposal.publishedVersion}</p><p>{proposal.publishedAt ? new Date(proposal.publishedAt).toLocaleDateString(proposal.locale) : ""}</p></div></div>
    <section className="py-7"><h2 className="text-xl font-black">Executive summary</h2><p className="mt-3 leading-7 text-slate-600">{proposal.content.executiveSummary}</p></section>
    <section className="border-t py-7"><h2 className="text-xl font-black">Recommended services</h2><div className="mt-4 space-y-4">{proposal.content.recommendedServices.filter(item => item.selected).map(item => <div key={item.id} className="rounded-2xl border p-4"><h3 className="font-bold">{item.name}</h3><p className="mt-2 text-sm text-slate-600">{item.description}</p></div>)}</div></section>
    <section className="grid gap-6 border-t py-7 md:grid-cols-2"><div><h2 className="font-black">Timeline</h2><p className="mt-2 text-slate-600">{proposal.content.timeline}</p></div><div><h2 className="font-black">Investment</h2><p className="mt-2 text-2xl font-black text-violet-700">{formatMoney(proposal.pricing.totalMinor, proposal.currency, proposal.locale)}</p></div></section>
    <section className="grid gap-6 border-t py-7 md:grid-cols-2"><div><h2 className="font-black">Assumptions</h2><ul className="mt-2 space-y-1 text-sm text-slate-600">{proposal.content.assumptions.map(item => <li key={item}>• {item}</li>)}</ul></div><div><h2 className="font-black">Exclusions</h2><ul className="mt-2 space-y-1 text-sm text-slate-600">{proposal.content.exclusions.map(item => <li key={item}>• {item}</li>)}</ul></div></section>
    <section className="border-t pt-7"><h2 className="font-black">Important disclaimers</h2><ul className="mt-2 space-y-1 text-xs text-slate-500">{proposal.content.disclaimers.map(item => <li key={item}>• {item}</li>)}</ul></section>
  </article></main>;
}
