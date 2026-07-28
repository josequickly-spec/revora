"use client";
import React, { useState, useEffect } from "react";
import { Plus, Sparkles, TrendingUp, Mail, Video, Zap, Eye, Users, DollarSign, ArrowRight, CheckCircle2, Clock, AlertCircle, BarChart3, RefreshCw } from "lucide-react";

interface Campaign {
  id: string;
  businessName: string;
  status: "analyzing" | "ready" | "launched" | "live" | "paused";
  createdAt: string;
  revenue: number;
  metrics: {
    landingPageViews: number;
    emailOpens: number;
    conversions: number;
    emailClickRate: number;
  };
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "analytics">("overview");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const response = await fetch("/api/campaigns");
        if (!response.ok) throw new Error("No se pudieron cargar las campañas");

        const data = await response.json();
        setCampaigns(
          (data.campaigns || []).map((campaign: any) => ({
            id: campaign.id,
            businessName: campaign.business_name,
            status: campaign.status,
            createdAt: campaign.created_at,
            revenue: Number(campaign.revenue || 0),
            metrics: {
              landingPageViews: 0,
              emailOpens: 0,
              conversions: 0,
              emailClickRate: 0,
            },
          }))
        );
      } catch (error) {
        console.error("Campaign load error:", error);
      }
    };

    loadCampaigns();
  }, []);

  const handleAnalyze = async () => {
    if (!newBusinessName.trim()) return;

    setIsAnalyzing(true);
    const newCampaign: Campaign = {
      id: `campaign_${Date.now()}`,
      businessName: newBusinessName,
      status: "analyzing",
      createdAt: new Date().toISOString(),
      revenue: 0,
      metrics: {
        landingPageViews: 0,
        emailOpens: 0,
        conversions: 0,
        emailClickRate: 0,
      },
    };

    setCampaigns([newCampaign, ...campaigns]);
    setNewBusinessName("");

    try {
      // Call auto-generate API
      const response = await fetch("/api/campaign-auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: newBusinessName }),
      });

      const data = await response.json();

      if (data.success) {
        // Save to campaigns
        const saveResponse = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newCampaign.id,
            businessName: newBusinessName,
            status: "ready",
            ...data.campaign,
          }),
        });
        if (!saveResponse.ok) {
          throw new Error("La campaña se generó, pero no pudo guardarse");
        }

        // Update UI
        setCampaigns(c =>
          c.map(camp =>
            camp.id === newCampaign.id
              ? {
                  ...camp,
                  status: "ready",
                  metrics: {
                    landingPageViews: 0,
                    emailOpens: 0,
                    conversions: 0,
                    emailClickRate: 0,
                  },
                }
              : camp
          )
        );
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setCampaigns(c => c.filter(camp => camp.id !== newCampaign.id));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const launchCampaign = async (campaignId: string) => {
    try {
      // Call execute API
      const response = await fetch("/api/campaign-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          action: "launch",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update campaign status and start simulating metrics
        setCampaigns(c =>
          c.map(camp =>
            camp.id === campaignId
              ? {
                  ...camp,
                  status: "launched",
                  revenue: 0,
                }
              : camp
          )
        );

        // Start polling for metrics every 5 seconds
        const metricsInterval = setInterval(async () => {
          const metricsResponse = await fetch(
            `/api/campaign-execute?campaignId=${campaignId}`
          );
          const metricsData = await metricsResponse.json();

          if (metricsData.success && metricsData.metrics) {
            setCampaigns(c =>
              c.map(camp =>
                camp.id === campaignId
                  ? {
                      ...camp,
                      metrics: {
                        landingPageViews:
                          metricsData.metrics.landingPageMetrics.views,
                        emailOpens: metricsData.metrics.emailMetrics.opened,
                        conversions:
                          metricsData.metrics.conversionMetrics.total,
                        emailClickRate:
                          metricsData.metrics.emailMetrics.clickRate,
                      },
                      revenue:
                        metricsData.metrics.conversionMetrics.revenue,
                    }
                  : camp
              )
            );
          }
        }, 5000);

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(metricsInterval), 300000);
      }
    } catch (error) {
      console.error("Launch error:", error);
    }
  };

  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const liveCampaigns = campaigns.filter(c => c.status === "live" || c.status === "launched").length;
  const totalLeads = campaigns.reduce((sum, c) => sum + c.metrics.emailOpens, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-purple-600 to-rose-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-white">Revora Pro</h1>
              <p className="text-xs text-slate-400">Sistema Automático de Análisis y Campañas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 px-3 py-1.5 rounded-lg font-semibold">
              {liveCampaigns} Campañas Activas
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* NEW CAMPAIGN SECTION */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-2xl font-black text-white mb-4">Analizar Nuevo Negocio</h2>
          <p className="text-sm text-slate-300 mb-6 max-w-2xl">
            Coloca el nombre del negocio y REVORA generará automáticamente un análisis completo, funnel de ventas, estrategia de emails, análisis SEO y proyecciones de ROI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Ej: Nike, Restaurant Milano, Gimnasio Fitness..."
              value={newBusinessName}
              onChange={(e) => setNewBusinessName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
              disabled={isAnalyzing}
              className="flex-1 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !newBusinessName.trim()}
              className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap transition"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isAnalyzing ? "Analizando..." : "Analizar"}
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">Campañas Totales</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{campaigns.length}</div>
            <div className="text-xs text-slate-500 mt-2">
              {campaigns.filter(c => c.status === "analyzing").length} analizando
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">Campañas Activas</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{liveCampaigns}</div>
            <div className="text-xs text-slate-500 mt-2">{campaigns.filter(c => c.status === "ready").length} listas</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">Leads Generados</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalLeads}</div>
            <div className="text-xs text-slate-500 mt-2">Emails abiertos este mes</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-semibold">Ingresos Totales</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">€{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2">Comisiones recibidas</div>
          </div>
        </div>

        {/* CAMPAIGNS LIST */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-white">Mis Campañas</h2>

          {campaigns.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <Plus className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-slate-400">No hay campañas aún. Crea una para comenzar.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition cursor-pointer"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-white text-lg">{campaign.businessName}</h3>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          campaign.status === "analyzing"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : campaign.status === "ready"
                            ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                            : campaign.status === "launched" || campaign.status === "live"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {campaign.status === "analyzing" && "⏳ Analizando"}
                        {campaign.status === "ready" && "✓ Listo"}
                        {campaign.status === "launched" && "🚀 Lanzado"}
                        {campaign.status === "live" && "📈 En Vivo"}
                        {campaign.status === "paused" && "⏸ Pausado"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Creado: {new Date(campaign.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4 md:gap-6">
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{campaign.metrics.landingPageViews}</div>
                      <div className="text-xs text-slate-400">Visitas LP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{campaign.metrics.emailOpens}</div>
                      <div className="text-xs text-slate-400">Emails</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-emerald-400">{campaign.metrics.conversions}</div>
                      <div className="text-xs text-slate-400">Conversiones</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-amber-400">€{campaign.revenue.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Ingresos</div>
                    </div>
                  </div>

                  {campaign.status === "ready" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        launchCampaign(campaign.id);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap"
                    >
                      <Zap className="w-4 h-4" />
                      Lanzar
                    </button>
                  )}

                  {(campaign.status === "launched" || campaign.status === "live") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(campaign);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* CAMPAIGN DETAIL MODAL */}
        {selectedCampaign && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <h3 className="font-black text-xl text-white">{selectedCampaign.businessName}</h3>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Package Sections */}
                <div className="space-y-3">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <h4 className="font-bold text-white">Análisis Competitivo & SEO</h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      Análisis profundo de SEO, benchmarking con competidores, keywords, oportunidades de mejora y roadmap de 90 días.
                    </p>
                    <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                      Ver Reporte →
                    </button>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h4 className="font-bold text-white">Funnel de Ventas</h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      Landing page optimizada, secuencia de emails, video script y colores adaptados al negocio.
                    </p>
                    <button className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
                      Ver Landing Page →
                    </button>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-rose-400" />
                      <h4 className="font-bold text-white">Estrategia de Outreach</h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      Email secuencia personalizada, video script profesional y timing de follow-ups optimizado.
                    </p>
                    <button className="mt-3 text-xs text-rose-400 hover:text-rose-300 font-semibold">
                      Ver Emails →
                    </button>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <h4 className="font-bold text-white">Proyecciones & ROI</h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      Plan de 90 días, proyecciones de revenue, análisis de ROI y recomendaciones de escalado.
                    </p>
                    <button className="mt-3 text-xs text-green-400 hover:text-green-300 font-semibold">
                      Ver Projecciones →
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
