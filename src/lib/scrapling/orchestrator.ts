/**
 * Scrapling Orchestrator
 * Coordinates all scraping operations across the platform
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { BusinessDiscoveryScraper } from "./scrapers/business-discovery";
import { FunnelAnalyzer } from "./scrapers/funnel-analyzer";
import { CompetitorMonitor } from "./scrapers/competitor-monitor";
import type { ScrapingJob, ScrapingConfig, ScraperType } from "./scraper-config";
import { defaultScrapingConfig } from "./scraper-config";
import { APIFY_ACTORS } from "@/lib/apify/actors";
import { pollActorRun } from "@/lib/apify/client";

const execAsync = promisify(exec);

export class ScraplingOrchestrator {
  private config: ScrapingConfig;
  private businessDiscovery: BusinessDiscoveryScraper;
  private funnelAnalyzer: FunnelAnalyzer;
  private competitorMonitor: CompetitorMonitor;
  private activeJobs: Map<string, ScrapingJob> = new Map();

  constructor(config: ScrapingConfig = defaultScrapingConfig) {
    this.config = config;
    this.businessDiscovery = new BusinessDiscoveryScraper();
    this.funnelAnalyzer = new FunnelAnalyzer();
    this.competitorMonitor = new CompetitorMonitor();
  }

  /**
   * Create and execute a scraping job
   */
  async createJob(
    type: ScraperType,
    params: Record<string, any>
  ): Promise<ScrapingJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ScrapingJob = {
      id: jobId,
      type,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
      ...params,
    };

    this.activeJobs.set(jobId, job);

    // Execute asynchronously
    this.executeJob(job).catch(error => {
      job.status = "failed";
      job.error = error.message;
    });

    return job;
  }

  /**
   * Execute a scraping job
   */
  private async executeJob(job: ScrapingJob): Promise<void> {
    job.status = "running";
    job.progress = 10;

    try {
      switch (job.type) {
        case "business-discovery":
          await this.executeBusinessDiscovery(job);
          break;
        case "funnel-analysis":
          await this.executeFunnelAnalysis(job);
          break;
        case "competitor-monitoring":
          await this.executeCompetitorMonitoring(job);
          break;
        case "data-enrichment":
          await this.executeDataEnrichment(job);
          break;
        case "proposal-generation":
          await this.executeProposalGeneration(job);
          break;
        case "contact-extraction":
          await this.executeContactExtraction(job);
          break;
        case "shopify-audit":
          await this.executeShopifyAudit(job);
          break;
        default:
          if (job.type.startsWith("apify-")) {
            await this.executeApifyActor(job);
            break;
          }
          throw new Error(`Unknown scraper type: ${job.type}`);
      }

      job.status = "completed";
      job.progress = 100;
      job.completedAt = new Date();
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Execute business discovery job
   */
  private async executeBusinessDiscovery(job: ScrapingJob): Promise<void> {
    const { keyword = "", location = "", limit = 50 } = job;
    job.progress = 20;

    const results = await this.businessDiscovery.scrapeDirectories(
      keyword,
      location,
      limit
    );

    job.progress = 80;
    job.results = { discoveredBusinesses: results };
    job.progress = 90;
  }

  /**
   * Execute funnel analysis job
   */
  private async executeFunnelAnalysis(job: ScrapingJob): Promise<void> {
    const { url, businessId } = job;
    job.progress = 20;

    const analysis = await this.funnelAnalyzer.analyzeFunnel(url);
    job.progress = 60;

    // If comparing with competitors
    if (job.businessId) {
      // Would get competitor URLs and compare
      job.results = {
        analysis,
        comparison: {
          commonPatterns: [],
          differentiators: [],
          opportunities: [],
        },
      };
    } else {
      job.results = { analysis };
    }

    job.progress = 90;
  }

  /**
   * Execute competitor monitoring job
   */
  private async executeCompetitorMonitoring(job: ScrapingJob): Promise<void> {
    const { competitors, businessId } = job;
    job.progress = 20;

    const comparison = await this.competitorMonitor.compareCompetitors(
      competitors || []
    );

    job.progress = 80;
    job.results = comparison;
    job.progress = 90;
  }

  /**
   * Execute data enrichment job
   */
  private async executeDataEnrichment(job: ScrapingJob): Promise<void> {
    const { domain } = job;
    job.progress = 20;

    try {
      const scriptPath = path.join(process.cwd(), "scripts/scrapling-data-enrichment.py");
      const { stdout } = await execAsync(`python "${scriptPath}" "${domain}"`);
      const result = JSON.parse(stdout);

      job.progress = 70;

      if (!result.success) {
        throw new Error(result.error || "Data enrichment failed");
      }

      job.results = { enrichedData: result.enrichedData };
    } catch (error) {
      console.error("Data enrichment error:", error);
      throw new Error(`Data enrichment failed: ${error}`);
    }

    job.progress = 90;
  }

  /**
   * Execute proposal generation job
   */
  private async executeProposalGeneration(job: ScrapingJob): Promise<void> {
    const { domain } = job;
    job.progress = 20;

    try {
      const scriptPath = path.join(process.cwd(), "scripts/scrapling-proposal-data.py");
      const { stdout } = await execAsync(`python "${scriptPath}" "${domain}"`);
      const result = JSON.parse(stdout);

      job.progress = 70;

      if (!result.success) {
        throw new Error(result.error || "Proposal data extraction failed");
      }

      job.results = { proposalData: result.proposalData };
    } catch (error) {
      console.error("Proposal generation error:", error);
      throw new Error(`Proposal data extraction failed: ${error}`);
    }

    job.progress = 90;
  }

  /**
   * Execute contact extraction job
   */
  private async executeContactExtraction(job: ScrapingJob): Promise<void> {
    const { domain } = job;
    job.progress = 20;

    try {
      const scriptPath = path.join(process.cwd(), "scripts/scrapling-contact-extraction.py");
      const { stdout } = await execAsync(`python "${scriptPath}" "${domain}"`);
      const result = JSON.parse(stdout);

      job.progress = 70;

      if (!result.success) {
        throw new Error(result.error || "Contact extraction failed");
      }

      job.results = { contacts: result.contacts };
    } catch (error) {
      console.error("Contact extraction error:", error);
      throw new Error(`Contact extraction failed: ${error}`);
    }

    job.progress = 90;
  }

  /**
   * Execute Shopify store audit
   */
  private async executeShopifyAudit(job: ScrapingJob): Promise<void> {
    const { domain } = job;
    job.progress = 20;

    try {
      const scriptPath = path.join(process.cwd(), "scripts/scrapling-shopify-audit.py");
      const { stdout } = await execAsync(`python "${scriptPath}" "${domain}"`, { timeout: 45000 });
      const result = JSON.parse(stdout);

      job.progress = 80;

      if (!result.success) {
        throw new Error(result.error || "Shopify audit failed");
      }

      job.results = result;
    } catch (error) {
      console.error("Shopify audit error:", error);
      throw new Error(`Shopify audit failed: ${error}`);
    }

    job.progress = 90;
  }

  /**
   * Execute an Apify actor job
   */
  private async executeApifyActor(job: ScrapingJob): Promise<void> {
    const actorKey = job.type.replace("apify-", "");
    const actorConfig = APIFY_ACTORS[actorKey];
    if (!actorConfig) {
      throw new Error(`Unknown Apify actor: ${actorKey}`);
    }

    job.progress = 15;
    const input = actorConfig.buildInput(job);
    job.progress = 25;

    const result = await pollActorRun(
      actorConfig.actorId,
      input,
      (status) => {
        if (status === "RUNNING") job.progress = Math.min(job.progress + 5, 80);
        else if (status === "READY") job.progress = 20;
      },
      actorConfig.timeoutSecs * 1000
    );

    job.progress = 85;
    job.results = actorConfig.transformResults(result.items);
    job.progress = 95;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ScrapingJob | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): ScrapingJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === "running") {
      job.status = "failed";
      job.error = "Job cancelled by user";
      return true;
    }
    return false;
  }

  /**
   * Get job results
   */
  getJobResults(jobId: string): Record<string, any> | undefined {
    const job = this.activeJobs.get(jobId);
    return job?.results;
  }

  /**
   * Bulk execute multiple jobs
   */
  async executeBulk(
    jobs: Array<{ type: ScraperType; params: Record<string, any> }>
  ): Promise<ScrapingJob[]> {
    return Promise.all(
      jobs.map(({ type, params }) => this.createJob(type, params))
    );
  }

  /**
   * Get scraping statistics
   */
  getStatistics(): Record<string, any> {
    const jobs = Array.from(this.activeJobs.values());
    const completed = jobs.filter(j => j.status === "completed").length;
    const failed = jobs.filter(j => j.status === "failed").length;
    const running = jobs.filter(j => j.status === "running").length;

    return {
      totalJobs: jobs.length,
      completed,
      failed,
      running,
      successRate: jobs.length > 0 ? (completed / jobs.length) * 100 : 0,
      averageProgress:
        jobs.length > 0
          ? jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length
          : 0,
    };
  }

  /**
   * Configure scraping behavior
   */
  updateConfig(newConfig: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clean up old jobs (older than X days)
   */
  cleanupOldJobs(daysOld: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let removed = 0;
    this.activeJobs.forEach((job, jobId) => {
      if (
        job.status !== "running" &&
        job.completedAt &&
        job.completedAt < cutoffDate
      ) {
        this.activeJobs.delete(jobId);
        removed++;
      }
    });

    return removed;
  }
}

// Singleton instance
let orchestratorInstance: ScraplingOrchestrator | null = null;

export function getOrchestrator(
  config?: ScrapingConfig
): ScraplingOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ScraplingOrchestrator(config);
  }
  return orchestratorInstance;
}

export function resetOrchestrator(): void {
  orchestratorInstance = null;
}
