import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  verifyHexHmac,
  verifySvixSignature,
  verifyTimestampedHexHmac,
} from "../src/lib/webhook-security.ts";
import { nextCronOccurrence } from "../src/lib/enterprise/scheduler.ts";

let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions++;
}

const crypto = await import("node:crypto");
const raw = JSON.stringify({ event: "delivered" });
const secret = "test-webhook-secret-at-least-32-characters";
const meta = `sha256=${crypto.createHmac("sha256", secret).update(raw).digest("hex")}`;
check(verifyHexHmac(raw, meta, secret, "sha256="), "Meta-compatible signature accepted");
check(!verifyHexHmac(`${raw}x`, meta, secret, "sha256="), "tampered Meta body rejected");

const now = Date.now();
const stamp = String(now);
const signed = crypto.createHmac("sha256", secret).update(`${stamp}.${raw}`).digest("hex");
check(verifyTimestampedHexHmac(raw, signed, stamp, secret, now), "fresh signed ingestion accepted");
check(!verifyTimestampedHexHmac(raw, signed, String(now - 600_000), secret, now), "stale ingestion rejected");

const svixStamp = String(Math.floor(now / 1000));
const svixId = "msg_test";
const svixKey = crypto.randomBytes(32);
const svixSecret = `whsec_${svixKey.toString("base64")}`;
const svixSignature = crypto.createHmac("sha256", svixKey)
  .update(`${svixId}.${svixStamp}.${raw}`)
  .digest("base64");
check(
  verifySvixSignature(raw, svixId, svixStamp, `v1,${svixSignature}`, svixSecret, now),
  "valid Svix signature accepted",
);
check(
  !verifySvixSignature(`${raw}x`, svixId, svixStamp, `v1,${svixSignature}`, svixSecret, now),
  "tampered Svix body rejected",
);

const next = nextCronOccurrence("*/15 * * * *", "America/New_York", new Date("2026-07-29T12:01:00Z"));
check(next.toISOString() === "2026-07-29T12:15:00.000Z", "cron calculates next zoned occurrence");
assert.throws(() => nextCronOccurrence("invalid", "UTC"), /cron_requires_five_fields/);
assertions++;

const proxy = await readFile(new URL("../src/proxy.ts", import.meta.url), "utf8");
for (const requirement of [
  "requirePermission",
  "requireLegacyDatasetAccess",
  "payload_too_large",
  "csrf_failed",
  "hasSameOrigin",
  "Content-Security-Policy",
  "lead-capture",
]) check(proxy.includes(requirement), `proxy includes ${requirement}`);

const migration = await readFile(new URL("./migrate-security-remediation.sql", import.meta.url), "utf8");
check(migration.includes("platform_legacy_dataset_owner"), "legacy dataset ownership migration exists");

const rootLayout = await readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
check(rootLayout.includes('dynamic = "force-dynamic"'), "nonce CSP uses dynamic rendering");
check(rootLayout.includes("<GlobalNavigationControls />"), "all pages include global navigation controls");
const authForm = await readFile(new URL("../src/components/enterprise/AuthForm.tsx", import.meta.url), "utf8");
check(authForm.includes('<form method="post"'), "auth fallback never places credentials in the URL");
const buildScript = await readFile(new URL("./build.mjs", import.meta.url), "utf8");
check(buildScript.includes('join(standalone, ".next", "static")'), "standalone build includes client chunks");

const leakedDocument = await readFile(new URL("../DEPLOY_GITHUB_VERCEL.md", import.meta.url), "utf8");
check(!leakedDocument.includes("Adeline@"), "known database credential removed");
check(!/sk_test_[A-Za-z0-9]{20,}/.test(leakedDocument), "known Clerk secret removed");

console.log(`Security remediation characterization: ${assertions} assertions passed.`);
