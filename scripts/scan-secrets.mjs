import { execFileSync, spawnSync } from "node:child_process";

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .trim().split("\n").filter(Boolean);
const forbiddenNames = tracked.filter((file) =>
  /(^|\/)(?:\.env(?:\..+)?|.*keypair.*\.json|.*\.(?:pem|key))$/i.test(file) &&
  !file.endsWith(".env.example"));
if (forbiddenNames.length) {
  throw new Error(`forbidden secret-bearing filenames tracked: ${forbiddenNames.join(", ")}`);
}
const scan = spawnSync("git", [
  "grep", "-nEI",
  "(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|mnemonic[[:space:]]*[:=][[:space:]]*[a-z])",
  "--", ...tracked,
], { encoding: "utf8" });
if (scan.status === 0 && scan.stdout.trim()) {
  throw new Error("possible private-key material found in tracked files");
}
if (scan.status !== 0 && scan.status !== 1) throw new Error("secret scan could not run");
