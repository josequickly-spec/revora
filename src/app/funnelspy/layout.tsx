import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FunnelSpy AI — Competitive Funnel Intelligence",
  description: "Analyze pages, CTAs, forms, technologies, performance, and conversion strategy using public evidence and artificial intelligence.",
};

export default function FunnelSpyLayout({ children }: { children: ReactNode }) {
  return children;
}
