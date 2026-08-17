import assert from "node:assert/strict";
import test from "node:test";
import { compareArtifactGraph } from "./artifact-graph.mjs";

test("accepts an exact packed graph independent of ordering", () => {
  const workspace = [
    { name: "sdk", version: "1", dependencies: { zod: "4", x402: "2.22" } },
  ];
  const packed = [
    { name: "sdk", version: "1", dependencies: { x402: "2.22", zod: "4" } },
  ];
  assert.equal(compareArtifactGraph(workspace, packed).passed, true);
});

test("rejects workspace versus packed graph drift", () => {
  const result = compareArtifactGraph(
    [{ name: "sdk", version: "1", dependencies: { x402: "2.22" } }],
    [{ name: "sdk", version: "1", dependencies: { x402: "2.21" } }],
  );
  assert.equal(result.errors[0].code, "PACKED_GRAPH_DRIFT");
});
