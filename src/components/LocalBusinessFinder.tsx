"use client";
import React, { useState } from "react";
import { MapPin, Search, Loader, AlertCircle, Globe, Users, DollarSign } from "lucide-react";

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

export function LocalBusinessFinder() {
  const [searchType, setSearchType] = useState("city");
  const [searchValue, setSearchValue] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError("Enter a search value");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = { [searchType]: searchValue };
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
        setError(data.error || "Search failed");
        setBusinesses([]);
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border border-blue-800/40 rounded-2xl p-8 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <MapPin className="w-8 h-8 text-blue-400 shrink-0" />
          <div>
            <h3 className="text-2xl font-black text-white mb-1">Local Business Finder</h3>
            <p className="text-sm text-slate-300">Search businesses by ZIP code, city, or address</p>
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
                {type === "zipcode" ? "ZIP" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Enter search value..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3"
            />
            <input
              type="text"
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3"
            />
          </div>

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
                Find Local Businesses
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
            {businesses.length > 0 ? `Found ${businesses.length} Businesses` : "No results"}
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

                  <button className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg">
                    Run Revora Discovery
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/60 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center">
              <p className="text-slate-400">No businesses found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
