const APIFY_BASE = "https://api.apify.com/v2";

function getToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN environment variable is not set");
  return token;
}

export interface ApifyRunResult {
  id: string;
  status: string;
  datasetId?: string;
  items: any[];
}

export async function runActorSync(
  actorId: string,
  input: Record<string, any>,
  timeoutSecs = 120
): Promise<ApifyRunResult> {
  const token = getToken();

  const res = await fetch(
    `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSecs}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify actor ${actorId} failed (${res.status}): ${text}`);
  }

  const items = await res.json();
  return {
    id: actorId,
    status: "SUCCEEDED",
    items: Array.isArray(items) ? items : [],
  };
}

export async function startActorRun(
  actorId: string,
  input: Record<string, any>
): Promise<{ runId: string; datasetId: string }> {
  const token = getToken();

  const res = await fetch(`${APIFY_BASE}/acts/${actorId}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify start failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    runId: data.data.id,
    datasetId: data.data.defaultDatasetId,
  };
}

export async function getRunStatus(runId: string): Promise<{
  status: string;
  datasetId: string;
}> {
  const token = getToken();
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
  if (!res.ok) throw new Error(`Failed to get run status: ${res.status}`);
  const data = await res.json();
  return {
    status: data.data.status,
    datasetId: data.data.defaultDatasetId,
  };
}

export async function getDatasetItems(datasetId: string): Promise<any[]> {
  const token = getToken();
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&format=json`
  );
  if (!res.ok) throw new Error(`Failed to get dataset: ${res.status}`);
  return res.json();
}

export async function pollActorRun(
  actorId: string,
  input: Record<string, any>,
  onProgress?: (status: string) => void,
  maxWaitMs = 180_000
): Promise<ApifyRunResult> {
  const { runId, datasetId } = await startActorRun(actorId, input);
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const { status } = await getRunStatus(runId);
    onProgress?.(status);

    if (status === "SUCCEEDED") {
      const items = await getDatasetItems(datasetId);
      return { id: runId, status, datasetId, items };
    }
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${runId} ended with status: ${status}`);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  throw new Error(`Apify run ${runId} timed out after ${maxWaitMs / 1000}s`);
}
