import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/scrapling/orchestrator";

/**
 * GET /api/scrapling/jobs
 * List all active jobs
 */
export async function GET(request: NextRequest) {
  try {
    const orchestrator = getOrchestrator();
    const jobs = orchestrator.getActiveJobs();
    const stats = orchestrator.getStatistics();

    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        error: job.error,
      })),
      statistics: stats,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scrapling/jobs
 * Create bulk jobs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobs } = body;

    if (!Array.isArray(jobs)) {
      return NextResponse.json(
        { error: "jobs must be an array" },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();
    const createdJobs = await orchestrator.executeBulk(jobs);

    return NextResponse.json({
      success: true,
      jobs: createdJobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
      })),
      count: createdJobs.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create jobs" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scrapling/jobs?jobId=xxx
 * Cancel a job
 */
export async function DELETE(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId parameter is required" },
        { status: 400 }
      );
    }

    const orchestrator = getOrchestrator();
    const cancelled = orchestrator.cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: "Job not found or already completed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel job" },
      { status: 500 }
    );
  }
}
