import { NextResponse } from "next/server";
import { enqueueDueSchedules } from "@/lib/enterprise/scheduler";
import { enforceWarehouseRetention } from "@/lib/warehouse/retention/execute";

export async function POST(request: Request) {
  if (
    !process.env.WORKFLOW_WORKER_SECRET ||
    request.headers.get("x-worker-secret") !== process.env.WORKFLOW_WORKER_SECRET
  ) return NextResponse.json({ error: "Worker authentication failed." }, { status: 401 });
  try {
    const [schedules, retention] = await Promise.all([
      enqueueDueSchedules(),
      enforceWarehouseRetention(),
    ]);
    return NextResponse.json({ schedules, retention });
  } catch {
    return NextResponse.json({ error: "Maintenance failed safely." }, { status: 500 });
  }
}
