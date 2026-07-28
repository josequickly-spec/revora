import { NextResponse } from "next/server";
import { contactSelect, pool } from "@/lib/postgres";

export async function GET() {
  try {
    const result = await pool.query(`SELECT ${contactSelect} FROM contacts ORDER BY created_at DESC`);
    return NextResponse.json({ success: true, contacts: result.rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}
