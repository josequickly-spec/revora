import type { Metadata } from "next";
import type { ReactNode } from "react";
import FunnelSpyLanguage from "@/components/FunnelSpyLanguage";

export const metadata: Metadata = {
  title: "FunnelSpy AI — Inteligencia competitiva de embudos",
  description: "Analiza páginas, CTAs, formularios, tecnologías, rendimiento y estrategia de conversión usando evidencia pública e inteligencia artificial.",
};

export default function FunnelSpyLayout({ children }: { children: ReactNode }) {
  return <>{children}<FunnelSpyLanguage /></>;
}
