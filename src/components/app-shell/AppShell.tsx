"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FileText,
  Gauge,
  Lightbulb,
  Mail,
  Menu,
  Bot,
  Search,
  Settings,
  ShieldCheck,
  Users,
  ListTodo,
  Workflow,
  CreditCard,
  Sparkles,
  X,
} from "lucide-react";
import {
  getPlatformBreadcrumbs,
  isPlatformRouteActive,
  platformNavigation,
  type PlatformNavItem,
} from "@/lib/platform-navigation";

const icons: Record<PlatformNavItem["icon"], typeof Gauge> = {
  overview: Gauge,
  leads: Search,
  intelligence: Building2,
  audits: BarChart3,
  opportunities: Lightbulb,
  consultant: Bot,
  proposals: FileText,
  outreach: Mail,
  crm: BriefcaseBusiness,
  accounts: Users,
  tasks: ListTodo,
  workflows: Workflow,
  security: ShieldCheck,
  billing: CreditCard,
  executive: BarChart3,
  settings: Settings,
};

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {platformNavigation.map((item) => {
        const Icon = icons[item.icon];
        const active = isPlatformRouteActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${
              active
                ? "bg-cyan-300 text-slate-950 shadow-[0_8px_30px_rgba(103,232,249,.16)]"
                : "text-slate-400 hover:bg-white/[.06] hover:text-white"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 via-violet-400 to-fuchsia-400 text-slate-950 shadow-lg shadow-violet-950/40">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <span>
        <strong className="block text-base font-black tracking-tight text-white">Revora</strong>
        <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-cyan-300">Lead Intelligence</span>
      </span>
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumbs = getPlatformBreadcrumbs(pathname);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-lg bg-cyan-300 px-4 py-2 font-bold text-slate-950 transition focus:translate-y-0"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[.07] bg-[#090e19] lg:flex lg:flex-col">
        <div className="border-b border-white/[.07] px-5 py-5"><Brand /></div>
        <div className="flex-1 overflow-y-auto px-3 py-5"><Navigation /></div>
        <div className="m-3 rounded-2xl border border-violet-400/15 bg-violet-400/[.06] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-violet-200">
            <ShieldCheck className="size-4" aria-hidden="true" /> Baseline protected
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Existing tools remain available while modules are consolidated.</p>
          <Link href="/legacy" className="mt-3 inline-flex text-xs font-bold text-cyan-300 outline-none hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300">
            Open legacy workspace
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="relative flex h-full w-[min(20rem,88vw)] flex-col border-r border-white/10 bg-[#090e19] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-5">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-400 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5"><Navigation onNavigate={() => setMobileOpen(false)} /></div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#070b14]/90 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-300 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-300 lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs text-slate-500 sm:flex">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.href} className="flex min-w-0 items-center gap-1.5">
                    {index > 0 && <ChevronRight className="size-3 shrink-0" aria-hidden="true" />}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="truncate font-semibold text-slate-300" aria-current="page">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="truncate outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300">{crumb.label}</Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <Link href="/funnelspy" className="rounded-xl border border-violet-400/25 bg-violet-400/[.08] px-3 py-2 text-xs font-bold text-violet-200 outline-none hover:bg-violet-400/[.14] focus-visible:ring-2 focus-visible:ring-violet-300">
              New audit
            </Link>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
