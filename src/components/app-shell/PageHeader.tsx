import Link from "next/link";
import type { ReactNode } from "react";

type PageAction = {
  label: string;
  href: string;
  tone?: "primary" | "secondary";
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions = [],
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: PageAction[];
  children?: ReactNode;
}) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/[.07] bg-gradient-to-br from-white/[.055] via-white/[.025] to-orange-400/[.035] p-6 shadow-[0_24px_80px_rgba(0,0,0,.18)] sm:p-8 md:flex md:items-end md:justify-between md:gap-8">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-orange-300/[.08]" />
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="mb-3 break-words text-[10px] font-black uppercase tracking-[.2em] text-orange-300 sm:text-xs">{eyebrow}</p>}
        <h1 className="text-balance break-words text-3xl font-black leading-[1.05] tracking-[-.035em] text-white sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
        {children}
      </div>
      {actions.length > 0 && (
        <div className="relative mt-6 flex w-full flex-wrap gap-2 md:mt-0 md:w-auto md:justify-end">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 sm:flex-none ${
                action.tone === "secondary"
                  ? "border border-white/10 bg-white/[.045] text-slate-200 hover:border-white/20 hover:bg-white/[.08]"
                  : "bg-orange-400 text-slate-950 shadow-lg shadow-orange-950/20 hover:bg-orange-300"
              }`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
