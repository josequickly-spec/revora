import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter(file => !file.endsWith("package-lock.json"))
  .filter(file => file !== ".github/workflows/ci.yml");

const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["OpenAI key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Clerk secret", /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/],
  ["Resend key", /\bre_[A-Za-z0-9]{20,}\b/],
  ["credentialed PostgreSQL URL", /postgres(?:ql)?:\/\/[^:\s]+:(?!\[[A-Z_]+\]|PASSWORD|TUPASSWORD|YOUR_PASSWORD|replace)[^@\s]+@/i],
];

const findings = [];
for (const file of files) {
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch {
    continue;
  }
  for (const [name, pattern] of patterns) {
    const match = source.match(pattern);
    if (match) findings.push(`${file}: ${name}`);
  }
}

if (findings.length) {
  console.error(`Potential committed secrets:\n${findings.join("\n")}`);
  process.exit(1);
}
console.log(`Secret scan passed across ${files.length} tracked files.`);
