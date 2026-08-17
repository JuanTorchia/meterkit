import { describe, expect, it } from "vitest";

import { parseCliInvocation } from "./cli.js";
import { CliExitCode, formatJsonEnvelope, redactValue } from "./output.js";

describe("CLI output contract", () => {
  it("keeps stable documented exit codes", () => {
    expect(CliExitCode).toEqual({
      success: 0,
      checkFailed: 1,
      invalidInput: 2,
      environmentUnavailable: 3,
      paymentFailed: 4,
    });
  });

  it("parses only the bounded public command surface", () => {
    expect(parseCliInvocation(["doctor", "--json"])).toEqual({
      kind: "command",
      command: "doctor",
      arguments: ["--json"],
    });
    expect(() => parseCliInvocation(["fund-wallet"])).toThrow(
      "unknown command",
    );
  });

  it("wraps machine output in a versioned envelope", () => {
    expect(formatJsonEnvelope("doctor", { state: "passed" })).toBe(
      `${JSON.stringify({ schemaVersion: 1, command: "doctor", data: { state: "passed" } })}\n`,
    );
  });

  it("recursively redacts credentials, database URLs, and full proofs", () => {
    const result = redactValue({
      DATABASE_URL: "postgres://secret@localhost/db",
      privateKey: [1, 2, 3],
      paymentProof: "complete-proof",
      nested: { bearerToken: "token", recipient: "public-address" },
    });

    expect(result).toEqual({
      DATABASE_URL: "[REDACTED]",
      privateKey: "[REDACTED]",
      paymentProof: "[REDACTED]",
      nested: { bearerToken: "[REDACTED]", recipient: "public-address" },
    });
  });
});
