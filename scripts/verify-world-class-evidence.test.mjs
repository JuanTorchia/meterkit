import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSpdx,
  sanitizeHealthTarget,
} from "./verify-world-class-evidence.mjs";

test("health evidence strips credentials, query and fragment", () => {
  assert.equal(
    sanitizeHealthTarget(
      "https://user:secret@example.com/health?token=x#private",
    ),
    "https://example.com/health",
  );
});

test("source inventory becomes deterministic SPDX packages", () => {
  const spdx = buildSpdx({
    sourceCommit: "a".repeat(40),
    generatedAt: "2026-08-10T00:00:00.000Z",
    projects: [{ name: "meterkit", version: "0.1.0", path: "." }],
  });
  assert.equal(spdx.spdxVersion, "SPDX-2.3");
  assert.equal(spdx.packages.length, 1);
  assert.equal(spdx.packages[0].name, "meterkit");
  assert.doesNotMatch(JSON.stringify(spdx), /secret|private key/i);
});
