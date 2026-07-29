import type { Metadata } from "next";
import type { ReactNode } from "react";
import GlobalNavigationControls from "@/components/app-shell/GlobalNavigationControls";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Revora Lead Intelligence",
    template: "%s | Revora",
  },
  description: "Lead intelligence, funnel analysis, proposals, outreach and CRM in one connected workspace.",
};

// Next.js can attach the request nonce to framework scripts only when HTML is
// rendered per request.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
        <GlobalNavigationControls />
      </body>
    </html>
  );
}
