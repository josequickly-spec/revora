import { brand } from "@/lib/brand";
import AdminAuthForm from "@/components/enterprise/AdminAuthForm";

export const metadata = {
  title: `Admin Access | ${brand.name}`,
  description: "Administrator login portal",
};

export default async function AdminLoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-red-950 via-slate-950 to-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,.15),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,.08),_transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
        <div className="w-full space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-300">
              🔐 Admin Portal
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Revora Administrator
            </h1>
            <p className="text-sm text-slate-400">
              Secure access for platform administrators only
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6 rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-950/30 to-slate-950/50 p-8 backdrop-blur-sm shadow-2xl shadow-red-950/20">
            <AdminAuthForm />
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-500">
            Unauthorized access attempts are logged and monitored
          </div>
        </div>
      </div>
    </main>
  );
}
