"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

interface QuickAccessButtonProps {
  variant?: "leads" | "funnel" | "competitor" | "business" | "contacts" | "proposal";
}

export function ScrapingQuickAccessButton({ variant = "leads" }: QuickAccessButtonProps) {
  const configs = {
    leads: {
      icon: "🔍",
      label: "Discover with Scraping",
      description: "Find businesses from web directories",
      href: "/scraping?tab=discovery",
      color: "cyan",
    },
    funnel: {
      icon: "👁️",
      label: "Deep Funnel Analysis",
      description: "Analyze competitor landing pages",
      href: "/scraping?tab=funnel",
      color: "violet",
    },
    competitor: {
      icon: "👥",
      label: "Monitor Competitors",
      description: "Track pricing and strategies",
      href: "/scraping?tab=competitor",
      color: "orange",
    },
    business: {
      icon: "💾",
      label: "Enrich Business Data",
      description: "Add company details from web",
      href: "/scraping?tab=enrichment",
      color: "emerald",
    },
    contacts: {
      icon: "👤",
      label: "Extract Contacts",
      description: "Find decision-makers automatically",
      href: "/scraping?tab=contacts",
      color: "pink",
    },
    proposal: {
      icon: "📝",
      label: "Personalize with AI",
      description: "Generate proposals from web data",
      href: "/scraping?tab=proposal",
      color: "lime",
    },
  };

  const config = configs[variant];

  const colorClasses = {
    cyan: "border-cyan-300/20 bg-cyan-300/[.07] text-cyan-200 hover:bg-cyan-300/[.12]",
    violet: "border-violet-300/20 bg-violet-300/[.07] text-violet-200 hover:bg-violet-300/[.12]",
    orange: "border-orange-300/20 bg-orange-300/[.07] text-orange-200 hover:bg-orange-300/[.12]",
    emerald: "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-200 hover:bg-emerald-300/[.12]",
    pink: "border-pink-300/20 bg-pink-300/[.07] text-pink-200 hover:bg-pink-300/[.12]",
    lime: "border-lime-300/20 bg-lime-300/[.07] text-lime-200 hover:bg-lime-300/[.12]",
  } as const;

  return (
    <Link
      href={config.href}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition ${colorClasses[config.color as keyof typeof colorClasses]}`}
    >
      <span className="text-2xl">{config.icon}</span>
      <div>
        <p className="font-bold">{config.label}</p>
        <p className="text-xs opacity-75">{config.description}</p>
      </div>
      <Zap className="ml-auto size-4 opacity-50" />
    </Link>
  );
}

// Inline button variant
export function ScrapingQuickButton({
  variant = "leads",
  className = "",
}: QuickAccessButtonProps & { className?: string }) {
  const configs = {
    leads: { label: "🔍 Scrape Businesses", href: "/scraping?tab=discovery", color: "bg-cyan-300" },
    funnel: { label: "👁️ Deep Analyze", href: "/scraping?tab=funnel", color: "bg-violet-400" },
    competitor: { label: "👥 Monitor Competitors", href: "/scraping?tab=competitor", color: "bg-orange-400" },
    business: { label: "💾 Enrich Data", href: "/scraping?tab=enrichment", color: "bg-emerald-400" },
    contacts: { label: "👤 Extract Contacts", href: "/scraping?tab=contacts", color: "bg-pink-400" },
    proposal: { label: "📝 AI Personalize", href: "/scraping?tab=proposal", color: "bg-lime-400" },
  };

  const config = configs[variant];

  return (
    <Link
      href={config.href}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-950 transition hover:opacity-90 ${config.color} ${className}`}
    >
      {config.label}
    </Link>
  );
}

// Section card for scraping features
export function ScrapingFeatureCard({
  icon,
  title,
  description,
  variant = "leads",
}: {
  icon: string;
  title: string;
  description: string;
  variant?: QuickAccessButtonProps["variant"];
}) {
  const configs = {
    leads: { href: "/scraping?tab=discovery", color: "cyan" },
    funnel: { href: "/scraping?tab=funnel", color: "violet" },
    competitor: { href: "/scraping?tab=competitor", color: "orange" },
    business: { href: "/scraping?tab=enrichment", color: "emerald" },
    contacts: { href: "/scraping?tab=contacts", color: "pink" },
    proposal: { href: "/scraping?tab=proposal", color: "lime" },
  } as const;

  const config = configs[variant as keyof typeof configs];

  const borderClasses = {
    cyan: "border-cyan-300/20 hover:border-cyan-300/40",
    violet: "border-violet-300/20 hover:border-violet-300/40",
    orange: "border-orange-300/20 hover:border-orange-300/40",
    emerald: "border-emerald-300/20 hover:border-emerald-300/40",
    pink: "border-pink-300/20 hover:border-pink-300/40",
    lime: "border-lime-300/20 hover:border-lime-300/40",
  } as const;

  return (
    <Link
      href={config.href}
      className={`group rounded-2xl border p-6 transition hover:bg-white/[.035] ${borderClasses[config.color as keyof typeof borderClasses]}`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-4">{description}</p>
      <p className="text-xs font-bold text-slate-500 group-hover:text-slate-400 transition">
        Open Scraping →
      </p>
    </Link>
  );
}
