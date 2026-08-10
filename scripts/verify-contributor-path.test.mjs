import assert from "node:assert/strict";
import test from "node:test";
import { validateContributorArtifacts } from "./verify-contributor-path.mjs";

test("contributor artifacts require setup, gates and a bounded starter template", () => {
  assert.deepEqual(
    validateContributorArtifacts({
      contributing:
        "pnpm install --frozen-lockfile\npnpm lint\npnpm typecheck\npnpm test\npnpm build\npnpm test:e2e\npnpm contributor:verify",
      starterTemplate:
        "good first issue\nAcceptance check\nno mainnet funds\nno secrets",
      upstream: "candidate proposed under review accepted declined withdrawn",
    }),
    { passed: true, checks: 12 },
  );
  assert.throws(
    () =>
      validateContributorArtifacts({
        contributing: "pnpm install",
        starterTemplate: "task",
        upstream: "accepted",
      }),
    /CONTRIBUTOR_PATH_INCOMPLETE/,
  );
});
