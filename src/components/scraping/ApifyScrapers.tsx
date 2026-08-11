"use client";

import { useState } from "react";
import {
  MapPin,
  Briefcase,
  Megaphone,
  Camera,
  Globe,
  Users,
  Star,
  AlertCircle,
  Zap,
  Plus,
  X,
  Music,
  Mail,
  Search,
  ThumbsUp,
  Target,
  AtSign,
  MessageSquare,
  BarChart3,
  PlayCircle,
  Bird,
} from "lucide-react";
import ScrapingJobMonitor from "./ScrapingJobMonitor";

function useApifyJob() {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const start = async (type: string, params: Record<string, any>) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/scrapling/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, params }),
      });
      const data = await res.json();
      if (data.success) {
        setJobId(data.job.id);
      } else {
        setError(data.error || "Failed to start");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setLoading(false);
    }
  };

  const reset = () => {
    setJobId(null);
    setCompleted(false);
    setLoading(false);
  };

  return { loading, jobId, error, completed, setCompleted, setLoading, setError, setJobId, start, reset };
}

function JobMonitorBlock({ jobId, onComplete, onError, completed, resetLabel, onReset }: {
  jobId: string;
  onComplete: (r: any) => void;
  onError: (e: string) => void;
  completed: boolean;
  resetLabel: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3">
      <ScrapingJobMonitor
        jobId={jobId}
        autoClose={false}
        onComplete={onComplete}
        onError={onError}
      />
      {completed && (
        <button
          onClick={onReset}
          className="w-full rounded-lg border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-bold text-slate-400 transition hover:bg-white/[.07] hover:text-white"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-300/20 bg-red-300/[.07] p-3 text-xs text-red-200">
      <AlertCircle className="size-4 shrink-0" />
      {error}
    </div>
  );
}

// ── Google Maps Lead Finder ──────────────────────────────
export function GoogleMapsLeadsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState(20);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !location.trim()) { job.setError("Enter keyword and location"); return; }
    job.start("apify-google-maps-leads", { keyword, location, limit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock
        jobId={job.jobId}
        onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }}
        onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }}
        completed={job.completed}
        resetLabel="Search Again"
        onReset={job.reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-red-400">
        <MapPin className="size-4" />
        Google Maps Lead Finder
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., restaurant, plumber, salon" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Miami, FL" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-400 focus:outline-none" />
      </div>
      <div className="flex gap-3 items-end">
        <div className="w-24">
          <label className="text-[10px] text-slate-500 block mb-1">Limit</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.min(100, Math.max(1, +e.target.value)))} min="1" max="100" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-red-400 focus:outline-none" />
        </div>
        <button type="submit" disabled={job.loading} className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-400 disabled:opacity-50">
          {job.loading ? "Starting..." : "Find Leads"}
        </button>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Real Google Maps data: business name, email, phone, reviews, social links, location.</p>
    </form>
  );
}

// ── LinkedIn Company Intel ───────────────────────────────
export function LinkedInCompanyComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [urls, setUrls] = useState<string[]>([""]);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = urls.filter((u) => u.trim());
    if (!valid.length) { job.setError("Enter at least one LinkedIn company URL"); return; }
    job.start("apify-linkedin-companies", { urls: valid });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock
        jobId={job.jobId}
        onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }}
        onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }}
        completed={job.completed}
        resetLabel="Search Other Companies"
        onReset={job.reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-400">
        <Briefcase className="size-4" />
        LinkedIn Company Intelligence
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input value={url} onChange={(e) => { const n = [...urls]; n[i] = e.target.value; setUrls(n); }} placeholder="https://linkedin.com/company/example" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-400 focus:outline-none" />
            {urls.length > 1 && (
              <button type="button" onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]">
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setUrls([...urls, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white">
          <Plus className="size-4 inline mr-1" />Add Company
        </button>
      </div>
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-400 disabled:opacity-50">
        {job.loading ? "Starting..." : "Get Company Intel"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">No cookies needed. Extracts: industry, size, employees, website, specialties.</p>
    </form>
  );
}

// ── Facebook Ads Spy ─────────────────────────────────────
export function FacebookAdsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [limit, setLimit] = useState(30);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { job.setError("Enter a search query or page name"); return; }
    job.start("apify-facebook-ads", { query, country, limit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock
        jobId={job.jobId}
        onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }}
        onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }}
        completed={job.completed}
        resetLabel="Spy on More Ads"
        onReset={job.reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-indigo-400">
        <Megaphone className="size-4" />
        Facebook Ads Spy
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Brand name, keyword, or page name" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none" />
      <div className="flex gap-3">
        <div className="w-28">
          <label className="text-[10px] text-slate-500 block mb-1">Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none">
            <option value="US">US</option>
            <option value="GB">UK</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="MX">Mexico</option>
            <option value="ES">Spain</option>
            <option value="ALL">All</option>
          </select>
        </div>
        <div className="w-20">
          <label className="text-[10px] text-slate-500 block mb-1">Limit</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.min(100, Math.max(1, +e.target.value)))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none" />
        </div>
        <div className="flex-1 flex items-end">
          <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-black text-white transition hover:bg-indigo-400 disabled:opacity-50">
            {job.loading ? "Starting..." : "Spy Ads"}
          </button>
        </div>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Scrapes Facebook Ad Library: ad copy, creatives, headlines, spend, platforms, dates.</p>
    </form>
  );
}

// ── Instagram Profile Intel ──────────────────────────────
export function InstagramProfileComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [usernames, setUsernames] = useState<string[]>([""]);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = usernames.filter((u) => u.trim()).map((u) => u.replace("@", ""));
    if (!valid.length) { job.setError("Enter at least one Instagram username"); return; }
    job.start("apify-instagram-profiles", { usernames: valid });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock
        jobId={job.jobId}
        onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }}
        onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }}
        completed={job.completed}
        resetLabel="Analyze Other Profiles"
        onReset={job.reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-pink-400">
        <Camera className="size-4" />
        Instagram Profile Intel
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {usernames.map((u, i) => (
          <div key={i} className="flex gap-2">
            <input value={u} onChange={(e) => { const n = [...usernames]; n[i] = e.target.value; setUsernames(n); }} placeholder="@username" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-pink-400 focus:outline-none" />
            {usernames.length > 1 && (
              <button type="button" onClick={() => setUsernames(usernames.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]">
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setUsernames([...usernames, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white">
          <Plus className="size-4 inline mr-1" />Add Profile
        </button>
      </div>
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-pink-500 px-4 py-2 text-sm font-black text-white transition hover:bg-pink-400 disabled:opacity-50">
        {job.loading ? "Starting..." : "Analyze Profiles"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Followers, bio, engagement rate, business category, email, phone, recent posts.</p>
    </form>
  );
}

// ── Website Contact Scraper ──────────────────────────────
export function ContactScraperComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [domain, setDomain] = useState("");
  const [maxPages, setMaxPages] = useState(20);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) { job.setError("Enter a domain"); return; }
    job.start("apify-contact-scraper", { domain, maxPages });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock
        jobId={job.jobId}
        onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }}
        onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }}
        completed={job.completed}
        resetLabel="Scrape Another Site"
        onReset={job.reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-teal-400">
        <Globe className="size-4" />
        Website Contact Scraper
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="flex gap-3">
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none" />
        <div className="w-24">
          <input type="number" value={maxPages} onChange={(e) => setMaxPages(Math.min(100, Math.max(1, +e.target.value)))} min="1" max="100" placeholder="Pages" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none" />
        </div>
      </div>
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-teal-500 px-4 py-2 text-sm font-black text-white transition hover:bg-teal-400 disabled:opacity-50">
        {job.loading ? "Starting..." : "Extract Contacts"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Crawls website pages to find emails, phones, LinkedIn, Twitter, Instagram, Facebook, YouTube.</p>
    </form>
  );
}

// ── Social Media Lead Analyzer ───────────────────────────
export function SocialLeadsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [domain, setDomain] = useState("");
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) { job.setError("Enter a domain or URL"); return; }
    job.start("apify-social-leads", { domain });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock
        jobId={job.jobId}
        onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }}
        onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }}
        completed={job.completed}
        resetLabel="Analyze Another Site"
        onReset={job.reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-amber-400">
        <Users className="size-4" />
        Social Media Lead Analyzer
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none" />
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50">
        {job.loading ? "Starting..." : "Analyze Social Leads"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Extracts emails, phones, and social profiles from 8 platforms in one sweep.</p>
    </form>
  );
}

// ── TikTok Profile Scraper ──────────────────────────────
export function TikTokProfileComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [usernames, setUsernames] = useState<string[]>([""]);
  const [postsLimit, setPostsLimit] = useState(12);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = usernames.filter((u) => u.trim());
    if (!valid.length) { job.setError("Enter at least one TikTok username"); return; }
    job.start("apify-tiktok-profiles", { usernames: valid, postsLimit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Analyze Other Profiles" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-400">
        <Music className="size-4" />
        TikTok Profile Scraper
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {usernames.map((u, i) => (
          <div key={i} className="flex gap-2">
            <input value={u} onChange={(e) => { const n = [...usernames]; n[i] = e.target.value; setUsernames(n); }} placeholder="@username" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none" />
            {usernames.length > 1 && (
              <button type="button" onClick={() => setUsernames(usernames.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]"><X className="size-4" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setUsernames([...usernames, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white"><Plus className="size-4 inline mr-1" />Add Username</button>
      </div>
      <div className="flex gap-3 items-end">
        <div className="w-24">
          <label className="text-[10px] text-slate-500 block mb-1">Posts</label>
          <input type="number" value={postsLimit} onChange={(e) => setPostsLimit(Math.min(50, Math.max(1, +e.target.value)))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none" />
        </div>
        <button type="submit" disabled={job.loading} className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-white transition hover:bg-cyan-400 disabled:opacity-50">
          {job.loading ? "Starting..." : "Analyze TikTok"}
        </button>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Followers, bio, engagement, recent videos with views/likes/comments.</p>
    </form>
  );
}

// ── LinkedIn Email Finder ──────────────────────────────
export function LinkedInEmailComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [urls, setUrls] = useState<string[]>([""]);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = urls.filter((u) => u.trim());
    if (!valid.length) { job.setError("Enter at least one LinkedIn profile URL"); return; }
    job.start("apify-linkedin-emails", { urls: valid });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Find More Emails" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-emerald-400">
        <Mail className="size-4" />
        LinkedIn Email Finder
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input value={url} onChange={(e) => { const n = [...urls]; n[i] = e.target.value; setUrls(n); }} placeholder="https://linkedin.com/in/john-doe" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none" />
            {urls.length > 1 && (
              <button type="button" onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]"><X className="size-4" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setUrls([...urls, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white"><Plus className="size-4 inline mr-1" />Add Profile URL</button>
      </div>
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-400 disabled:opacity-50">
        {job.loading ? "Starting..." : "Find Emails"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">No cookies needed. Finds work & personal emails from 300M+ database.</p>
    </form>
  );
}

// ── LinkedIn People Search ──────────────────────────────
export function LinkedInPeopleComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [names, setNames] = useState<string[]>([""]);
  const [limit, setLimit] = useState(5);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = names.filter((n) => n.trim());
    if (!valid.length) { job.setError("Enter at least one person name"); return; }
    job.start("apify-linkedin-people-search", { names: valid, limit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Search More People" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-300">
        <Search className="size-4" />
        LinkedIn People Search
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {names.map((name, i) => (
          <div key={i} className="flex gap-2">
            <input value={name} onChange={(e) => { const n = [...names]; n[i] = e.target.value; setNames(n); }} placeholder="John Doe, CEO of..." className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-300 focus:outline-none" />
            {names.length > 1 && (
              <button type="button" onClick={() => setNames(names.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]"><X className="size-4" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setNames([...names, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white"><Plus className="size-4 inline mr-1" />Add Name</button>
      </div>
      <div className="flex gap-3 items-end">
        <div className="w-24">
          <label className="text-[10px] text-slate-500 block mb-1">Results/name</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.min(20, Math.max(1, +e.target.value)))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-blue-300 focus:outline-none" />
        </div>
        <button type="submit" disabled={job.loading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
          {job.loading ? "Starting..." : "Search People"}
        </button>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Find decision-makers by name — get headline, company, location, LinkedIn URL.</p>
    </form>
  );
}

// ── Facebook Page Details ──────────────────────────────
export function FacebookPageDetailsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [urls, setUrls] = useState<string[]>([""]);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = urls.filter((u) => u.trim());
    if (!valid.length) { job.setError("Enter at least one Facebook page URL"); return; }
    job.start("apify-facebook-page-details", { urls: valid });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Scrape Other Pages" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-blue-500">
        <ThumbsUp className="size-4" />
        Facebook Page Details
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input value={url} onChange={(e) => { const n = [...urls]; n[i] = e.target.value; setUrls(n); }} placeholder="https://facebook.com/pagename" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
            {urls.length > 1 && (
              <button type="button" onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]"><X className="size-4" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setUrls([...urls, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white"><Plus className="size-4 inline mr-1" />Add Page</button>
      </div>
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50">
        {job.loading ? "Starting..." : "Get Page Details"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Email, phone, website, hours, reviews, likes, followers from FB pages.</p>
    </form>
  );
}

// ── Facebook Ad Leads ──────────────────────────────────
export function FacebookAdLeadsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [limit, setLimit] = useState(30);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { job.setError("Enter a search keyword"); return; }
    job.start("apify-facebook-ad-leads", { query, country, limit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Find More Leads" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-violet-400">
        <Target className="size-4" />
        Facebook Ad Leads
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Keyword, niche, or industry" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none" />
      <div className="flex gap-3">
        <div className="w-28">
          <label className="text-[10px] text-slate-500 block mb-1">Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none">
            <option value="US">US</option><option value="GB">UK</option><option value="CA">Canada</option><option value="AU">Australia</option><option value="MX">Mexico</option><option value="ES">Spain</option><option value="ALL">All</option>
          </select>
        </div>
        <div className="w-20">
          <label className="text-[10px] text-slate-500 block mb-1">Limit</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.min(100, Math.max(1, +e.target.value)))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none" />
        </div>
        <div className="flex-1 flex items-end">
          <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-violet-500 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-400 disabled:opacity-50">
            {job.loading ? "Starting..." : "Find Ad Leads"}
          </button>
        </div>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Extract businesses running FB ads: email, phone, website, social links.</p>
    </form>
  );
}

// ── All Social Media Email Scraper ──────────────────────
export function AllSocialEmailsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState("all");
  const [limit, setLimit] = useState(50);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) { job.setError("Enter a keyword"); return; }
    job.start("apify-all-social-emails", { keyword, platform, limit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Search More Emails" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-orange-400">
        <AtSign className="size-4" />
        All Social Media Email Scraper
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword or niche (e.g., fitness coach)" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-400 focus:outline-none" />
      <div className="flex gap-3">
        <div className="w-32">
          <label className="text-[10px] text-slate-500 block mb-1">Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none">
            <option value="all">All Platforms</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option><option value="linkedin">LinkedIn</option><option value="twitter">Twitter</option><option value="reddit">Reddit</option><option value="pinterest">Pinterest</option>
          </select>
        </div>
        <div className="w-20">
          <label className="text-[10px] text-slate-500 block mb-1">Limit</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.min(200, Math.max(1, +e.target.value)))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none" />
        </div>
        <div className="flex-1 flex items-end">
          <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-400 disabled:opacity-50">
            {job.loading ? "Starting..." : "Find Emails"}
          </button>
        </div>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Extract emails from IG, TikTok, YouTube, LinkedIn, Twitter, Reddit, Pinterest.</p>
    </form>
  );
}

// ── Trustpilot Reviews ──────────────────────────────────
export function TrustpilotReviewsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [domain, setDomain] = useState("");
  const [limit, setLimit] = useState(50);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) { job.setError("Enter a domain or Trustpilot URL"); return; }
    const isUrl = domain.startsWith("http");
    job.start("apify-trustpilot-reviews", isUrl ? { urls: [domain], limit } : { domain, limit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Scrape Other Reviews" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-green-400">
        <MessageSquare className="size-4" />
        Trustpilot Reviews
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com or Trustpilot URL" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-green-400 focus:outline-none" />
      <div className="flex gap-3 items-end">
        <div className="w-24">
          <label className="text-[10px] text-slate-500 block mb-1">Max reviews</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.min(500, Math.max(1, +e.target.value)))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none" />
        </div>
        <button type="submit" disabled={job.loading} className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-black text-white transition hover:bg-green-400 disabled:opacity-50">
          {job.loading ? "Starting..." : "Get Reviews"}
        </button>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Ratings, review text, dates, verified status. Perfect for reputation intel.</p>
    </form>
  );
}

// ── SimilarWeb Analytics ────────────────────────────────
export function SimilarWebComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [domain, setDomain] = useState("");
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) { job.setError("Enter a domain"); return; }
    job.start("apify-similarweb", { domain });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Analyze Another Site" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-sky-400">
        <BarChart3 className="size-4" />
        SimilarWeb Traffic Analytics
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none" />
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-400 disabled:opacity-50">
        {job.loading ? "Starting..." : "Get Traffic Data"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Monthly visits, rankings, bounce rate, traffic sources, top countries.</p>
    </form>
  );
}

// ── YouTube Channel Scraper ─────────────────────────────
export function YouTubeChannelComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [urls, setUrls] = useState<string[]>([""]);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = urls.filter((u) => u.trim());
    if (!valid.length) { job.setError("Enter at least one YouTube channel URL"); return; }
    job.start("apify-youtube-channels", { urls: valid });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Scrape Other Channels" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-red-500">
        <PlayCircle className="size-4" />
        YouTube Channel Scraper
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input value={url} onChange={(e) => { const n = [...urls]; n[i] = e.target.value; setUrls(n); }} placeholder="https://youtube.com/@channel or channel URL" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none" />
            {urls.length > 1 && (
              <button type="button" onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]"><X className="size-4" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setUrls([...urls, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white"><Plus className="size-4 inline mr-1" />Add Channel</button>
      </div>
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white transition hover:bg-red-500 disabled:opacity-50">
        {job.loading ? "Starting..." : "Scrape Channels"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Email, social links, subscribers, views, country. For influencer outreach.</p>
    </form>
  );
}

// ── Twitter/X Profile Scraper ───────────────────────────
export function TwitterProfileComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [usernames, setUsernames] = useState<string[]>([""]);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = usernames.filter((u) => u.trim());
    if (!valid.length) { job.setError("Enter at least one X/Twitter username"); return; }
    job.start("apify-twitter-profiles", { usernames: valid });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock jobId={job.jobId} onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }} onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }} completed={job.completed} resetLabel="Search Other Profiles" onReset={job.reset} />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-300">
        <Bird className="size-4" />
        Twitter/X Profile Scraper
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <div className="space-y-2">
        {usernames.map((u, i) => (
          <div key={i} className="flex gap-2">
            <input value={u} onChange={(e) => { const n = [...usernames]; n[i] = e.target.value; setUsernames(n); }} placeholder="@username" className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-slate-300 focus:outline-none" />
            {usernames.length > 1 && (
              <button type="button" onClick={() => setUsernames(usernames.filter((_, j) => j !== i))} className="rounded-lg border border-red-300/20 bg-red-300/[.07] p-2 text-red-300 hover:bg-red-300/[.12]"><X className="size-4" /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setUsernames([...usernames, ""])} className="w-full rounded-lg border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 hover:border-white/20 hover:text-white"><Plus className="size-4 inline mr-1" />Add Username</button>
      </div>
      <button type="submit" disabled={job.loading} className="w-full rounded-lg bg-slate-600 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-500 disabled:opacity-50">
        {job.loading ? "Starting..." : "Analyze Profiles"}
      </button>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Bio, followers, tweets, engagement, location, website, verification status.</p>
    </form>
  );
}

// ── Google Maps Reviews ──────────────────────────────────
export function GoogleMapsReviewsComponent({ onResults }: { onResults?: (r: any) => void }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(50);
  const job = useApifyJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { job.setError("Enter a business name or Google Maps URL"); return; }
    const isUrl = query.startsWith("http");
    job.start("apify-google-maps-reviews", isUrl ? { placeUrl: query, limit } : { query, limit });
  };

  if (job.jobId) {
    return (
      <JobMonitorBlock
        jobId={job.jobId}
        onComplete={(r) => { job.setLoading(false); job.setCompleted(true); onResults?.(r); }}
        onError={(e) => { job.setError(e); job.setLoading(false); job.setJobId(null); }}
        completed={job.completed}
        resetLabel="Scrape Other Reviews"
        onReset={job.reset}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-yellow-400">
        <Star className="size-4" />
        Google Maps Reviews
        <span className="ml-auto rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] text-amber-300">APIFY</span>
      </div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Business name or Google Maps URL" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none" />
      <div className="flex gap-3 items-end">
        <div className="w-24">
          <label className="text-[10px] text-slate-500 block mb-1">Max reviews</label>
          <input type="number" value={limit} onChange={(e) => setLimit(Math.min(500, Math.max(1, +e.target.value)))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none" />
        </div>
        <button type="submit" disabled={job.loading} className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-yellow-400 disabled:opacity-50">
          {job.loading ? "Starting..." : "Get Reviews"}
        </button>
      </div>
      <ErrorBox error={job.error} />
      <p className="text-[10px] text-slate-500">Full review data: ratings, text, dates, owner responses. Perfect for reputation analysis.</p>
    </form>
  );
}
