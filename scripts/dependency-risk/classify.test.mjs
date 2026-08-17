import assert from "node:assert/strict";
import test from "node:test";

import { classifyDependencyPath } from "./classify.mjs";

test("keeps runtime payment-boundary reachability unknown without evidence", () => {
  assert.deepEqual(
    classifyDependencyPath({
      artifact: { kind: "public_package", id: "@usemeterkit/sdk" },
      declaredScope: "runtime",
      packages: [{ name: "@x402/core", version: "2.21.0" }],
      paymentBoundaryPackages: ["@x402/core"],
    }),
    {
      scope: "runtime",
      reachability: "unknown",
      releaseImpact: "blocking",
      requiresPaymentRegression: true,
    },
  );
});

test("does not represent a development-only path as runtime exposure", () => {
  assert.deepEqual(
    classifyDependencyPath({
      artifact: { kind: "development_tool", id: "root" },
      declaredScope: "development",
      packages: [{ name: "formatter", version: "1.0.0" }],
      paymentBoundaryPackages: [],
    }),
    {
      scope: "development",
      reachability: "unknown",
      releaseImpact: "scheduled",
      requiresPaymentRegression: false,
    },
  );
});

test("classifies generated projects separately from maintained examples", () => {
  assert.equal(
    classifyDependencyPath({
      artifact: { kind: "generated_template", id: "express-template" },
      declaredScope: "runtime",
      packages: [{ name: "express", version: "5.1.0" }],
      paymentBoundaryPackages: [],
    }).scope,
    "generated_project",
  );
});
