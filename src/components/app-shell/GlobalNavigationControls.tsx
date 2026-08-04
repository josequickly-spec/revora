"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

const controlClass =
  "flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-11 sm:px-4";

export default function GlobalNavigationControls() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/legacy" || pathname.startsWith("/legacy/")) return null;

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <nav
      aria-label="Navegación global"
      className="fixed bottom-3 left-1/2 z-[80] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0 print:hidden"
    >
      <button
        type="button"
        onClick={goBack}
        aria-label="Volver a la página anterior"
        title="Volver"
        className={controlClass}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Volver</span>
      </button>
      <Link
        href="/"
        aria-label="Menú principal"
        title="Menú principal"
      className={`${controlClass} bg-cyan-300 text-slate-950 hover:bg-cyan-200 hover:text-slate-950`}
      >
        <Home className="size-4" aria-hidden="true" />
        <span>Menú principal</span>
      </Link>
    </nav>
  );
}
