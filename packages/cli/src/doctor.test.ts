import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { doctorProject } from "./doctor.js";
import { formatJsonEnvelope } from "./output.js";

describe("doctor", () => {
  it("distinguishes failures and unavailable dependencies with remediation", async () => {
    const project = await mkdtemp(join(tmpdir(), "meterkit-doctor-"));
    await writeFile(
      join(project, ".env"),
      "MERCHANT_WALLET=invalid\nDURABILITY_MODE=postgres\nDATABASE_URL=postgresql://secret:password@127.0.0.1:1/private\n",
    );
    const request = vi.fn(async () => {
      throw new Error("offline");
    });
    const report = await doctorProject({
      project,
      url: "http://localhost:3000/premium",
      allowLocalhost: true,
      fetch: request,
      timeoutMs: 10,
      nodeVersion: "20.0.0",
    });
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "NODE_UNSUPPORTED",
          state: "failed",
          remediation: expect.any(String),
        }),
        expect.objectContaining({ code: "RECIPIENT_INVALID", state: "failed" }),
        expect.objectContaining({
          code: "DATABASE_UNAVAILABLE",
          state: "unavailable",
        }),
        expect.objectContaining({
          code: "RPC_UNAVAILABLE",
          state: "unavailable",
        }),
        expect.objectContaining({
          code: "FACILITATOR_UNAVAILABLE",
          state: "unavailable",
        }),
      ]),
    );
    const output = formatJsonEnvelope("doctor", report);
    expect(output).not.toContain("secret:password");
    expect(output).not.toContain("/private");
  });

  it("reports missing configuration without throwing", async () => {
    const project = await mkdtemp(join(tmpdir(), "meterkit-doctor-empty-"));
    const report = await doctorProject({
      project,
      fetch: vi.fn(async () => {
        throw new Error("offline");
      }),
      timeoutMs: 10,
    });
    expect(report.findings).toContainEqual(
      expect.objectContaining({ code: "ENV_MISSING", state: "failed" }),
    );
  });
});
