/**
 * Competitor Monitor - Real Competitive Intelligence with Scrapling
 * Tracks competitor data and strategies
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import type { ScrapingResult } from "../scraper-config";

const execAsync = promisify(exec);

export class CompetitorMonitor {
  private monitoringSchedule = new Map<string, NodeJS.Timeout>();

  async scrapeCompetitor(domain: string): Promise<ScrapingResult> {
    try {
      // Call the real Scrapling Python script
      const scriptPath = path.join(
        process.cwd(),
        "scripts/scrapling-competitor-monitor.py"
      );

      const { stdout } = await execAsync(`python "${scriptPath}" "${domain}"`);

      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || "Competitor analysis failed");
      }

      const competitor = result.competitors?.[0] || {};

      return {
        type: "competitor-monitoring",
        url: `https://${domain}`,
        data: {
          pricingInfo: {
            pricing: competitor.pricing || [],
            weaknesses: competitor.weaknesses || [],
            opportunities: competitor.opportunities || [],
          },
          competitorFeatures: competitor.features || [],
          marketPosition: competitor.positioning || "Unknown",
        },
        metadata: {
          scrapedAt: new Date(),
          pageTitle: domain,
        },
      };
    } catch (error) {
      console.error("Competitor scraping error:", error);
      throw new Error(`Failed to scrape competitor: ${error}`);
    }
  }

  async compareCompetitors(domains: string[]): Promise<ScrapingResult[]> {
    try {
      const results: ScrapingResult[] = [];

      for (const domain of domains) {
        try {
          const result = await this.scrapeCompetitor(domain);
          results.push(result);
        } catch (error) {
          console.error(`Error analyzing ${domain}:`, error);
          // Continue with other competitors
        }
      }

      return results;
    } catch (error) {
      console.error("Competitor comparison error:", error);
      return [];
    }
  }

  startMonitoring(domain: string, intervalDays: number = 7): void {
    try {
      if (this.monitoringSchedule.has(domain)) {
        console.log(`Already monitoring ${domain}`);
        return;
      }

      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

      // Initial scrape
      this.scrapeCompetitor(domain).catch((err) =>
        console.error(`Initial scrape failed for ${domain}:`, err)
      );

      // Schedule periodic scraping
      const timer = setInterval(() => {
        this.scrapeCompetitor(domain).catch((err) =>
          console.error(`Periodic scrape failed for ${domain}:`, err)
        );
      }, intervalMs);

      this.monitoringSchedule.set(domain, timer);
      console.log(`Started monitoring ${domain} every ${intervalDays} days`);
    } catch (error) {
      console.error("Monitoring error:", error);
    }
  }

  stopMonitoring(domain: string): void {
    try {
      const timer = this.monitoringSchedule.get(domain);
      if (timer) {
        clearInterval(timer);
        this.monitoringSchedule.delete(domain);
        console.log(`Stopped monitoring ${domain}`);
      }
    } catch (error) {
      console.error("Stop monitoring error:", error);
    }
  }

  getMonitoringStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const domain of this.monitoringSchedule.keys()) {
      status[domain] = true;
    }
    return status;
  }
}
