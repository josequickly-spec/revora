"use client";
import React, { useState } from "react";
import { Search, Zap, CheckCircle2, AlertCircle, Loader } from "lucide-react";

export function AutoDiscovery() {
  const [domain, setDomain] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [industryType, setIndustryType] = useState("general");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || (!domain && !city && !zipcode)) {
      setError("Indica el negocio y un dominio, ciudad o código postal");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          businessName,
          industryType,
          city: city || undefined,
          zipcode: zipcode || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
        setDomain("");
        setBusinessName("");
        setCity("");
        setZipcode("");
        setFirstName("");
        setLastName("");
      } else {
        setError(data.error || "Error en discovery");
      }
    } catch (err) {
      setError("Error conectando a Hunter.io");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 border border-purple-800/40 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-black text-white mb-1">🤖 Discovery Automático (Hunter.io)</h2>
        <p className="text-sm text-slate-300">
          Busca automáticamente negocios por dominio y descubre el email del CEO/Fundador usando Hunter.io
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <form onSubmit={handleDiscover} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Dominio del Negocio (opcional)
              </label>
              <input
                type="text"
                placeholder="ejemplo.com (sin https://)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Ciudad</label>
                <input
                  type="text"
                  placeholder="ej. Miami"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Código postal</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="ej. 33101"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                placeholder="ej. Peluquería Luxe"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Tipo de Negocio</label>
              <select
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              >
                <option value="general">Otro / Cualquier negocio</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="restaurant">Restaurante</option>
                <option value="gym">Gimnasio</option>
                <option value="professional">Servicios Profesionales</option>
                <option value="healthcare">Salud/Clínica</option>
                <option value="saas">SaaS</option>
                <option value="realestate">Inmobiliaria</option>
                <option value="coaching">Coaching</option>
                <option value="agency">Agencia</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nombre (Opcional)</label>
                <input
                  type="text"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Apellido (Opcional)</label>
                <input
                  type="text"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-700/80 rounded-xl p-3 flex items-start gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Descubriendo...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Descubrir Negocio
                </>
              )}
            </button>
          </form>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-lg">Negocio Descubierto</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Negocio:</span>
                    <span className="font-semibold text-white">{result.business?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dominio:</span>
                    <span className="font-mono text-blue-400">{result.business?.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industria:</span>
                    <span className="text-slate-200">{result.business?.businessType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ubicación:</span>
                    <span className="text-slate-200">
                      {[result.business?.city, result.business?.postalCode].filter(Boolean).join(" ") || "No disponible"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Embudo:</span>
                    <span className="text-emerald-400 font-semibold">/funnel/{result.funnel?.slug}</span>
                  </div>
                </div>
              </div>

              {result.contact && (
                <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-2xl p-6 shadow-2xl space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-emerald-700/60">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white">Email Descubierto (Hunter.io)</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Contacto:</span>
                      <span className="font-semibold text-white">{result.contact?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Email:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{result.contact?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Confianza:</span>
                      <span className="bg-emerald-900 px-2 py-0.5 rounded text-xs font-bold text-emerald-200">
                        {Math.round(result.contact?.confidenceScore || 0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Rol:</span>
                      <span className="text-slate-200">{result.contact?.role}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-950/60 border border-blue-700/80 rounded-2xl p-4 text-xs text-blue-200 flex items-start gap-2">
                <Zap className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <strong>Listo para los siguientes pasos:</strong>
                  <ul className="mt-1 space-y-1 ml-4 list-disc">
                    <li>Embudo generado ✓</li>
                    <li>Email del CEO encontrado {result.emailFound ? "✓" : "⏳"}</li>
                    <li>Listo para enviar pitch y Loom video</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/60 border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Search className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Llena el formulario y haz clic &quot;Descubrir Negocio&quot;</p>
              <p className="text-slate-500 text-xs mt-2">
                Buscaremos automáticamente en Hunter.io el email del CEO/Fundador
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
