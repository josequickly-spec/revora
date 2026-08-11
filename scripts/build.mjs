import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const env = { ...process.env };

const stopProjectNextProcesses = () => {
  if (process.platform !== "win32") return;

  const projectRoot = process.cwd();
  const powershellCommand = `
$root = [System.IO.Path]::GetFullPath('${projectRoot.replace(/'/g, "''")}');
$matches = Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -and (
      $_.CommandLine.Contains($root) -or
      $_.CommandLine.Contains('node_modules\\next\\dist\\bin\\next') -or
      $_.CommandLine.Contains('next dev') -or
      $_.CommandLine.Contains('next build') -or
      $_.CommandLine.Contains('next start') -or
      $_.CommandLine.Contains('next\\dist\\server\\lib\\start-server.js')
    )
  } | Select-Object -ExpandProperty ProcessId;

if ($matches) {
  $matches | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}
`;

  spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", powershellCommand], {
    stdio: "ignore",
  });
};

const removeGeneratedDirectory = (directoryName) => {
  const target = join(process.cwd(), directoryName);
  if (!existsSync(target)) return;

  const nativeWindowsCleanup = () => {
    const escapedTarget = target.replace(/'/g, "''");
    const prepare = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        `Get-ChildItem -LiteralPath '${escapedTarget}' -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { $_.Attributes = 'Normal' }`,
      ],
      { stdio: "ignore" },
    );
    if (prepare.status !== 0 && prepare.status !== null) {
      // continue anyway; the real cleanup is still attempted below
    }

    const remove = spawnSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `Remove-Item -LiteralPath '${escapedTarget}' -Recurse -Force -ErrorAction Stop`],
      { stdio: "ignore" },
    );
    if (remove.status === 0) return true;

    const cmd = spawnSync("cmd.exe", ["/d", "/s", "/c", `rmdir /s /q "${target}"`], { stdio: "ignore" });
    return cmd.status === 0;
  };

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      stopProjectNextProcesses();

      if (process.platform === "win32") {
        if (nativeWindowsCleanup()) {
          if (!existsSync(target)) return;
        }
      } else {
        rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
        if (!existsSync(target)) return;
      }
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (attempt === 11 || !["ENOTEMPTY", "EBUSY", "EPERM"].includes(code)) {
        throw error;
      }
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
};

// Next.js controls NODE_ENV during `next build`. Some managed hosts inject a
// custom value which can break React while prerendering internal error pages.
delete env.NODE_ENV;

// On Windows, stale `next dev` or `next build` processes can keep file handles
// open in `.next` and cause `ENOTEMPTY` / `EPERM` during cleanup. Stop only the
// project-owned Next processes before removing generated output.
stopProjectNextProcesses();

// Remove generated output before every production build so deleted routes and
// public assets cannot survive inside a stale standalone directory.
for (const generatedDirectory of [".next", ".next-visual-qa"]) {
  removeGeneratedDirectory(generatedDirectory);
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
  // A standalone Next.js server always resolves browser chunks from
  // `<standalone>/.next/static`, even when the build used a custom dist dir.
  cpSync(join(process.cwd(), distDirectory, "static"), join(standalone, ".next", "static"), {
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
