"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function AdminAuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Authentication failed");
      }

      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3">
          <AlertCircle className="mt-0.5 size-4 flex-shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            disabled={loading}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 pl-10 text-slate-100 placeholder-slate-500 outline-none transition-colors hover:border-slate-600 focus:border-red-500 focus:bg-slate-900 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-3 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none transition-colors hover:border-slate-600 focus:border-red-500 focus:bg-slate-900 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-700 py-3 font-bold text-white shadow-lg shadow-red-900/30 transition-all hover:shadow-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Authenticating..." : "Admin Access"}
      </button>

      {/* Info */}
      <p className="text-center text-xs text-slate-500">
        This portal is restricted to authorized administrators only.
      </p>
    </form>
  );
}
