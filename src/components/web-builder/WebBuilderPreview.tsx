"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import type { WebBuilderSpec } from "@/lib/web-builder";

function color(value: string, fallback: string) {
  return /^(#[0-9a-f]{3,8}|rgb[a]?\([^)]*\)|hsl[a]?\([^)]*\))$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

export default function WebBuilderPreview({
  spec,
  device,
}: {
  spec: WebBuilderSpec;
  device: "desktop" | "mobile";
}) {
  const [cart, setCart] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadComplete, setLeadComplete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const primary = color(spec.brand.primaryColor, "#f97316");
  const accent = color(spec.brand.accentColor, "#f5c26b");
  const background = color(spec.brand.backgroundColor, "#f7f3ed");
  const surface = color(spec.brand.surfaceColor, "#fffdf9");
  const ink = color(spec.brand.textColor, "#171412");
  const isMobile = device === "mobile";
  const total = useMemo(
    () => cart.reduce((sum, index) => sum + (spec.products[index]?.price || 0), 0),
    [cart, spec.products],
  );
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: spec.projection.currencyCode,
    maximumFractionDigits: 0,
  });

  const add = (index: number) => {
    setCart((current) => [...current, index]);
    setCartOpen(true);
  };

  return (
    <div
      className={`relative mx-auto overflow-hidden bg-white shadow-2xl transition-all ${isMobile ? "max-w-[390px] rounded-[32px]" : "max-w-[1380px] rounded-[24px]"}`}
      style={{ backgroundColor: background, color: ink, fontFamily: spec.brand.fontFamily || "Arial, sans-serif" }}
    >
      <div className="px-5 py-2 text-center text-[9px] font-black uppercase tracking-[.18em] text-white" style={{ backgroundColor: ink }}>
        {spec.announcement}
      </div>
      <header className="relative z-10 flex items-center justify-between border-b border-black/10 px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          {spec.brand.logoUrl ? (
            <span className="h-9 w-24 bg-contain bg-left bg-no-repeat" style={{ backgroundImage: `url(${spec.brand.logoUrl})` }} />
          ) : (
            <strong className="text-sm font-black uppercase tracking-[.18em]">{spec.brand.name}</strong>
          )}
        </div>
        {!isMobile && (
          <nav className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[.12em]">
            {spec.brand.navigation.map((item) => <span key={item}>{item}</span>)}
          </nav>
        )}
        <div className="flex items-center gap-1">
          {isMobile && <button onClick={() => setMenuOpen(true)} className="grid size-10 place-items-center" aria-label="Open menu"><Menu className="size-5" /></button>}
          <button onClick={() => setCartOpen(true)} className="relative grid size-10 place-items-center" aria-label="Open preview cart">
            <ShoppingBag className="size-5" />
            <span className="absolute right-0 top-0 grid size-5 place-items-center rounded-full text-[9px] font-black text-white" style={{ backgroundColor: primary }}>{cart.length}</span>
          </button>
        </div>
      </header>

      <section className={`relative overflow-hidden ${isMobile ? "min-h-[680px]" : "min-h-[690px]"}`}>
        {spec.brand.heroImageUrl ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(12,10,8,.82),rgba(12,10,8,.14)),url(${spec.brand.heroImageUrl})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 75% 35%,${accent}aa,transparent 25%),linear-gradient(135deg,${ink},${primary})` }} />
        )}
        <div className={`relative z-10 flex min-h-[inherit] flex-col justify-end px-7 py-14 text-white ${isMobile ? "" : "max-w-4xl px-16 py-20"}`}>
          <span className="mb-5 text-[10px] font-black uppercase tracking-[.2em] text-white/70">{spec.hero.eyebrow}</span>
          <h1 className={`max-w-4xl font-black leading-[.92] tracking-[-.05em] ${isMobile ? "text-5xl" : "text-7xl"}`}>{spec.hero.headline}</h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-white/75">{spec.hero.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => setLeadOpen(true)} className="flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black text-white" style={{ backgroundColor: primary }}>{spec.hero.primaryCta}<ArrowRight className="size-4" /></button>
            <button className="rounded-full border border-white/40 px-6 py-3 text-xs font-black">{spec.hero.secondaryCta}</button>
          </div>
          {!isMobile && <div className="mt-10 flex max-w-3xl gap-3">{spec.hero.route.map((item, index) => <span key={item} className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-[9px] font-bold uppercase tracking-wider backdrop-blur"><b className="mr-2" style={{ color: accent }}>0{index + 1}</b>{item}</span>)}</div>}
        </div>
      </section>

      <section className={`grid border-b border-black/10 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`} style={{ backgroundColor: surface }}>
        {spec.trustItems.slice(0, 4).map((item) => <div key={item} className="flex min-h-20 items-center justify-center gap-2 border-r border-black/10 px-4 text-center text-[9px] font-bold uppercase tracking-wider"><Check className="size-4" style={{ color: primary }} />{item}</div>)}
      </section>

      <section className={`${isMobile ? "px-5 py-16" : "px-12 py-24"}`}>
        <span className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: primary }}>Explore the experience</span>
        <h2 className={`mt-4 max-w-3xl font-black leading-none tracking-[-.04em] ${isMobile ? "text-4xl" : "text-6xl"}`}>Choose the path that fits your next step.</h2>
        <div className={`mt-10 grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          {spec.categories.map((category, index) => <article key={category.name} className="relative min-h-72 overflow-hidden rounded-sm p-7 text-white" style={{ background: `linear-gradient(145deg,${index % 2 ? ink : primary},${accent})` }}><span className="text-[9px] font-black uppercase tracking-[.18em] text-white/60">Collection 0{index + 1}</span><h3 className="absolute bottom-16 left-7 right-7 text-3xl font-black">{category.name}</h3><p className="absolute bottom-7 left-7 right-7 text-xs text-white/70">{category.description}</p></article>)}
        </div>
      </section>

      <section className={`${isMobile ? "px-5 py-16" : "px-12 py-24"}`} style={{ backgroundColor: surface }}>
        <div className="flex items-end justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: primary }}>Designed to convert</span><h2 className={`mt-4 font-black tracking-[-.04em] ${isMobile ? "text-4xl" : "text-6xl"}`}>Featured offers</h2></div><span className="text-[9px] font-bold uppercase tracking-wider opacity-50">Preview products</span></div>
        <div className={`mt-10 grid gap-5 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          {spec.products.slice(0, isMobile ? 3 : 6).map((product, index) => <article key={`${product.name}-${index}`}>
            <div className="relative aspect-[.78] overflow-hidden" style={{ background: `linear-gradient(145deg,${accent}66,${primary}33)` }}>
              {product.imageUrl ? <div className="absolute inset-0 bg-cover bg-center transition duration-700 hover:scale-105" style={{ backgroundImage: `url(${product.imageUrl})` }} /> : <div className="absolute inset-0 grid place-items-center"><Sparkles className="size-12 opacity-20" /></div>}
              <span className="absolute left-3 top-3 bg-white px-3 py-2 text-[8px] font-black uppercase tracking-wider">{product.badge}</span>
              <button onClick={() => add(index)} className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-wider">Add to preview <Plus className="size-3.5" /></button>
            </div>
            <div className="flex items-start justify-between gap-4 pt-4"><div><h3 className="text-sm font-black">{product.name}</h3><p className="mt-1 text-[10px] opacity-55">{product.category} · {product.description}</p></div><strong className="text-sm">{currency.format(product.price)}</strong></div>
          </article>)}
        </div>
      </section>

      <section className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        <div className={`${isMobile ? "p-7 py-16" : "p-16"}`} style={{ backgroundColor: ink, color: "white" }}><span className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: accent }}>{spec.leadMagnet.eyebrow}</span><h2 className={`${isMobile ? "text-4xl" : "text-6xl"} mt-5 font-black leading-none tracking-[-.04em]`}>{spec.leadMagnet.headline}</h2><p className="mt-6 max-w-xl text-sm leading-6 text-white/65">{spec.leadMagnet.body}</p><button onClick={() => setLeadOpen(true)} className="mt-7 rounded-full px-6 py-3 text-xs font-black text-white" style={{ backgroundColor: primary }}>{spec.leadMagnet.cta}</button></div>
        <div className={`${isMobile ? "p-7 py-16" : "p-16"}`} style={{ backgroundColor: accent }}><span className="text-[10px] font-black uppercase tracking-[.2em]">{spec.story.eyebrow}</span><h2 className={`${isMobile ? "text-4xl" : "text-6xl"} mt-5 font-black leading-none tracking-[-.04em]`}>{spec.story.headline}</h2><p className="mt-6 max-w-xl text-sm leading-7 opacity-70">{spec.story.body}</p></div>
      </section>

      <section className={`${isMobile ? "p-7 py-16" : "p-16 py-24"}`}>
        <div className={`rounded-3xl p-8 text-white ${isMobile ? "" : "flex items-end justify-between gap-10 p-12"}`} style={{ background: `linear-gradient(135deg,${primary},${ink})` }}><div><span className="text-[10px] font-black uppercase tracking-[.2em] text-white/65">{spec.bundle.eyebrow}</span><h2 className={`${isMobile ? "text-4xl" : "text-6xl"} mt-4 max-w-3xl font-black leading-none tracking-[-.04em]`}>{spec.bundle.headline}</h2><p className="mt-5 max-w-2xl text-sm leading-6 text-white/70">{spec.bundle.body}</p></div><div className={`${isMobile ? "mt-8" : "shrink-0 text-right"}`}><strong className="block text-4xl">{currency.format(spec.bundle.price)}</strong><button onClick={() => setCartOpen(true)} className="mt-4 rounded-full bg-white px-6 py-3 text-xs font-black" style={{ color: ink }}>{spec.bundle.cta}</button></div></div>
      </section>

      <section className={`${isMobile ? "px-7 py-16" : "px-16 py-24"}`} style={{ backgroundColor: surface }}><span className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: primary }}>Questions, answered</span><div className="mt-8 divide-y divide-black/10">{spec.faq.map((item) => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black">{item.question}<Plus className="size-4 transition group-open:rotate-45" /></summary><p className="mt-3 max-w-3xl text-sm leading-6 opacity-60">{item.answer}</p></details>)}</div></section>

      <footer className={`${isMobile ? "p-7 py-16" : "p-16 py-20"}`} style={{ backgroundColor: ink, color: "white" }}><div className={`${isMobile ? "" : "flex items-end justify-between gap-12"}`}><div><span className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: accent }}>{spec.brand.name}</span><h2 className={`${isMobile ? "text-4xl" : "text-6xl"} mt-5 max-w-3xl font-black leading-none tracking-[-.04em]`}>{spec.footer.headline}</h2><p className="mt-5 max-w-xl text-sm text-white/60">{spec.footer.body}</p></div><button onClick={() => setLeadOpen(true)} className={`${isMobile ? "mt-7" : "shrink-0"} rounded-full px-7 py-3 text-xs font-black text-white`} style={{ backgroundColor: primary }}>{spec.footer.cta}</button></div><div className="mt-14 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-5 text-[9px] uppercase tracking-wider text-white/35"><span>{spec.previewDisclaimer}</span><span>AI Web Builder · Revora</span></div></footer>

      {(cartOpen || leadOpen || menuOpen) && <button aria-label="Close overlay" className="absolute inset-0 z-30 bg-black/55 backdrop-blur-sm" onClick={() => { setCartOpen(false); setLeadOpen(false); setMenuOpen(false); }} />}
      <aside className={`absolute bottom-0 right-0 top-0 z-40 w-[min(92%,420px)] bg-white p-6 text-black shadow-2xl transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}><div className="flex items-center justify-between border-b border-black/10 pb-5"><div><span className="text-[9px] font-black uppercase tracking-wider opacity-45">Preview cart</span><h2 className="text-2xl font-black">Your selection</h2></div><button onClick={() => setCartOpen(false)} className="grid size-10 place-items-center"><X className="size-5" /></button></div><div className="space-y-4 py-6">{cart.length ? cart.map((index, line) => { const item = spec.products[index]; return <article key={`${index}-${line}`} className="flex items-center justify-between gap-4 border-b border-black/10 pb-4"><div><strong className="text-sm">{item?.name}</strong><p className="text-xs opacity-50">{item?.category}</p></div><div className="flex items-center gap-3"><strong className="text-sm">{currency.format(item?.price || 0)}</strong><button onClick={() => setCart((current) => current.filter((_, i) => i !== line))}><Minus className="size-4" /></button></div></article>; }) : <p className="py-16 text-center text-sm opacity-45">Select an offer to demonstrate the cart journey.</p>}</div><div className="absolute bottom-6 left-6 right-6 border-t border-black/10 pt-5"><div className="flex justify-between text-sm"><span>Total estimate</span><strong>{currency.format(total)}</strong></div><button className="mt-4 w-full rounded-full py-3 text-xs font-black text-white" style={{ backgroundColor: primary }}>Continue preview</button><p className="mt-3 text-center text-[9px] opacity-40">No real payment will be processed.</p></div></aside>
      <section className={`absolute left-1/2 top-1/2 z-40 w-[min(90%,760px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white text-black shadow-2xl transition ${leadOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}><div className={`grid ${isMobile ? "" : "grid-cols-[.8fr_1.2fr]"}`}><div className="min-h-48 p-7 text-white" style={{ background: `linear-gradient(145deg,${primary},${ink})` }}><Sparkles className="size-8" /><h3 className="mt-8 text-3xl font-black leading-none">{spec.leadMagnet.headline}</h3></div><div className="relative p-7"><button onClick={() => setLeadOpen(false)} className="absolute right-4 top-4 grid size-9 place-items-center"><X className="size-4" /></button>{leadComplete ? <div className="grid min-h-64 place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-lime-100 text-lime-700"><Check className="size-5" /></span><h3 className="mt-4 text-2xl font-black">Preview captured</h3><p className="mt-2 text-sm opacity-55">In production, this lead would enter the selected follow-up automation.</p></div></div> : <form onSubmit={(event) => { event.preventDefault(); setLeadComplete(true); }} className="space-y-3 pt-10"><input required placeholder="Name" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm" /><input required type="email" placeholder="Email" className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm" /><select required className="h-12 w-full rounded-xl border border-black/10 px-4 text-sm"><option value="">Primary interest</option>{spec.categories.map((category) => <option key={category.name}>{category.name}</option>)}</select><button className="h-12 w-full rounded-xl text-xs font-black text-white" style={{ backgroundColor: primary }}>{spec.leadMagnet.cta}</button><p className="text-[9px] leading-4 opacity-40">Preview form. No information is stored or sent.</p></form>}</div></div></section>
      <aside className={`absolute inset-0 z-40 bg-white p-7 text-black transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}><div className="flex items-center justify-between"><strong className="uppercase tracking-[.18em]">{spec.brand.name}</strong><button onClick={() => setMenuOpen(false)}><X className="size-5" /></button></div><nav className="mt-16 grid gap-6 text-3xl font-black">{spec.brand.navigation.map((item) => <button key={item} onClick={() => setMenuOpen(false)} className="text-left">{item}</button>)}</nav></aside>
    </div>
  );
}
