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
    <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/[.07] pb-7 md:flex-row md:items-end">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="mb-2 break-words text-[11px] font-black uppercase tracking-[.12em] text-cyan-300 sm:text-xs sm:tracking-[.2em]">{eyebrow}</p>}
        <h1 className="text-balance break-words text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
        {children}
      </div>
      {actions.length > 0 && (
        <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 sm:flex-none ${
                action.tone === "secondary"
                  ? "border border-white/10 bg-white/[.04] text-slate-200 hover:bg-white/[.08]"
                  : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
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
