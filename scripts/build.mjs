import { spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const env = { ...process.env };

// Next.js controls NODE_ENV during `next build`. Some managed hosts inject a
// custom value which can break React while prerendering internal error pages.
delete env.NODE_ENV;

const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const standalone = join(process.cwd(), ".next", "standalone");
if (existsSync(standalone)) {
  cpSync(join(process.cwd(), ".next", "static"), join(standalone, ".next", "static"), {
    recursive: true,
    force: true,
  });
  const publicDirectory = join(process.cwd(), "public");
  if (existsSync(publicDirectory)) {
    cpSync(publicDirectory, join(standalone, "public"), { recursive: true, force: true });
  }
}
