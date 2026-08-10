/**
 * Business Discovery Scraper - Real Web Scraping with Scrapling
 * Discovers businesses from web directories and listings
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import type { ScrapingResult } from "../scraper-config";

const execAsync = promisify(exec);

export class BusinessDiscoveryScraper {
  async scrapeDirectories(
    keyword: string,
    location: string,
    limit: number = 50
  ): Promise<ScrapingResult[]> {
    try {
      // Call the real Scrapling Python script
      const scriptPath = path.join(
        process.cwd(),
        "scripts/scrapling-business-discovery.py"
      );

      const { stdout } = await execAsync(
        `python "${scriptPath}" "${keyword}" "${location}" ${limit}`
      );

      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || "Business discovery failed");
      }

      // Transform results to ScrapingResult format
      return result.discoveredBusinesses.map((business: any) => ({
        type: "business-discovery" as const,
        url: business.website || "N/A",
        data: {
          businessName: business.name,
          businessType: "Local Business",
          industry: "General",
          contactEmails: business.email ? [business.email] : [],
          phoneNumbers: business.phone ? [business.phone] : [],
          address: business.address,
          socialMediaLinks: [],
          rating: business.rating,
          source: business.source,
        },
        metadata: {
          scrapedAt: new Date(),
          pageTitle: business.name,
        },
      }));
    } catch (error) {
      console.error("Business discovery error:", error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  async scrapeBusinessWebsite(domain: string): Promise<ScrapingResult> {
    try {
      const url = domain.startsWith("http") ? domain : `https://${domain}`;

      // Call Python script for individual website scraping
      const scriptPath = path.join(
        process.cwd(),
        "scripts/scrapling-business-discovery.py"
      );

      const { stdout } = await execAsync(
        `python "${scriptPath}" "business" "${domain}" 1`
      );

      const result = JSON.parse(stdout);
      const business = result.discoveredBusinesses?.[0];

      return {
        type: "business-discovery",
        url,
        data: {
          businessName: business?.name || domain,
          businessType: "Unknown",
          industry: "Unknown",
          contactEmails: business?.email ? [business.email] : [],
          phoneNumbers: business?.phone ? [business.phone] : [],
          address: business?.address || "Not found",
          socialMediaLinks: {},
        },
        metadata: {
          scrapedAt: new Date(),
          pageTitle: business?.name || domain,
        },
      };
    } catch (error) {
      console.error("Website scraping error:", error);
      throw new Error(`Failed to scrape business website: ${error}`);
    }
  }
}
