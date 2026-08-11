"use client";
import React, { useState } from "react";
import { MapPin, Search, Loader, AlertCircle, Globe, CheckCircle2 } from "lucide-react";

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  zipcode: string;
  phone?: string;
  website?: string;
  rating?: number;
  employees?: number;
  annualRevenue?: number;
  email?: string;
}

export function LocalBusinessFinder({
  onDiscovered,
}: {
  onDiscovered?: (businessId: number) => void | Promise<void>;
}) {
  const [searchType, setSearchType] = useState("city");
  const [searchValue, setSearchValue] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [languageMode, setLanguageMode] = useState<"es" | "en" | "bilingual">("en");

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError("Enter a city, ZIP, address, or search query");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params: Record<string, string> = { [searchType]: searchValue };
      if (category) params.category = category;

      const res = await fetch("/api/local-businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (data.success) {
        setBusinesses(data.businesses);
      } else {
        setError(data.error || "The search failed");
        setBusinesses([]);
      }
    } catch (err) {
      setError("Could not connect to the search service");
    } finally {
      setLoading(false);
    }
  };

  const discoverBusiness = async (biz: Business) => {
    if (!biz.website) {
      setError(`"${biz.name}" doesn't have a public website in OpenStreetMap. Look up its domain and use Auto-Discovery.`);
      return;
    }
    setDiscoveringId(biz.id);
    setSuccessId(null);
    setError("");
    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: biz.name,
          domain: biz.website,
          city: biz.city,
          zipcode: biz.zipcode,
          industryType: "general",
          businessCategory: category || biz.category,
          languageMode,
          createFunnel: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not add the business");
      setSuccessId(biz.id);
      await onDiscovered?.(Number(data.business.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run Discovery");
    } finally {
      setDiscoveringId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border border-blue-800/40 rounded-2xl p-8 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <MapPin className="w-8 h-8 text-blue-400 shrink-0" />
          <div>
            <h3 className="text-2xl font-black text-white mb-1">Find real businesses</h3>
            <p className="text-sm text-slate-300">Search by ZIP, city, address, or a free-form query</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["zipcode", "city", "address", "query"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSearchType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  searchType === type
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {type === "zipcode" ? "ZIP" : type === "city" ? "City" : type === "address" ? "Address" : "Free-form search"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={searchType === "zipcode" ? "e.g. 33101" : searchType === "city" ? "e.g. Miami" : "Enter the location..."}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3"
            />
            <input
              type="text"
              placeholder="Category: restaurant, auto shop, cleaning..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3"
            />
          </div>

          <select
            value={languageMode}
            onChange={(e) => setLanguageMode(e.target.value as "es" | "en" | "bilingual")}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3"
          >
            <option value="en">English only</option>
            <option value="bilingual">Bilingual funnel — Spanish + English</option>
            <option value="es">Spanish only</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Find businesses
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-950/60 border border-red-700/80 rounded-xl p-3 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}
        </form>
      </div>

      {searched && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            {businesses.length > 0 ? `${businesses.length} businesses found` : "No results"}
          </h3>

          {businesses.length > 0 ? (
            <div className="grid gap-4">
              {businesses.map((biz) => (
                <div key={biz.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white">{biz.name}</h4>
                      <p className="text-sm text-blue-400">{biz.category}</p>
                    </div>
                    {biz.rating && <p className="text-2xl font-bold text-yellow-400">{biz.rating}</p>}
                  </div>

                  <p className="text-sm text-slate-300 mb-4">
                    <MapPin className="w-4 h-4 inline mr-2 text-blue-400" />
                    {biz.address}, {biz.city} {biz.zipcode}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-950/50 rounded-xl p-3">
                    {biz.employees && (
                      <div className="text-center">
                        <p className="font-bold text-white">{biz.employees}</p>
                        <p className="text-xs text-slate-400">Employees</p>
                      </div>
                    )}
                    {biz.annualRevenue && (
                      <div className="text-center">
                        <p className="font-bold text-green-400">${(biz.annualRevenue / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-slate-400">Annual</p>
                      </div>
                    )}
                    {biz.website && (
                      <div className="text-center">
                        <p className="text-xs text-blue-400 font-semibold">{biz.website}</p>
                        <p className="text-xs text-slate-400">Website</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => discoverBusiness(biz)}
                    disabled={!biz.website || discoveringId === biz.id}
                    className="w-full bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    {discoveringId === biz.id ? <><Loader className="w-4 h-4 animate-spin"/>Analyzing...</> :
                     successId === biz.id ? <><CheckCircle2 className="w-4 h-4"/>Business added</> :
                     biz.website ? <><Globe className="w-4 h-4"/>Analyze and create funnel</> : "No public website"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/60 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center">
              <p className="text-slate-400">No businesses found with that data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
