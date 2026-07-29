"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react";

const controlClass =
  "grid size-11 place-items-center rounded-xl text-slate-200 outline-none transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300";

export default function GlobalNavigationControls() {
  const router = useRouter();

  return (
    <nav
      aria-label="Browser navigation"
      className="fixed bottom-4 right-4 z-[80] flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/90 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl print:hidden"
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back / Regresar"
        title="Back / Regresar"
        className={controlClass}
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </button>
      <Link
        href="/"
        aria-label="Main menu / Menú principal"
        title="Main menu / Menú principal"
        className={`${controlClass} bg-cyan-300/10 text-cyan-200`}
      >
        <LayoutGrid className="size-5" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => router.forward()}
        aria-label="Forward / Adelante"
        title="Forward / Adelante"
        className={controlClass}
      >
        <ArrowRight className="size-5" aria-hidden="true" />
      </button>
    </nav>
  );
}
