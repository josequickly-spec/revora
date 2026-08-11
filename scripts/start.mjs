import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { resolve } from "node:path";

const env = { ...process.env };
config({ path: resolve(".env.local"), processEnv: env, quiet: true });

const args = process.argv.slice(2);
const portFlag = args.findIndex((value) => value === "-p" || value === "--port");
if (portFlag >= 0 && args[portFlag + 1]) env.PORT = args[portFlag + 1];

const result = spawnSync(process.execPath, ["server.js"], {
  cwd: resolve(".next", "standalone"),
  env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
