import { NextRequest, NextResponse } from "next/server";
import { getAudit } from "@/lib/funnelspy-store";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const format = request.nextUrl.searchParams.get("format") || "json";
  if (!id) return NextResponse.json({ error: "Falta el identificador." }, { status: 400 });
  const audit = await getAudit(id);
  if (!audit) return NextResponse.json({ error: "Auditoría no encontrada." }, { status: 404 });

  if (format === "csv") {
    const header = ["url", "tipo", "titulo", "ctas", "formularios", "tecnologias", "pixeles"];
    const rows = audit.analysis.pages.map((page) => [
      page.url, page.kind, page.title, page.ctas.join(" | "), page.forms,
      page.technologies.join(" | "), page.pixels.join(" | "),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="funnelspy-${audit.domain}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(audit, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="funnelspy-${audit.domain}.json"`,
    },
  });
}
