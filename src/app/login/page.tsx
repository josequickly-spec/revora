import AuthForm from "@/components/enterprise/AuthForm";
import { brand } from "@/lib/brand";
import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, Workflow, LockKeyhole } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string | string[] }>;
}) {
  const params = await searchParams;
  const resetToken = typeof params.reset === "string" ? params.reset : "";
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(163,230,53,.09),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,.04),_transparent_45%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 md:grid-cols-[1.05fr_.95fr] md:px-8 lg:px-10">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-orange-200">
            <Sparkles className="size-4" />
            {brand.shortName}
          </div>
          <div className="max-w-2xl space-y-5">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Secure access for the full sales and operations workspace.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Sign in once to manage leads, audits, funnels, outreach, proposals, and every other part of the
              workflow from one place.
            </p>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              {brand.product} for teams that need one consistent place to run the full pipeline.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard icon={<ShieldCheck className="size-5" />} title="Protected sessions" text="Role-aware access with secure cookies and MFA support." />
            <FeatureCard icon={<Workflow className="size-5" />} title="Connected workflow" text="Move from discovery to funnel generation without switching tools." />
            <FeatureCard icon={<LockKeyhole className="size-5" />} title="Audit-friendly" text="Built for real operations and production workflows." />
          </div>

          <div className="max-w-2xl rounded-3xl border border-white/10 bg-white/[.04] p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Revora production access</p>
            <div className="mt-3 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <MiniStat label="Fast access" value="1 session" />
              <MiniStat label="Built for ops" value="Multi-step" />
              <MiniStat label="Language" value="English" />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{brand.tagline}</p>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-b from-cyan-400/10 via-transparent to-orange-500/10 blur-3xl" />
          <div className="mx-auto max-w-xl">
            <div className="mb-4 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-[.2em] text-slate-400">
              <span>Workspace access</span>
              <span className="text-orange-300">Production workspace</span>
            </div>
            <AuthForm initialResetToken={resetToken} />
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur">
      <div className="flex size-10 items-center justify-center rounded-xl bg-orange-400/10 text-orange-200">
        {icon}
      </div>
      <h2 className="mt-4 text-sm font-black text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}
