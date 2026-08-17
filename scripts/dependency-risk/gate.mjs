import { sha256 } from "./model.mjs";

export function evaluateDependencyGate({
  inventory,
  exceptions = [],
  evidence,
  actual = {},
  now = new Date(),
}) {
  const rules = [];
  const add = (code, passed, details = {}) =>
    rules.push({ code, passed, ...details });
  add(
    "SOURCES_COMPLETE",
    (inventory.errors ?? []).every(
      ({ code }) => code !== "REQUIRED_SOURCE_UNAVAILABLE",
    ),
  );
  add(
    "NO_UNRESOLVED_SEVERE_FINDINGS",
    !(inventory.findings ?? []).some(
      ({ severity, lifecycle }) =>
        ["critical", "high"].includes(severity) &&
        !["remediated", "verified", "accepted"].includes(lifecycle),
    ),
  );
  add(
    "EXCEPTIONS_CURRENT",
    exceptions.every(
      ({ status, expiresAt }) =>
        status === "active" && new Date(expiresAt).getTime() > now.getTime(),
    ),
  );
  add("EVIDENCE_PRESENT", Boolean(evidence));
  add(
    "LOCKFILE_BOUND",
    Boolean(evidence) &&
      evidence.lockfileDigest === sha256(actual.lockfile ?? ""),
  );
  add(
    "INVENTORY_BOUND",
    Boolean(evidence) && evidence.inventoryDigest === sha256(inventory),
  );
  add(
    "CHECKS_COMPLETE",
    Boolean(evidence) &&
      Object.values(evidence.outcomes ?? {}).every((outcome) =>
        ["passed", "not_required"].includes(outcome),
      ),
  );
  return {
    schemaVersion: 1,
    gate: rules.every(({ passed }) => passed)
      ? "passed"
      : rules.some(
            ({ code, passed }) =>
              !passed &&
              ["SOURCES_COMPLETE", "EVIDENCE_PRESENT"].includes(code),
          )
        ? "incomplete"
        : "failed",
    rules,
  };
}
