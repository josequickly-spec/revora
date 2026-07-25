import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revora — Revenue OS para Agencias",
  description: "Plataforma universal de adquisición de clientes para cualquier negocio. Automatiza embudos, contactos, outreach y modelos de revenue-share. Escala a 10.000€/mes con 2-3 clientes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {/* Clerk provider se agrega aquí cuando está configurado */}
        {children}
      </body>
    </html>
  );
}
