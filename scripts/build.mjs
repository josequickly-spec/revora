import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const env = { ...process.env };

// Next.js controls NODE_ENV during `next build`. Some managed hosts inject a
// custom value which can break React while prerendering internal error pages.
delete env.NODE_ENV;

// Remove generated output before every production build so deleted routes and
// public assets cannot survive inside a stale standalone directory.
for (const generatedDirectory of [".next", ".next-visual-qa"]) {
  const target = join(process.cwd(), generatedDirectory);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const distDirectory = [env.NEXT_DIST_DIR, ".next-visual-qa", ".next"]
  .filter(Boolean)
  .find((candidate) => existsSync(join(process.cwd(), candidate, "standalone"))) || ".next";
const standalone = join(process.cwd(), distDirectory, "standalone");
if (existsSync(standalone)) {
  cpSync(join(process.cwd(), distDirectory, "static"), join(standalone, distDirectory, "static"), {
    recursive: true,
    force: true,
  });
  const publicDirectory = join(process.cwd(), "public");
  const standalonePublicDirectory = join(standalone, "public");
  if (existsSync(standalonePublicDirectory)) {
    rmSync(standalonePublicDirectory, { recursive: true, force: true });
  }
  if (existsSync(publicDirectory)) {
    cpSync(publicDirectory, standalonePublicDirectory, { recursive: true, force: true });
  }
}
