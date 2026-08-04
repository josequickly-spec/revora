"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import TurnstileWidget from "@/components/security/TurnstileWidget";

type Mode = "login" | "register" | "reset";

export default function AuthForm({ initialResetToken = "" }: { initialResetToken?: string }) {
  const [mode, setMode] = useState<Mode>(initialResetToken ? "reset" : "login");
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"error" | "success">("error");
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setStatusType("error");
    const data = new FormData(event.currentTarget);

    try {
      let endpoint = `/api/auth/${mode}`;
      let body: Record<string, FormDataEntryValue | string>;

      if (mode === "reset") {
        const password = String(data.get("password") || "");
        const confirmPassword = String(data.get("confirmPassword") || "");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        endpoint = "/api/auth/password-reset-confirm";
        body = { token: resetToken, password, turnstileToken };
      } else if (mode === "login") {
        body = {
          email: data.get("email") || "",
          password: data.get("password") || "",
          ...(data.get("mfaCode") ? { mfaCode: data.get("mfaCode") || "" } : {}),
          turnstileToken,
        };
      } else {
        body = {
          email: data.get("email") || "",
          password: data.get("password") || "",
          displayName: data.get("displayName") || "",
          organizationName: data.get("organizationName") || "",
          turnstileToken,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Authentication failed.");

      if (mode === "reset") {
        setResetToken("");
        setMode("login");
        setStatusType("success");
        setStatus("Password updated. Sign in with your new password.");
        window.history.replaceState({}, "", "/login");
        return;
      }

      window.location.assign("/crm");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/[.09] bg-white/[.035] p-6 sm:p-8">
      {mode === "reset" ? (
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Password recovery</p>
          <h2 className="mt-2 text-2xl font-black text-white">Choose a new password</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter a new password with at least 12 characters.
          </p>
        </div>
      ) : (
        <div className="mb-6 flex rounded-xl bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${
              mode === "login" ? "bg-cyan-300 text-slate-950" : "text-slate-400"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${
              mode === "register" ? "bg-cyan-300 text-slate-950" : "text-slate-400"
            }`}
          >
            Create organization
          </button>
        </div>
      )}

      <form method="post" onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <>
            <Field name="displayName" label="Your name" autoComplete="name" />
            <Field name="organizationName" label="Organization" autoComplete="organization" />
          </>
        )}
        {mode !== "reset" && <Field name="email" label="Email" type="email" autoComplete="email" />}
        <Field
          name="password"
          label={mode === "reset" ? "New password" : "Password"}
          type="password"
          autoComplete={mode === "reset" || mode === "register" ? "new-password" : "current-password"}
        />
        {mode === "reset" && (
          <Field
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
          />
        )}
        {mode === "login" && (
          <Field name="mfaCode" label="MFA code (when enabled)" required={false} autoComplete="one-time-code" />
        )}
        <TurnstileWidget onTokenChange={setTurnstileToken} />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {busy
            ? "Working…"
            : mode === "login"
              ? "Sign in securely"
              : mode === "register"
                ? "Create secure workspace"
                : "Set new password"}
        </button>
        {status && (
          <p role="alert" className={`text-sm ${statusType === "success" ? "text-emerald-300" : "text-rose-300"}`}>
            {status}
          </p>
        )}
      </form>

      {mode !== "reset" && (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href="/api/auth/oauth/google/start"
            className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold text-slate-300"
          >
            Continue with Google
          </Link>
          <Link
            href="/api/auth/oauth/microsoft/start"
            className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold text-slate-300"
          >
            Continue with Microsoft
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-300">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        minLength={type === "password" ? 12 : undefined}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none focus:border-cyan-300"
      />
    </label>
  );
}
