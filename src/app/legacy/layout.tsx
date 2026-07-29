import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Legacy workspace",
  description: "Original EcoScale Partner workspace retained during platform consolidation.",
};

export default function LegacyLayout({ children }: { children: ReactNode }) {
  return children;
}
