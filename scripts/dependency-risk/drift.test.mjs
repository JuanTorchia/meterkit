import assert from "node:assert/strict";
import test from "node:test";
import { compareMaintainedTemplate } from "./drift.mjs";

test("detects maintained example and generated template drift", () => {
  const example = { dependencies: { next: "16.3.1", react: "19.2.8" } };
  assert.equal(
    compareMaintainedTemplate(
      example,
      { dependencies: { next: "16.3.1", react: "19.2.8" } },
      ["next", "react"],
    ).passed,
    true,
  );
  assert.equal(
    compareMaintainedTemplate(
      example,
      { dependencies: { next: "16.2.12", react: "19.2.8" } },
      ["next", "react"],
    ).errors[0].code,
    "TEMPLATE_DEPENDENCY_DRIFT",
  );
});
