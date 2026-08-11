"use client";
import React, { useState } from "react";
import { Search, Zap, CheckCircle2, AlertCircle, Loader } from "lucide-react";

export function AutoDiscovery() {
  const [domain, setDomain] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [industryType, setIndustryType] = useState("general");
  const [businessCategory, setBusinessCategory] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [languageMode, setLanguageMode] = useState<"es" | "en" | "bilingual">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || (!domain && !city && !zipcode)) {
      setError("Enter the business and a domain, city, or ZIP code");
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
          businessCategory: businessCategory || undefined,
          city: city || undefined,
          zipcode: zipcode || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          languageMode,
          createFunnel: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
        setDomain("");
        setBusinessName("");
        setCity("");
        setZipcode("");
        setBusinessCategory("");
        setFirstName("");
        setLastName("");
      } else {
        setError(data.error || "Discovery error");
      }
    } catch (err) {
      setError("Error connecting to Hunter.io");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 border border-purple-800/40 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-black text-white mb-1">🤖 Auto Discovery (Hunter.io)</h2>
        <p className="text-sm text-slate-300">
          Automatically search for businesses by domain and discover the CEO/Founder&apos;s email using Hunter.io
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <form onSubmit={handleDiscover} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Funnel language</label>
              <select
                value={languageMode}
                onChange={(e) => setLanguageMode(e.target.value as "es" | "en" | "bilingual")}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              >
                <option value="en">English only</option>
                <option value="bilingual">Bilingual — Spanish + English</option>
                <option value="es">Spanish only</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Business Domain (optional)
              </label>
              <input
                type="text"
                placeholder="example.com (no https://)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Miami"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">ZIP code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 33101"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Business Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Luxe Salon"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Business Type</label>
              <select
                value={industryType}
                onChange={(e) => setIndustryType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm"
              >
                <option value="general">Other / Any business</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="restaurant">Restaurant</option>
                <option value="gym">Gym</option>
                <option value="professional">Professional Services</option>
                <option value="healthcare">Healthcare/Clinic</option>
                <option value="saas">SaaS</option>
                <option value="realestate">Real Estate</option>
                <option value="coaching">Coaching</option>
                <option value="agency">Agency</option>
              </select>
            </div>

            {industryType === "general" && (
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Specific category *
                </label>
                <input
                  required
                  type="text"
                  list="general-business-categories"
                  placeholder="e.g. Dealership, Salon, Construction..."
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
                <datalist id="general-business-categories">
                  <option value="Automotive / Dealership" />
                  <option value="Beauty / Salon / Spa" />
                  <option value="Construction / Contractor" />
                  <option value="Cleaning" />
                  <option value="Home Services" />
                  <option value="Retail" />
                  <option value="Tourism / Hotel" />
                  <option value="Manufacturing" />
                  <option value="Repairs / Auto Shop" />
                  <option value="Finance / Insurance" />
                  <option value="Education / Academy" />
                  <option value="Logistics / Transportation" />
                </datalist>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can pick a suggestion or type any other activity.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">First Name (Optional)</label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Last Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Smith"
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
                  Discovering...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Discover Business
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-lg">Business Discovered</h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Business:</span>
                    <span className="font-semibold text-white">{result.business?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Domain:</span>
                    <span className="font-mono text-blue-400">{result.business?.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industry:</span>
                    <span className="text-slate-200">{result.business?.businessType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-200">
                      {[result.business?.city, result.business?.postalCode].filter(Boolean).join(" ") || "Not available"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Funnel:</span>
                    <span className="text-emerald-400 font-semibold">
                      {(result.availableLanguages || ["en"]).map((lang: string) => `/${lang}/funnel/${result.funnel?.slug}`).join(" · ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-950/50 border border-cyan-800/70 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-white">Technology · BuiltWith</h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    result.builtWith?.connected ? "bg-emerald-900 text-emerald-200" : "bg-slate-800 text-slate-300"
                  }`}>
                    {result.builtWith?.connected ? "CONNECTED" : result.builtWith?.configured ? "NO RESULTS" : "MISSING API KEY"}
                  </span>
                </div>
                {result.builtWith?.connected ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-cyan-100">
                      {result.builtWith.technologyCount} technologies detected
                      {result.builtWith.primaryPlatform ? ` · Platform: ${result.builtWith.primaryPlatform}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(result.builtWith.technologies || []).slice(0, 10).map((technology: {name:string}) => (
                        <span key={technology.name} className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] px-2 py-1 rounded-lg">
                          {technology.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">
                    Add BUILTWITH_API_KEY to the environment variables to enable deep technology analysis.
                  </p>
                )}
              </div>

              {result.contact && (
                <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-2xl p-6 shadow-2xl space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-emerald-700/60">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white">Email Discovered (Hunter.io)</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Contact:</span>
                      <span className="font-semibold text-white">{result.contact?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Email:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{result.contact?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Confidence:</span>
                      <span className="bg-emerald-900 px-2 py-0.5 rounded text-xs font-bold text-emerald-200">
                        {Math.round(result.contact?.confidenceScore || 0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-300">Role:</span>
                      <span className="text-slate-200">{result.contact?.role}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-950/60 border border-blue-700/80 rounded-2xl p-4 text-xs text-blue-200 flex items-start gap-2">
                <Zap className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <strong>Ready for next steps:</strong>
                  <ul className="mt-1 space-y-1 ml-4 list-disc">
                    <li>Funnel generated ✓</li>
                    <li>CEO email found {result.emailFound ? "✓" : "⏳"}</li>
                    <li>Ready to send pitch and Loom video</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/60 border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Search className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Fill out the form and click &quot;Discover Business&quot;</p>
              <p className="text-slate-500 text-xs mt-2">
                We&apos;ll automatically search Hunter.io for the CEO/Founder&apos;s email
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
