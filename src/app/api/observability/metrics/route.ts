import { readFile } from "node:fs/promises";
import { renderPrometheus } from "@/lib/observability/metrics";

async function metricsToken() {
  const tokenFile = process.env.METRICS_BEARER_TOKEN_FILE;
  if (tokenFile) {
    try {
      return (await readFile(tokenFile, "utf8")).trim();
    } catch {
      return "";
    }
  }
  return process.env.METRICS_BEARER_TOKEN || "";
}

export async function GET(request: Request) {
  const token = await metricsToken();
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) {
    return new Response("Unauthorized\n", { status: 401, headers: { "Content-Type": "text/plain" } });
  }
  return new Response(renderPrometheus(), {
    headers: { "Content-Type": "text/plain; version=0.0.4", "Cache-Control": "no-store" },
  });
}
