import { NextResponse } from "next/server";
import { z } from "zod";
import { contactSelect, pool } from "@/lib/postgres";

const linkedinProfileUrl = z.string().trim().url().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return ["linkedin.com", "www.linkedin.com"].includes(url.hostname.toLowerCase()) && url.pathname.startsWith("/in/");
  } catch {
    return false;
  }
}, "Enter a valid LinkedIn member profile URL.");

const manualContactSchema = z.object({
  businessId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  role: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  linkedinUrl: z.union([z.literal(""), linkedinProfileUrl]).optional(),
}).strict();

export async function GET() {
  try {
    const result = await pool.query(`SELECT ${contactSelect} FROM contacts ORDER BY created_at DESC`);
    return NextResponse.json({ success: true, contacts: result.rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = manualContactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Enter a valid name, role and email address.", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { businessId, name, role, email, linkedinUrl } = parsed.data;
  try {
    const business = await pool.query("SELECT id FROM businesses WHERE id=$1", [businessId]);
    if (!business.rowCount) {
      return NextResponse.json({ success: false, error: "The selected business no longer exists." }, { status: 404 });
    }

    const result = await pool.query(
      `INSERT INTO contacts (business_id,name,role,email,linkedin_url,confidence_score,status)
       VALUES ($1,$2,$3,$4,$5,0,'manual')
       RETURNING ${contactSelect}`,
      [businessId, name, role, email, linkedinUrl || null],
    );
    return NextResponse.json({ success: true, contact: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "A contact with this email already exists for this business." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "The contact could not be saved." },
      { status: 500 },
    );
  }
}
