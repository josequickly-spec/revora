/**
 * Funnel Analyzer - Real Landing Page Analysis with Scrapling
 * Analyzes conversion funnels and landing page performance
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import type { ScrapingResult } from "../scraper-config";

const execAsync = promisify(exec);

export interface FunnelElements {
  headlines: string[];
  ctas: string[];
  testimonials: string[];
  pricing: string[];
  forms: any[];
}

export class FunnelAnalyzer {
  async analyzeFunnel(url: string): Promise<ScrapingResult> {
    try {
      // Call the real Scrapling Python script
      const scriptPath = path.join(
        process.cwd(),
        "scripts/scrapling-funnel-analysis.py"
      );

      const { stdout } = await execAsync(`python "${scriptPath}" "${url}"`);

      const result = JSON.parse(stdout);

      if (!result.success) {
        throw new Error(result.error || "Funnel analysis failed");
      }

      const analysis = result.analysis || {};

      return {
        type: "funnel-analysis",
        url,
        data: {
          headlines: analysis.headlines || [],
          subheadlines: analysis.subheadlines || [],
          ctaText: analysis.ctas || [],
          offerBadges: analysis.offers || [],
          heroImages: analysis.images || [],
          pageLayout: analysis.layout || {},
        },
        metadata: {
          scrapedAt: new Date(),
          pageTitle: url,
        },
      };
    } catch (error) {
      console.error("Funnel analysis error:", error);
      throw new Error(`Failed to analyze funnel: ${error}`);
    }
  }

  async compareFunnels(urls: string[]): Promise<ScrapingResult[]> {
    try {
      const results: ScrapingResult[] = [];

      for (const url of urls) {
        try {
          const result = await this.analyzeFunnel(url);
          results.push(result);
        } catch (error) {
          console.error(`Error analyzing ${url}:`, error);
          // Continue with other URLs
        }
      }

      return results;
    } catch (error) {
      console.error("Funnel comparison error:", error);
      return [];
    }
  }

  async monitorChanges(
    url: string,
    previousAnalysis?: any
  ): Promise<ScrapingResult> {
    try {
      const currentAnalysis = await this.analyzeFunnel(url);

      // Compare with previous analysis
      if (previousAnalysis) {
        const changes = this.detectChanges(previousAnalysis, currentAnalysis);
        (currentAnalysis.metadata as any).changes = changes;
      }

      return currentAnalysis;
    } catch (error) {
      console.error("Monitoring error:", error);
      throw new Error(`Failed to monitor changes: ${error}`);
    }
  }

  private detectChanges(previous: any, current: any): any {
    return {
      headlinesChanged:
        JSON.stringify(previous.data?.headlines) !==
        JSON.stringify(current.data?.headlines),
      ctasChanged:
        JSON.stringify(previous.data?.ctaText) !==
        JSON.stringify(current.data?.ctaText),
      layoutChanged:
        JSON.stringify(previous.data?.pageLayout) !==
        JSON.stringify(current.data?.pageLayout),
    };
  }
}
