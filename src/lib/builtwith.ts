export interface BuiltWithTechnology {
  name: string;
  category: string | null;
  categories: string[];
  premium: boolean | null;
  firstDetected: string | null;
  lastDetected: string | null;
}

export interface BuiltWithProfile {
  domain: string;
  provider: "builtwith";
  checkedAt: string;
  technologies: BuiltWithTechnology[];
  primaryPlatform: string | null;
  techSpendUsd: number | null;
  estimatedMonthlyEcommerceRevenueUsd: number | null;
  firstIndexed: string | null;
  lastIndexed: string | null;
  creditsRemaining: number | null;
}

interface BuiltWithTechnologyResponse {
  Name?: string;
  Tag?: string;
  Categories?: string[];
  IsPremium?: string;
  FirstDetected?: string;
  LastDetected?: string;
}

const cache = new Map<string, { expires: number; value: BuiltWithProfile }>();
let freeRequestQueue: Promise<void> = Promise.resolve();
let lastFreeRequestAt = 0;

const numberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const primaryPlatform = (technologies: BuiltWithTechnology[]) => {
  const priorities = [
    "Shopify", "WooCommerce", "WordPress", "Wix", "Squarespace", "Webflow",
    "BigCommerce", "PrestaShop", "Magento", "HubSpot CMS Hub", "Next.js",
  ];
  return priorities.find(platform =>
    technologies.some(technology => technology.name.toLowerCase().includes(platform.toLowerCase()))
  ) || null;
};

export function profileHasTechnology(
  profile: BuiltWithProfile,
  technologyName: string,
) {
  const needle = technologyName.toLowerCase();
  return (
    profile.primaryPlatform?.toLowerCase().includes(needle) === true ||
    profile.technologies.some(
      technology =>
        technology.name.toLowerCase().includes(needle) ||
        technology.category?.toLowerCase().includes(needle) === true ||
        technology.categories.some(category =>
          category.toLowerCase().includes(needle),
        ),
    )
  );
}

const epochDate = (value: unknown) => {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp).toISOString() : null;
};

async function rateLimitedFreeRequest<T>(request: () => Promise<T>): Promise<T> {
  let resolveResult!: (value: T) => void;
  let rejectResult!: (reason: unknown) => void;
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });
  freeRequestQueue = freeRequestQueue.catch(() => undefined).then(async () => {
    const waitMs = Math.max(0, 1050 - (Date.now() - lastFreeRequestAt));
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    try {
      resolveResult(await request());
    } catch (error) {
      rejectResult(error);
    } finally {
      lastFreeRequestAt = Date.now();
    }
  });
  return result;
}

export async function lookupBuiltWith(domainInput: string): Promise<BuiltWithProfile | null> {
  const apiKey = process.env.BUILTWITH_API_KEY;
  if (!apiKey) return null;
  const domain = domainInput.replace(/^(https?:\/\/)?(www\.)?/i, "").split("/")[0].toLowerCase();
  const cached = cache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.value;

  if ((process.env.BUILTWITH_API_TIER || "free").toLowerCase() === "free") {
    const freePayload = await rateLimitedFreeRequest(async () => {
      const freeUrl = new URL("https://api.builtwith.com/free1/api.json");
      freeUrl.searchParams.set("KEY", apiKey);
      freeUrl.searchParams.set("LOOKUP", domain);
      const freeResponse = await fetch(freeUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
      });
      if (!freeResponse.ok) throw new Error(`BuiltWith Free responded ${freeResponse.status}`);
      return await freeResponse.json() as {
        domain?: string;
        first?: number;
        last?: number;
        groups?: Array<{
          name?: string;
          live?: number;
          latest?: number;
          oldest?: number;
          categories?: Array<{ name?: string; live?: number; latest?: number; oldest?: number }>;
        }>;
      };
    });
    const technologies: BuiltWithTechnology[] = (freePayload.groups || [])
      .flatMap(group => {
        const liveCategories = (group.categories || []).filter(category => Number(category.live) > 0 && category.name);
        if (liveCategories.length) {
          return liveCategories.map(category => ({
            name: category.name as string,
            category: group.name || null,
            categories: group.name ? [group.name] : [],
            premium: null,
            firstDetected: epochDate(category.oldest),
            lastDetected: epochDate(category.latest),
          }));
        }
        if (Number(group.live) > 0 && group.name) {
          return [{
            name: group.name,
            category: group.name,
            categories: [],
            premium: null,
            firstDetected: epochDate(group.oldest),
            lastDetected: epochDate(group.latest),
          }];
        }
        return [];
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    const profile: BuiltWithProfile = {
      domain: freePayload.domain || domain,
      provider: "builtwith",
      checkedAt: new Date().toISOString(),
      technologies,
      primaryPlatform: primaryPlatform(technologies),
      techSpendUsd: null,
      estimatedMonthlyEcommerceRevenueUsd: null,
      firstIndexed: epochDate(freePayload.first),
      lastIndexed: epochDate(freePayload.last),
      creditsRemaining: null,
    };
    cache.set(domain, { expires: Date.now() + 24 * 60 * 60 * 1000, value: profile });
    return profile;
  }

  const url = new URL("https://api.builtwith.com/v23/api.json");
  url.searchParams.set("LOOKUP", domain);
  url.searchParams.set("LIVEONLY", "yes");
  url.searchParams.set("NOPII", "yes");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `API ${apiKey}`,
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`BuiltWith responded ${response.status}${message ? `: ${message.slice(0, 160)}` : ""}`);
  }

  const payload = await response.json() as {
    Results?: Array<{
      Lookup?: string;
      Result?: {
        Paths?: Array<{ Technologies?: BuiltWithTechnologyResponse[] }>;
        Spend?: number;
        SalesRevenue?: number;
        FirstIndexed?: string;
        LastIndexed?: string;
      };
    }>;
  };
  const entry = payload.Results?.[0];
  const result = entry?.Result;
  const rawTechnologies = result?.Paths?.flatMap(path => path.Technologies || []) || [];
  const unique = new Map<string, BuiltWithTechnology>();
  for (const technology of rawTechnologies) {
    if (!technology.Name) continue;
    unique.set(technology.Name.toLowerCase(), {
      name: technology.Name,
      category: technology.Tag || null,
      categories: Array.isArray(technology.Categories) ? technology.Categories : [],
      premium: technology.IsPremium ? technology.IsPremium.toLowerCase() === "yes" : null,
      firstDetected: technology.FirstDetected || null,
      lastDetected: technology.LastDetected || null,
    });
  }
  const technologies = [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
  const profile: BuiltWithProfile = {
    domain: entry?.Lookup || domain,
    provider: "builtwith",
    checkedAt: new Date().toISOString(),
    technologies,
    primaryPlatform: primaryPlatform(technologies),
    techSpendUsd: numberOrNull(result?.Spend),
    estimatedMonthlyEcommerceRevenueUsd: numberOrNull(result?.SalesRevenue),
    firstIndexed: result?.FirstIndexed || null,
    lastIndexed: result?.LastIndexed || null,
    creditsRemaining: numberOrNull(response.headers.get("x-api-credits-remaining")),
  };
  cache.set(domain, { expires: Date.now() + 24 * 60 * 60 * 1000, value: profile });
  return profile;
}
