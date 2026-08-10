import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const requirements = {
  contributing: [
    "pnpm install --frozen-lockfile",
    "pnpm lint",
    "pnpm typecheck",
    "pnpm test",
    "pnpm build",
    "pnpm test:e2e",
    "pnpm contributor:verify",
  ],
  starterTemplate: ["Acceptance check", "no mainnet funds", "no secrets"],
  upstream: ["candidate", "accepted"],
};

export function validateContributorArtifacts(artifacts) {
  let checks = 0;
  for (const [document, needles] of Object.entries(requirements)) {
    const content = artifacts[document] ?? "";
    for (const needle of needles) {
      checks += 1;
      if (!content.toLowerCase().includes(needle.toLowerCase())) {
        throw new Error(`CONTRIBUTOR_PATH_INCOMPLETE:${document}:${needle}`);
      }
    }
  }
  return { passed: true, checks };
}

export async function verifyContributorPath(root = process.cwd()) {
  return validateContributorArtifacts({
    contributing: await readFile(resolve(root, "CONTRIBUTING.md"), "utf8"),
    starterTemplate: await readFile(
      resolve(root, ".github/ISSUE_TEMPLATE/good-first-issue.yml"),
      "utf8",
    ),
    upstream: await readFile(resolve(root, "docs/upstream.md"), "utf8"),
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.stdout.write(`${JSON.stringify(await verifyContributorPath())}\n`);
}
