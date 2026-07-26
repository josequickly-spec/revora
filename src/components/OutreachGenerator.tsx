"use client";
import React, { useState } from "react";
import { Mail, Video, AlertCircle, Loader, Send, Check } from "lucide-react";

interface OutreachData {
  emailSequence: Array<{
    subject: string;
    body: string;
    delay: number;
    index: number;
  }>;
  videoPitch: {
    title: string;
    script: string;
    duration: string;
    cta: string;
  };
  followUpTiming: Record<string, string>;
}

export function OutreachGenerator({
  contactName,
  businessName,
  offerHeadline,
  painPoint,
  bonusOffer,
}: {
  contactName: string;
  businessName: string;
  offerHeadline: string;
  painPoint: string;
  bonusOffer: string;
}) {
  const [generating, setGenerating] = useState(false);
  const [outreach, setOutreach] = useState<OutreachData | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"emails" | "video" | "timing">(
    "emails"
  );

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          businessName,
          offerHeadline,
          painPoint,
          bonusOffer,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOutreach(data.outreach);
      } else {
        setError(data.error || "Error generando outreach");
      }
    } catch (err) {
      setError("Error conectando a la API");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (!outreach) {
    return (
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-orange-950 border border-rose-800/40 rounded-2xl p-8 shadow-xl space-y-4">
        <div className="flex items-start gap-4">
          <Mail className="w-8 h-8 text-rose-400 shrink-0" />
          <div className="flex-1">
            <h3 className="text-2xl font-black text-white mb-1">
              Generar Outreach Automático
            </h3>
            <p className="text-sm text-slate-300">
              IA genera secuencia de emails + video pitch + timing optimizado
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-rose-600 to-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Generar Secuencia de Outreach
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-950/60 border border-red-700/80 rounded-xl p-3 flex gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("emails")}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === "emails"
              ? "border-rose-500 text-rose-400"
              : "border-transparent text-slate-400"
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />3 Emails
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === "video"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-slate-400"
          }`}
        >
          <Video className="w-4 h-4 inline mr-2" />Video Pitch
        </button>
        <button
          onClick={() => setActiveTab("timing")}
          className={`px-4 py-2 font-semibold border-b-2 transition ${
            activeTab === "timing"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400"
          }`}
        >
          Timing
        </button>
      </div>

      {activeTab === "emails" && (
        <div className="space-y-3">
          {outreach.emailSequence.map((email) => (
            <div
              key={email.index}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 font-semibold">
                    EMAIL {email.index}
                  </p>
                  <p className="font-bold text-white mt-1">
                    Día {email.delay}: {email.subject}
                  </p>
                </div>
                <Send className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-sm text-slate-300">{email.body}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "video" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-white text-lg">
            {outreach.videoPitch.title}
          </h3>
          <div className="bg-slate-950/60 rounded-xl p-4 space-y-2">
            <p className="text-xs text-slate-400 font-semibold">GUION</p>
            <p className="text-sm text-slate-200">{outreach.videoPitch.script}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-950/60 rounded-xl p-3">
              <p className="text-xs text-orange-300 font-semibold">DURACION</p>
              <p className="text-lg font-bold text-orange-400 mt-1">
                {outreach.videoPitch.duration}
              </p>
            </div>
            <div className="bg-rose-950/60 rounded-xl p-3">
              <p className="text-xs text-rose-300 font-semibold">CTA</p>
              <p className="text-sm font-bold text-rose-400 mt-1">
                {outreach.videoPitch.cta}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "timing" && (
        <div className="space-y-3">
          {Object.entries(outreach.followUpTiming).map(([key, time]) => (
            <div
              key={key}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center"
            >
              <p className="font-semibold text-white capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </p>
              <p className="text-amber-400 font-bold">{time}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setOutreach(null)}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition"
      >
        Generar Otra Secuencia
      </button>
    </div>
  );
}
