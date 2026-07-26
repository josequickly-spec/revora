// Hunter.io API Integration for automatic email discovery

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const HUNTER_API_URL = "https://api.hunter.io/v2";

export interface HunterEmailResult {
  email: string;
  confidence: number;
  sources: Array<{
    domain: string;
    uri: string;
    source_url: string;
  }>;
}

export interface HunterDomainSearch {
  domain: string;
  organization: string;
  emails: Array<{
    value: string;
    type: string;
    confidence: number;
    sources: Array<{
      domain: string;
      uri: string;
      source_url: string;
    }>;
  }>;
  pattern: string;
  organization_size: string;
  country: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
}

/**
 * Find email for a person at a domain
 * @param domain - Company domain (e.g., "google.com")
 * @param firstName - First name
 * @param lastName - Last name
 */
export async function findEmail(
  domain: string,
  firstName: string,
  lastName: string
): Promise<HunterEmailResult | null> {
  if (!HUNTER_API_KEY) {
    console.warn("HUNTER_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${HUNTER_API_URL}/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${HUNTER_API_KEY}`
    );

    if (!response.ok) {
      console.error("Hunter.io error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.data?.email) {
      return {
        email: data.data.email,
        confidence: data.data.confidence,
        sources: data.data.sources || [],
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding email:", error);
    return null;
  }
}

/**
 * Get all emails from a domain
 * @param domain - Company domain
 */
export async function getDomainEmails(
  domain: string
): Promise<HunterDomainSearch | null> {
  if (!HUNTER_API_KEY) {
    console.warn("HUNTER_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${HUNTER_API_URL}/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
    );

    if (!response.ok) {
      console.error("Hunter.io domain search error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error("Error getting domain emails:", error);
    return null;
  }
}

/**
 * Verify if an email is valid
 * @param email - Email to verify
 */
export async function verifyEmail(email: string): Promise<boolean> {
  if (!HUNTER_API_KEY) {
    console.warn("HUNTER_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(
      `${HUNTER_API_URL}/email-verifier?email=${email}&api_key=${HUNTER_API_KEY}`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.data?.result === "valid";
  } catch (error) {
    console.error("Error verifying email:", error);
    return false;
  }
}
