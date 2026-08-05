"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const isDev = process.env.NODE_ENV === "development";

export default function TurnstileWidget({ onTokenChange }: { onTokenChange: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip on localhost/dev
    if (isDev || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setLoading(false);
      onTokenChange(""); // Empty token in dev
      return;
    }

    if (!siteKey || !container.current) {
      setLoading(false);
      setError("Turnstile not configured");
      return;
    }

    let active = true;

    const render = () => {
      if (!active || !container.current) return;

      try {
        if (!window.turnstile) {
          throw new Error("Turnstile API failed to load");
        }

        if (widgetId.current) return; // Already rendered

        widgetId.current = window.turnstile.render(container.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "normal",
          callback: (token: string) => {
            setError(null);
            onTokenChange(token);
          },
          "expired-callback": () => {
            setError("Verification expired");
            onTokenChange("");
          },
          "error-callback": () => {
            setError("Verification failed");
            onTokenChange("");
          },
          "before-interactive-callback": () => {
            setLoading(true);
          },
          "after-interactive-callback": () => {
            setLoading(false);
          },
        });

        setLoading(false);
      } catch (err) {
        console.error("[Turnstile Widget] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load Turnstile");
        setLoading(false);
      }
    };

    const scriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    if (existing) {
      if (window.turnstile) {
        render();
      } else {
        existing.addEventListener("load", render, { once: true });
        existing.addEventListener("error", () => {
          if (active) {
            setError("Failed to load Turnstile");
            setLoading(false);
          }
        }, { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;

      script.addEventListener("load", render, { once: true });
      script.addEventListener("error", () => {
        if (active) {
          setError("Failed to load Turnstile API");
          setLoading(false);
        }
      }, { once: true });

      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch (err) {
          console.error("[Turnstile Widget] Cleanup error:", err);
        }
        widgetId.current = null;
      }
    };
  }, [onTokenChange]);

  if (!siteKey) return null;

  return (
    <div className="space-y-2">
      <div
        ref={container}
        aria-label="Bot protection verification"
        className="pt-1"
      />
      {error && (
        <p className="text-xs text-red-400">
          ⚠️ {error}
        </p>
      )}
      {loading && (
        <p className="text-xs text-slate-400">
          Loading verification...
        </p>
      )}
    </div>
  );
}
