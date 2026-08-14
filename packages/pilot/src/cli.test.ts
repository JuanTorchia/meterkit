import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { createActivationReport } from "./activation.js";

describe("pilot CLI", () => {
  it("uses a stable nonzero exit for invalid commands", () => {
    const result = pilotCli(["unknown"]);
    expect(result.status).toBe(1);
  });
  it("validates and exports a consented activation report", () => {
    const directory = mkdtempSync(join(tmpdir(), "meterkit-cli-"));
    const input = join(directory, "input.json");
    const output = join(directory, "output.json");
    writeFileSync(
      input,
      JSON.stringify(
        createActivationReport({ consent: true, assistance: "none" }),
      ),
    );
    const result = pilotCli(["activation", "--input", input, "--out", output]);
    expect(result.status).toBe(0);
    expect(existsSync(output)).toBe(true);
  });
  it("deletes a local activation report and leaves only a minimized receipt", () => {
    const directory = mkdtempSync(join(tmpdir(), "meterkit-cli-delete-"));
    const input = join(directory, "activation.json");
    const receipt = join(directory, "deletion.json");
    writeFileSync(
      input,
      JSON.stringify(
        createActivationReport({
          consent: true,
          assistance: "none",
          participantAlias: "pilot-private",
        }),
      ),
    );
    const result = pilotCli([
      "activation-delete",
      "--input",
      input,
      "--receipt",
      receipt,
    ]);
    expect(result.status).toBe(0);
    expect(existsSync(input)).toBe(false);
    expect(JSON.parse(readFileSync(receipt, "utf8"))).not.toHaveProperty(
      "participantAlias",
    );
  });

  it("creates, stages and minimizes a v2 engagement without public attribution", () => {
    const directory = mkdtempSync(join(tmpdir(), "meterkit-cli-v2-"));
    const started = join(directory, "started.json");
    const consented = join(directory, "consented.json");
    const staged = join(directory, "staged.json");
    const exported = join(directory, "export.json");
    expect(
      pilotCli([
        "engagement-init",
        "--surface",
        "mcp",
        "--participant-class",
        "external_independent",
        "--assistance",
        "docs_only",
        "--out",
        started,
      ]).status,
    ).toBe(0);
    expect(
      pilotCli([
        "engagement-consent",
        "--input",
        started,
        "--scope",
        "technical_participation",
        "--status",
        "granted",
        "--terms",
        "terms-v1",
        "--out",
        consented,
      ]).status,
    ).toBe(0);
    expect(
      pilotCli([
        "engagement-stage",
        "--input",
        consented,
        "--stage",
        "challenge_received",
        "--outcome",
        "passed",
        "--out",
        staged,
      ]).status,
    ).toBe(0);
    expect(
      pilotCli(["engagement-export", "--input", staged, "--out", exported])
        .status,
    ).toBe(0);
    const result = JSON.parse(readFileSync(exported, "utf8"));
    expect(result.schemaVersion).toBe(2);
    expect(result.attribution).toBe("private");
  });

  it("deletes v2 local evidence with a minimized deletion receipt", () => {
    const directory = mkdtempSync(join(tmpdir(), "meterkit-cli-v2-delete-"));
    const input = join(directory, "input.json");
    const receipt = join(directory, "receipt.json");
    expect(
      pilotCli([
        "engagement-init",
        "--surface",
        "express",
        "--participant-class",
        "synthetic",
        "--assistance",
        "none",
        "--out",
        input,
      ]).status,
    ).toBe(0);
    expect(
      pilotCli(["engagement-delete", "--input", input, "--receipt", receipt])
        .status,
    ).toBe(0);
    expect(existsSync(input)).toBe(false);
    expect(JSON.parse(readFileSync(receipt, "utf8"))).toMatchObject({
      schemaVersion: 2,
      deletionScope: "local-pilot-engagement-file",
    });
  });
});

function pilotCli(args: string[]) {
  return spawnSync(process.execPath, ["dist/cli.js", ...args], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
  });
}
