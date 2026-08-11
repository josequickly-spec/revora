import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";

export default function ModuleState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <section className="rounded-3xl border border-dashed border-white/15 bg-white/[.025] px-6 py-12 text-center">
      <Construction className="mx-auto size-7 text-amber-300" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
      {action && (
        <Link href={action.href} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 py-2.5 text-sm font-bold text-white outline-none hover:bg-white/[.1] focus-visible:ring-2 focus-visible:ring-cyan-300">
          {action.label}<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
