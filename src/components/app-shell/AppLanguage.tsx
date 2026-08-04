"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import generatedEntries from "@/lib/ui-translations.generated.json";

type Language = "es" | "en";
type Entry = { source: string; es: string; en: string };

const manualEntries: Entry[] = [
  { source: "Command", es: "Comando", en: "Command" },
  { source: "Intelligence", es: "Inteligencia", en: "Intelligence" },
  { source: "Revenue", es: "Ingresos", en: "Revenue" },
  { source: "Operations", es: "Operaciones", en: "Operations" },
  { source: "Platform", es: "Plataforma", en: "Platform" },
  { source: "Command Center", es: "Centro de control", en: "Command Center" },
  { source: "Businesses", es: "Negocios", en: "Businesses" },
  { source: "Audits", es: "Auditorías", en: "Audits" },
  { source: "Opportunities", es: "Oportunidades", en: "Opportunities" },
  { source: "Proposals", es: "Propuestas", en: "Proposals" },
  { source: "Settings", es: "Configuración", en: "Settings" },
  { source: "New audit", es: "Nueva auditoría", en: "New audit" },
  { source: "Skip to content", es: "Saltar al contenido", en: "Skip to content" },
  { source: "Back", es: "Volver", en: "Back" },
  { source: "Main menu", es: "Menú principal", en: "Main menu" },
  { source: "Language", es: "Idioma", en: "Language" },
];

const entries = [...(generatedEntries as Entry[]), ...manualEntries];
const lookup = new Map<string, Entry>();
for (const entry of entries) {
  lookup.set(entry.source.trim(), entry);
  lookup.set(entry.es.trim(), entry);
  lookup.set(entry.en.trim(), entry);
}

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ["placeholder", "title", "aria-label"];

function replacePreservingWhitespace(value: string, replacement: string) {
  const start = value.match(/^\s*/)?.[0] || "";
  const end = value.match(/\s*$/)?.[0] || "";
  return `${start}${replacement}${end}`;
}

function translateDocument(language: Language) {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll<HTMLElement>("body *")) {
    if (element.closest("[data-no-translate]")) continue;
    if (["SCRIPT", "STYLE", "CODE", "PRE", "SVG"].includes(element.tagName)) continue;
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const textNode = node as Text;
      const current = textNode.data;
      const original = originalText.get(textNode) || current;
      if (!originalText.has(textNode)) originalText.set(textNode, original);
      const entry = lookup.get(original.trim()) || lookup.get(current.trim());
      if (!entry) continue;
      const translated = replacePreservingWhitespace(original, entry[language]);
      if (current !== translated) textNode.data = translated;
    }

    let saved = originalAttributes.get(element);
    if (!saved) {
      saved = new Map<string, string>();
      originalAttributes.set(element, saved);
    }
    for (const attribute of translatedAttributes) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      if (!saved.has(attribute)) saved.set(attribute, current);
      const original = saved.get(attribute) || current;
      const entry = lookup.get(original.trim()) || lookup.get(current.trim());
      if (entry && current !== entry[language]) element.setAttribute(attribute, entry[language]);
    }
  }
}

export default function AppLanguage() {
  const pathname = usePathname();
  const publicLocalizedFunnel = /^\/(?:es|en)\/funnel\//.test(pathname) || pathname.startsWith("/funnel/");
  const [language, setLanguage] = useState<Language>("es");
  const frame = useRef<number | null>(null);
  const disabled = useMemo(() => publicLocalizedFunnel, [publicLocalizedFunnel]);

  useEffect(() => {
    if (disabled) return;
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    const saved = window.localStorage.getItem("ecoscale-ui-language");
    const initial: Language = queryLanguage === "en" || (!queryLanguage && saved === "en") ? "en" : "es";
    queueMicrotask(() => setLanguage(initial));
    translateDocument(initial);
    const observer = new MutationObserver(() => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        translateDocument(initial === language ? language : (window.localStorage.getItem("ecoscale-ui-language") === "en" ? "en" : "es"));
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: translatedAttributes });
    return () => {
      observer.disconnect();
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [disabled, language]);

  function change(next: Language) {
    window.localStorage.setItem("ecoscale-ui-language", next);
    window.localStorage.setItem("funnelspy-language", next);
    setLanguage(next);
    translateDocument(next);
    window.dispatchEvent(new CustomEvent("ecoscale-language", { detail: next }));
  }

  if (disabled) return null;
  return (
    <div data-no-translate className="fixed bottom-3 left-3 z-[90] flex items-center gap-1 rounded-2xl border border-white/15 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl print:hidden">
      <Languages className="mx-1 size-4 text-cyan-300" aria-hidden="true" />
      {(["es", "en"] as const).map((item) => (
        <button key={item} type="button" onClick={() => change(item)} aria-label={`${item === "es" ? "Español" : "English"}`} aria-pressed={language === item} className={`rounded-xl px-3 py-2 text-xs font-black uppercase transition ${language === item ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}>
          {item}
        </button>
      ))}
    </div>
  );
}
