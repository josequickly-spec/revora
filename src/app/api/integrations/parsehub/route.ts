import { NextResponse } from "next/server";
import { listParseHubProjects, parseHubRunInputSchema, startParseHubRun } from "@/lib/parsehub";

function failure(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 503;
  return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "ParseHub is unavailable." }, { status: status >= 400 && status < 600 ? status : 503 });
}

export async function GET() {
  try {
    const result = await listParseHubProjects();
    return NextResponse.json({
      success: true,
      total: result.total_projects,
      projects: (result.projects || []).map((project) => ({
        token: project.token,
        title: project.title,
        mainSite: project.main_site,
        mainTemplate: project.main_template,
        lastRun: project.last_run,
        lastReadyRun: project.last_ready_run,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseHubRunInputSchema.parse(await request.json());
    const run = await startParseHubRun(input);
    return NextResponse.json({ success: true, run }, { status: 202 });
  } catch (error) {
    return failure(error);
  }
}
