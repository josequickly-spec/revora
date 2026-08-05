import { z } from "zod";

const API_BASE = "https://www.parsehub.com/api/v2";
const tokenSchema = z.string().trim().regex(/^[A-Za-z0-9_-]{8,120}$/);

export const parseHubRunInputSchema = z.object({
  projectToken: tokenSchema.optional(),
  query: z.string().trim().max(500).optional().default(""),
  sendEmail: z.boolean().optional().default(false),
});

export type ParseHubRun = {
  project_token: string;
  run_token: string;
  status: "initialized" | "queued" | "running" | "cancelled" | "complete" | "error";
  data_ready: boolean;
  start_time?: string;
  end_time?: string | null;
  pages?: number;
  md5sum?: string | null;
};

function configuration() {
  const apiKey = process.env.PARSEHUB_API_KEY?.trim();
  if (!apiKey) throw new Error("ParseHub is not configured.");
  return { apiKey, defaultProjectToken: process.env.PARSEHUB_PROJECT_TOKEN?.trim() || "" };
}

async function parseHubRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String((payload as { error: unknown }).error)
      : `ParseHub request failed with status ${response.status}.`;
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function listParseHubProjects() {
  const { apiKey } = configuration();
  const params = new URLSearchParams({ api_key: apiKey, offset: "0", limit: "20", include_options: "1" });
  return parseHubRequest(`/projects?${params}`) as Promise<{ projects: Array<Record<string, unknown>>; total_projects: number }>;
}

export async function startParseHubRun(input: z.infer<typeof parseHubRunInputSchema>) {
  const { apiKey, defaultProjectToken } = configuration();
  const projectToken = tokenSchema.parse(input.projectToken || defaultProjectToken);
  const body = new URLSearchParams({ api_key: apiKey, send_email: input.sendEmail ? "1" : "0" });
  if (input.query) body.set("start_value_override", JSON.stringify({ query: input.query }));
  return parseHubRequest(`/projects/${encodeURIComponent(projectToken)}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    body,
  }) as Promise<ParseHubRun>;
}

export async function getParseHubRun(runToken: string) {
  const { apiKey } = configuration();
  const token = tokenSchema.parse(runToken);
  const params = new URLSearchParams({ api_key: apiKey });
  return parseHubRequest(`/runs/${encodeURIComponent(token)}?${params}`) as Promise<ParseHubRun>;
}

export async function getParseHubRunData(runToken: string) {
  const { apiKey } = configuration();
  const token = tokenSchema.parse(runToken);
  const params = new URLSearchParams({ api_key: apiKey, format: "json" });
  return parseHubRequest(`/runs/${encodeURIComponent(token)}/data?${params}`);
}

function collectArrays(value: unknown, depth = 0): Array<Array<Record<string, unknown>>> {
  if (depth > 4 || !value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    const records = value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)));
    return [records, ...value.flatMap((item) => collectArrays(item, depth + 1))];
  }
  return Object.values(value as Record<string, unknown>).flatMap((item) => collectArrays(item, depth + 1));
}

function firstText(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function normalizeParseHubCandidates(data: unknown) {
  const rows = collectArrays(data).sort((a, b) => b.length - a.length)[0] || [];
  return rows.slice(0, 200).map((row, index) => ({
    sourceId: firstText(row, ["id", "source_id", "place_id"]) || `parsehub-${index + 1}`,
    source: "parsehub",
    name: firstText(row, ["business_name", "company_name", "store_name", "name", "title"]),
    website: firstText(row, ["website", "website_url", "domain", "url", "link"]),
    email: firstText(row, ["email", "public_email", "contact_email"]),
    phone: firstText(row, ["phone", "telephone", "contact_phone"]),
    address: firstText(row, ["address", "full_address", "location"]),
    city: firstText(row, ["city", "locality"]),
    category: firstText(row, ["category", "industry", "business_type", "vertical"]),
    provenance: "ParseHub project output; review before saving or outreach.",
  })).filter((candidate) => candidate.name || candidate.website);
}

export function parseHubReadiness() {
  return {
    ready: Boolean(process.env.PARSEHUB_API_KEY),
    hasDefaultProject: Boolean(process.env.PARSEHUB_PROJECT_TOKEN),
    webhookProtected: Boolean(process.env.PARSEHUB_WEBHOOK_SECRET),
  };
}
