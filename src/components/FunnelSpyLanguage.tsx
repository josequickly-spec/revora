"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

const translations: Record<string, string> = {
  "Analizar": "Analyze",
  "Comparar": "Compare",
  "Historial": "History",
  "Nueva auditoría": "New audit",
  "Inteligencia de embudos con IA": "AI-powered funnel intelligence",
  "Descubre la estrategia detrás de cualquier sitio.": "Discover the strategy behind any website.",
  "Descubre la estrategia detrás de": "Discover the strategy behind",
  "cualquier": "any",
  "cualquier sitio.": "any website.",
  "sitio.": "website.",
  "Mapea páginas, CTAs, formularios, tecnologías y rendimiento. FunnelSpy convierte evidencia pública en un plan de conversión accionable.": "Map pages, CTAs, forms, technologies, and performance. FunnelSpy turns public evidence into an actionable conversion plan.",
  "Analizar embudo": "Analyze funnel",
  "¿Quieres probarlo? Analiza stripe.com": "Want to try it? Analyze stripe.com",
  "¿Quieres probarlo? Analiza": "Want to try it? Analyze",
  "Rastreando...": "Crawling...",
  "Rastreo inteligente": "Intelligent crawling",
  "Descubre rutas clave y clasifica páginas del recorrido sin enviar formularios.": "Discover key routes and classify journey pages without submitting forms.",
  "Señales técnicas": "Technical signals",
  "Identifica tecnologías, píxeles, formularios, rendimiento y edad del dominio.": "Identify technologies, pixels, forms, performance, and domain age.",
  "Estrategia con IA": "AI strategy",
  "Transforma los hallazgos en fortalezas, brechas, anuncios y acciones priorizadas.": "Turn findings into strengths, gaps, ad angles, and prioritized actions.",
  "Auditoría completada": "Audit completed",
  "Visitar": "Visit",
  "Exportar CSV": "Export CSV",
  "Compartir": "Share",
  "Monitorear semanalmente": "Monitor weekly",
  "Monitoreo activo": "Monitoring active",
  "Diagnóstico FunnelSpy": "FunnelSpy diagnosis",
  "Embudo avanzado": "Advanced funnel",
  "Embudo sólido": "Strong funnel",
  "Embudo básico": "Basic funnel",
  "Presencia sin embudo claro": "Online presence without a clear funnel",
  "La puntuación combina estructura pública, CTAs, captura, seguimiento y señales del recorrido detectado.": "The score combines public structure, CTAs, lead capture, tracking, and detected journey signals.",
  "Páginas": "Pages",
  "Formularios": "Forms",
  "Embudo estimado": "Estimated funnel",
  "Descubrimiento": "Discovery",
  "Oferta": "Offer",
  "Captura": "Lead capture",
  "Conversión": "Conversion",
  "Confirmación": "Confirmation",
  "Snapshot público": "Public snapshot",
  "Vista del sitio": "Website view",
  "Rendimiento": "Performance",
  "Galería de páginas": "Page gallery",
  "Superficies detectadas": "Detected surfaces",
  "Convierte las señales en estrategia": "Turn signals into strategy",
  "Interpreta objetivo, audiencia, propuesta de valor, fricción y oportunidades usando solo la evidencia recopilada.": "Interpret goals, audience, value proposition, friction, and opportunities using only collected evidence.",
  "Analizar con IA": "Analyze with AI",
  "Interpretando...": "Analyzing...",
  "Regenerar informe": "Regenerate report",
  "Informe estratégico": "Strategic report",
  "Confianza": "Confidence",
  "Fortalezas": "Strengths",
  "Debilidades": "Weaknesses",
  "Plan de optimización": "Optimization plan",
  "Crea un funnel nuevo desde este reporte": "Create a new funnel from this report",
  "Genera una landing bilingüe propia con nueva estructura, copy, CTA, formulario y email de bienvenida basados en las oportunidades detectadas, sin copiar el sitio analizado.": "Generate an original bilingual landing page with a new structure, copy, CTA, form, and welcome email based on detected opportunities—without copying the analyzed website.",
  "Crear nuevo funnel": "Create new funnel",
  "Creando funnel...": "Creating funnel...",
  "Funnel creado correctamente": "Funnel created successfully",
  "Calidad técnica": "Technical quality",
  "Accesibilidad": "Accessibility",
  "Buenas prácticas": "Best practices",
  "Stack detectado": "Detected stack",
  "Dominio": "Domain",
  "Antigüedad": "Domain age",
  "Registrador": "Registrar",
  "Historial de auditorías": "Audit history",
  "Revisa resultados, comparte informes y observa cambios de score por dominio.": "Review results, share reports, and track score changes by domain.",
  "Todavía no hay auditorías guardadas.": "No saved audits yet.",
  "Compara competidores": "Compare competitors",
  "Introduce entre dos y cinco dominios, uno por línea. El análisis compara estructura, captación, tracking y rendimiento.": "Enter two to five domains, one per line. The analysis compares structure, lead capture, tracking, and performance.",
  "Crear comparación": "Create comparison",
  "Comparando sitios...": "Comparing websites...",
  "Dimensión": "Dimension",
  "Funnel score": "Funnel score",
  "Informe compartido": "Shared report",
  "Guardar como PDF": "Save as PDF",
  "FunnelSpy analiza únicamente información pública. Los hallazgos son estimaciones, no acceso interno.": "FunnelSpy analyzes public information only. Findings are estimates, not internal access.",
};

const originalText = new WeakMap<Node, string>();
let activeLanguage: "es" | "en" = "es";

function translateDocument(language: "es" | "en") {
  activeLanguage = language;
  document.documentElement.lang = language;
  document.querySelectorAll("body *").forEach((element) => {
    element.childNodes.forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const value = node.textContent?.trim();
      if (!value) return;
      const original = originalText.get(node) || value;
      if (!originalText.has(node)) originalText.set(node, original);
      const next = language === "en" ? translations[original] : original;
      if (next && node.textContent !== next) node.textContent = node.textContent?.replace(value, next) || next;
    });
  });
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[placeholder]").forEach((element) => {
    const original = element.dataset.fsPlaceholder || element.placeholder;
    element.dataset.fsPlaceholder = original;
    if (original === "https://competidor.com") element.placeholder = language === "en" ? "https://competitor.com" : original;
  });
}

export default function FunnelSpyLanguage() {
  const [language, setLanguage] = useState<"es" | "en">("es");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("lang");
    const initial = query === "en" || (!query && localStorage.getItem("funnelspy-language") === "en") ? "en" : "es";
    queueMicrotask(() => setLanguage(initial));
    translateDocument(initial);
    const observer = new MutationObserver(() => translateDocument(activeLanguage));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function change(next: "es" | "en") {
    localStorage.setItem("funnelspy-language", next);
    setLanguage(next);
    const url = new URL(window.location.href);
    if (next === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.history.replaceState({}, "", url);
    translateDocument(next);
    window.dispatchEvent(new CustomEvent("funnelspy-language", { detail: next }));
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-1 rounded-2xl border border-white/15 bg-[#10131d]/95 p-1.5 shadow-2xl backdrop-blur-xl print:hidden">
      <Languages className="mx-2 size-4 text-violet-300" />
      {(["es", "en"] as const).map((item) => (
        <button key={item} onClick={() => change(item)} className={`rounded-xl px-3 py-2 text-xs font-black uppercase ${language === item ? "bg-violet-500 text-white" : "text-slate-400 hover:text-white"}`}>
          {item}
        </button>
      ))}
    </div>
  );
}
