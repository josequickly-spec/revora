"use client";

export default function FunnelSpyPrintButton() {
  return (
    <button onClick={() => window.print()} className="print:hidden rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white">
      Guardar como PDF
    </button>
  );
}
