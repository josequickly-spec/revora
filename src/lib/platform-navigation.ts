export type PlatformNavItem = {
  label: string;
  href: string;
  group: "command" | "intelligence" | "revenue" | "operations" | "platform";
  icon: "overview" | "executive" | "leads" | "intelligence" | "audits" | "funnelBuilder" | "opportunities" | "consultant" | "proposals" | "outreach" | "crm" | "accounts" | "tasks" | "security" | "billing" | "workflows" | "analytics" | "settings";
  description: string;
};

export const platformNavigation: PlatformNavItem[] = [
  { label: "Command Center", href: "/", group: "command", icon: "overview", description: "Live workspace health, priorities and recent activity" },
  { label: "Executive", href: "/executive", group: "command", icon: "executive", description: "Executive performance, forecasts and operating signals" },
  { label: "AI Advisors", href: "/executive/advisors", group: "command", icon: "consultant", description: "Evidence-grounded executive recommendations" },
  { label: "Leads", href: "/leads", group: "intelligence", icon: "leads", description: "Find and qualify businesses" },
  { label: "Businesses", href: "/businesses", group: "intelligence", icon: "intelligence", description: "Business and contact intelligence" },
  { label: "Audits", href: "/audits", group: "intelligence", icon: "audits", description: "Funnel analysis and evidence" },
  { label: "Opportunities", href: "/opportunities", group: "intelligence", icon: "opportunities", description: "Evidence-backed commercial opportunities" },
  { label: "AI Consultant", href: "/consultant", group: "intelligence", icon: "consultant", description: "Turn verified findings into a reviewed strategy" },
  { label: "FunnelSpy", href: "/funnelspy", group: "intelligence", icon: "funnelBuilder", description: "Audit the current customer journey" },
  { label: "OTOM Studio", href: "/otom", group: "intelligence", icon: "consultant", description: "Build and present the revenue journey" },
  { label: "AI Web Builder", href: "/web-builder", group: "intelligence", icon: "funnelBuilder", description: "Create a brand-preserving interactive website preview" },
  { label: "Proposals", href: "/proposals", group: "revenue", icon: "proposals", description: "Commercial proposals and revenue share" },
  { label: "Outreach", href: "/outreach", group: "revenue", icon: "outreach", description: "Message drafts and delivery state" },
  { label: "Senders", href: "/outreach/senders", group: "revenue", icon: "outreach", description: "Verified sending identities and providers" },
  { label: "Templates", href: "/outreach/templates", group: "revenue", icon: "outreach", description: "Review-required outreach templates" },
  { label: "Suppressions", href: "/outreach/suppressions", group: "revenue", icon: "security", description: "Unsubscribes, bounces and delivery exclusions" },
  { label: "CRM", href: "/crm", group: "revenue", icon: "crm", description: "Pipeline, campaigns and activity" },
  { label: "Accounts", href: "/accounts", group: "revenue", icon: "accounts", description: "Organizations and commercial relationships" },
  { label: "Tasks", href: "/tasks", group: "operations", icon: "tasks", description: "Follow-ups, approvals and due work" },
  { label: "Workflows", href: "/workflows", group: "operations", icon: "workflows", description: "Controlled automation and scheduled jobs" },
  { label: "Sales Analytics", href: "/analytics/sales", group: "operations", icon: "executive", description: "Pipeline and sales performance" },
  { label: "Marketing Analytics", href: "/analytics/marketing", group: "operations", icon: "analytics", description: "Campaign and acquisition signals" },
  { label: "Operations Analytics", href: "/analytics/operations", group: "operations", icon: "workflows", description: "Operational throughput and reliability" },
  { label: "Security", href: "/security", group: "platform", icon: "security", description: "Sessions, MFA and API keys" },
  { label: "Security Analytics", href: "/analytics/security", group: "platform", icon: "security", description: "Security events and operating posture" },
  { label: "Integrations", href: "/settings/integrations", group: "platform", icon: "settings", description: "External services and provider readiness" },
  { label: "Settings", href: "/settings", group: "platform", icon: "settings", description: "Integrations and platform configuration" },
  { label: "API Docs", href: "/docs/api", group: "platform", icon: "settings", description: "Local API reference and contracts" },
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
