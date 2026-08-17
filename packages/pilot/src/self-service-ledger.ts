import { appendFile, readFile } from "node:fs/promises";
import {
  externalActivationEvidenceSchema,
  assertClassificationImmutable,
  qualifiesForCommercialGate,
  type ExternalActivationEvidence,
} from "./self-service-evidence.js";

export async function readSelfServiceLedger(path: string) {
  try {
    const source = await readFile(path, "utf8");
    return source
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => externalActivationEvidenceSchema.parse(JSON.parse(line)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function appendSelfServiceEvidence(
  path: string,
  raw: ExternalActivationEvidence,
) {
  const record = externalActivationEvidenceSchema.parse(raw);
  const existing = await readSelfServiceLedger(path);
  if (existing.some(({ evidenceId }) => evidenceId === record.evidenceId))
    throw new Error("EVIDENCE_ID_ALREADY_RECORDED");
  assertClassificationImmutable(
    existing.find(({ engagementId }) => engagementId === record.engagementId),
    record,
  );
  await appendFile(path, `${JSON.stringify(record)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function aggregateSelfServiceLedger(
  records: readonly ExternalActivationEvidence[],
) {
  const consented = records.filter(
    ({ consents }) =>
      consents.technicalParticipation === "granted" &&
      consents.privateEvidenceRetention === "granted" &&
      consents.aggregateReporting === "granted",
  );
  const external = consented.filter(
    ({ classification }) => classification === "external_independent",
  );
  const synthetic = consented.filter(
    ({ classification }) => classification !== "external_independent",
  );
  const count = (
    values: readonly ExternalActivationEvidence[],
    milestone: ExternalActivationEvidence["milestone"],
  ) =>
    new Set(
      values
        .filter(
          (item) => item.milestone === milestone && item.outcome === "passed",
        )
        .map(({ engagementId }) => engagementId),
    ).size;
  return {
    schemaVersion: 1 as const,
    external: {
      engagements: new Set(external.map(({ engagementId }) => engagementId))
        .size,
      first402: count(external, "first_402"),
      settlements: count(external, "settlement_finalized"),
      replayRejected: count(external, "replay_rejected"),
      daySevenEligible: new Set(
        external
          .filter(({ consents }) => consents.daySevenFollowup === "granted")
          .map(({ engagementId }) => engagementId),
      ).size,
    },
    synthetic: {
      engagements: new Set(synthetic.map(({ engagementId }) => engagementId))
        .size,
      first402: count(synthetic, "first_402"),
    },
    commercialGate: qualifiesForCommercialGate(external),
  };
}
