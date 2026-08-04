export type PlatformNavItem = {
  label: string;
  href: string;
  group: "command" | "intelligence" | "revenue" | "operations" | "platform";
  icon: "overview" | "executive" | "leads" | "intelligence" | "audits" | "funnelBuilder" | "opportunities" | "consultant" | "proposals" | "outreach" | "crm" | "accounts" | "tasks" | "security" | "billing" | "workflows" | "settings";
  description: string;
};

export const platformNavigation: PlatformNavItem[] = [
  { label: "Command Center", href: "/", group: "command", icon: "overview", description: "Live workspace health, priorities and recent activity" },
  { label: "Leads", href: "/leads", group: "intelligence", icon: "leads", description: "Find and qualify businesses" },
  { label: "Businesses", href: "/businesses", group: "intelligence", icon: "intelligence", description: "Business and contact intelligence" },
  { label: "Audits", href: "/audits", group: "intelligence", icon: "audits", description: "Funnel analysis and evidence" },
  { label: "FunnelSpy", href: "/funnelspy", group: "intelligence", icon: "funnelBuilder", description: "Audit the current customer journey" },
  { label: "OTOM Studio", href: "/otom", group: "intelligence", icon: "consultant", description: "Build and present the revenue journey" },
  { label: "AI Web Builder", href: "/web-builder", group: "intelligence", icon: "funnelBuilder", description: "Create a brand-preserving interactive website preview" },
  { label: "Proposals", href: "/proposals", group: "revenue", icon: "proposals", description: "Commercial proposals and revenue share" },
  { label: "Outreach", href: "/outreach", group: "revenue", icon: "outreach", description: "Message drafts and delivery state" },
  { label: "CRM", href: "/crm", group: "revenue", icon: "crm", description: "Pipeline, campaigns and activity" },
  { label: "Security", href: "/security", group: "platform", icon: "security", description: "Sessions, MFA and API keys" },
  { label: "Settings", href: "/settings", group: "platform", icon: "settings", description: "Integrations and platform configuration" },
];

export function isPlatformRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPlatformBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", href: "/" }];
  let href = "";

  for (const part of parts) {
    href += `/${part}`;
    const nav = platformNavigation.find((item) => item.href === href);
    crumbs.push({
      label: nav?.label || (/^\d+$/.test(part) ? `#${part}` : part.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())),
      href,
    });
  }

  return crumbs;
}
