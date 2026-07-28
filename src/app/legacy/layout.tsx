import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Legacy workspace",
  description: "Original Revora workspace retained during Lead Intelligence consolidation.",
};

export default function LegacyLayout({ children }: { children: ReactNode }) {
  return children;
}
