import assert from "node:assert/strict";
import test from "node:test";

import { extractDependencyPaths, manifestArtifact } from "./paths.mjs";

test("preserves every direct and transitive vulnerable version", () => {
  const roots = [
    {
      name: "@usemeterkit/sdk",
      version: "0.2.0",
      path: "/repo/packages/sdk",
      dependencies: {
        alpha: {
          name: "alpha",
          version: "1.0.0",
          dependencies: {
            vulnerable: { name: "vulnerable", version: "1.2.0" },
          },
        },
        vulnerable: { name: "vulnerable", version: "1.5.0" },
      },
    },
  ];

  const paths = extractDependencyPaths(roots, "vulnerable");
  assert.deepEqual(
    paths.map((path) =>
      path.packages.map((entry) => `${entry.name}@${entry.version}`),
    ),
    [
      ["@usemeterkit/sdk@0.2.0", "alpha@1.0.0", "vulnerable@1.2.0"],
      ["@usemeterkit/sdk@0.2.0", "vulnerable@1.5.0"],
    ],
  );
});

test("maps maintained and generated manifests to distinct artifact kinds", () => {
  assert.equal(
    manifestArtifact({
      path: "packages/sdk/package.json",
      manifest: { name: "@usemeterkit/sdk", version: "0.2.0" },
    }).kind,
    "public_package",
  );
  assert.equal(
    manifestArtifact({
      path: "packages/create-meterkit/templates/express/package.json",
      manifest: { name: "meterkit-express-api", private: true },
    }).kind,
    "generated_template",
  );
});
