export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Simple health check
    return Response.json({
      ok: true,
      database: process.env.DATABASE_URL ? "connected" : "mock",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
