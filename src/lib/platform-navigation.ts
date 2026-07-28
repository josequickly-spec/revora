export type PlatformNavItem = {
  label: string;
  href: string;
  icon: "overview" | "leads" | "intelligence" | "audits" | "opportunities" | "proposals" | "outreach" | "crm" | "settings";
  description: string;
};

export const platformNavigation: PlatformNavItem[] = [
  { label: "Overview", href: "/", icon: "overview", description: "Workspace health and recent activity" },
  { label: "Leads", href: "/leads", icon: "leads", description: "Find and qualify businesses" },
  { label: "Intelligence", href: "/businesses", icon: "intelligence", description: "Business and contact intelligence" },
  { label: "Audits", href: "/audits", icon: "audits", description: "Funnel analysis and evidence" },
  { label: "Opportunities", href: "/opportunities", icon: "opportunities", description: "Prioritized conversion opportunities" },
  { label: "Proposals", href: "/proposals", icon: "proposals", description: "Commercial proposals and revenue share" },
  { label: "Outreach", href: "/outreach", icon: "outreach", description: "Message drafts and delivery state" },
  { label: "CRM", href: "/crm", icon: "crm", description: "Pipeline, campaigns and activity" },
  { label: "Settings", href: "/settings", icon: "settings", description: "Integrations and platform configuration" },
];

export function isPlatformRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPlatformBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Overview", href: "/" }];
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
