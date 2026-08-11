import { redirect } from "next/navigation";
import { brand } from "@/lib/brand";
import type { ReactNode } from "react";
import { BarChart3, Users, Settings, LogOut, Lock } from "lucide-react";

export const metadata = {
  title: `Admin Dashboard | ${brand.name}`,
};

async function getAdminStatus() {
  // This would verify the admin session
  // For now, just return mock data
  return {
    isAuthenticated: true,
    adminEmail: process.env.ADMIN_EMAIL || "admin@revora.local",
  };
}

export default async function AdminDashboard() {
  const status = await getAdminStatus();

  if (!status.isAuthenticated) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,.1),_transparent_40%)]" />

      <div className="relative">
        {/* Header */}
        <header className="border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-white">
                  Administrator Control Panel
                </h1>
                <p className="text-sm text-slate-400">
                  Manage platform settings and monitor system health
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Logged in as</p>
                <p className="font-mono text-sm font-bold text-cyan-400">
                  {status.adminEmail}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Stats Grid */}
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users className="size-6" />}
              label="Active Users"
              value="—"
              color="blue"
            />
            <StatCard
              icon={<BarChart3 className="size-6" />}
              label="API Requests"
              value="—"
              color="cyan"
            />
            <StatCard
              icon={<Lock className="size-6" />}
              label="Security Score"
              value="98%"
              color="green"
            />
            <StatCard
              icon={<Settings className="size-6" />}
              label="System Status"
              value="Healthy"
              color="emerald"
            />
          </div>

          {/* Admin Actions */}
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Administrative Controls
              </h2>
              <p className="text-sm text-slate-400">
                Manage system-wide settings and operations
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminActionCard
                title="User Management"
                description="Create, edit, and manage user accounts and permissions"
                icon={<Users className="size-5" />}
                href="#"
              />
              <AdminActionCard
                title="System Settings"
                description="Configure platform behavior and security policies"
                icon={<Settings className="size-5" />}
                href="#"
              />
              <AdminActionCard
                title="Security Audit"
                description="Review access logs and security events"
                icon={<Lock className="size-5" />}
                href="#"
              />
              <AdminActionCard
                title="API Management"
                description="Monitor API usage and manage integrations"
                icon={<BarChart3 className="size-5" />}
                href="#"
              />
              <AdminActionCard
                title="Database Status"
                description="Check database health and perform maintenance"
                icon={<BarChart3 className="size-5" />}
                href="#"
              />
              <AdminActionCard
                title="Logout"
                description="End your administrator session securely"
                icon={<LogOut className="size-5" />}
                href="/api/auth/logout?next=/admin/login"
                danger
              />
            </div>
          </section>

          {/* Info Box */}
          <div className="mt-12 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
            <p className="text-sm text-amber-200">
              ⚠️ <strong>Security Notice:</strong> All admin actions are logged and monitored. Unauthorized access
              attempts are recorded and may trigger security alerts.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: "blue" | "cyan" | "green" | "emerald";
}) {
  const colorClasses = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    green: "border-green-500/30 bg-green-500/10 text-green-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function AdminActionCard({
  title,
  description,
  icon,
  href,
  danger,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  danger?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group rounded-lg border p-6 transition-all ${
        danger
          ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/50"
          : "border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-600"
      }`}
    >
      <div className={`mb-3 w-fit rounded-lg p-2 ${danger ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-400"}`}>
        {icon}
      </div>
      <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </a>
  );
}
