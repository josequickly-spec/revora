import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/scrapling/orchestrator";
import type { ScraperType } from "@/lib/scrapling/scraper-config";

/**
 * POST /api/scrapling/execute
 * Execute a scraping job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, params } = body;

    if (!type || !params) {
      return NextResponse.json(
        { error: "type and params are required" },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();
    const job = await orchestrator.createJob(type as ScraperType, params);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute scraping job" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrapling/execute?jobId=xxx
 * Get job status and results
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId parameter is required" },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();
    const job = orchestrator.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error,
        results: job.results,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get job status" },
      { status: 500 }
    );
  }
}
