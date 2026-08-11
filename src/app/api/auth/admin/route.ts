import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword, signJwt, createOpaqueToken } from "@/lib/enterprise/security";
import { sha256 } from "@/lib/enterprise/security";
import { pool } from "@/lib/postgres";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@revora.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminSecure123!";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Verify credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Get or create admin user in database
    const client = await pool.connect();
    try {
      const normalized = ADMIN_EMAIL.toLowerCase();

      // Check if admin user exists
      let user = (
        await client.query(
          `SELECT id, email, display_name FROM enterprise_users WHERE normalized_email = $1`,
          [normalized]
        )
      ).rows[0];

      // Create admin user if doesn't exist
      if (!user) {
        const userId = crypto.randomUUID();
        const passwordHash = await hashPassword(ADMIN_PASSWORD);

        await client.query(
          `INSERT INTO enterprise_users(id, email, normalized_email, display_name, password_hash, status)
           VALUES($1, $2, $3, $4, $5, 'active')`,
          [userId, ADMIN_EMAIL, normalized, "Administrator", passwordHash]
        );

        // Create default admin organization
        const orgId = crypto.randomUUID();
        const workspaceId = crypto.randomUUID();

        await client.query(
          `INSERT INTO enterprise_organizations(id, name, slug, created_by)
           VALUES($1, $2, $3, $4)`,
          [orgId, "Administrator Organization", `admin-${orgId.slice(0, 8)}`, userId]
        );

        await client.query(
          `INSERT INTO enterprise_workspaces(id, organization_id, name, slug)
           VALUES($1, $2, $3, $4)`,
          [workspaceId, orgId, "Primary", "primary"]
        );

        // Seed roles
        const roles = ["owner", "admin", "manager", "member", "viewer"];
        for (const roleName of roles) {
          await client.query(
            `INSERT INTO enterprise_roles(id, organization_id, code, name, is_system)
             VALUES($1, $2, $3, $4, TRUE)`,
            [crypto.randomUUID(), orgId, roleName, roleName[0].toUpperCase() + roleName.slice(1)]
          );
        }

        // Add admin user as owner
        const ownerRole = (
          await client.query(
            `SELECT id FROM enterprise_roles WHERE organization_id = $1 AND code = 'owner'`,
            [orgId]
          )
        ).rows[0];

        await client.query(
          `INSERT INTO enterprise_memberships(id, organization_id, user_id, role_id, status)
           VALUES($1, $2, $3, $4, 'active')`,
          [crypto.randomUUID(), orgId, userId, ownerRole.id]
        );

        user = { id: userId, email: ADMIN_EMAIL, display_name: "Administrator" };
      }

      // Create session
      const sessionId = crypto.randomUUID();
      const refreshToken = createOpaqueToken(48);
      const organization = (
        await client.query(
          `SELECT m.organization_id, r.code as role FROM enterprise_memberships m
           JOIN enterprise_roles r ON r.id = m.role_id
           WHERE m.user_id = $1 AND m.status = 'active' LIMIT 1`,
          [user.id]
        )
      ).rows[0];

      await client.query(
        `INSERT INTO enterprise_device_sessions(id, user_id, organization_id, refresh_token_hash, expires_at)
         VALUES($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
        [sessionId, user.id, organization.organization_id, sha256(refreshToken)]
      );

      const accessToken = signJwt({
        sub: user.id,
        org: organization.organization_id,
        sid: sessionId,
        type: "access",
      });

      // Set secure cookies
      const response = NextResponse.json(
        {
          user: { id: user.id, email: user.email, displayName: user.display_name },
          accessToken,
          refreshToken,
          organizationId: organization.organization_id,
        },
        { status: 200 }
      );

      response.cookies.set("revora_access", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 900,
      });

      response.cookies.set("revora_refresh", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 2_592_000,
      });

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
