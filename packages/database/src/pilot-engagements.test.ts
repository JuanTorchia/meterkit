import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  activationEventSchema,
  consentGrantSchema,
  pilotEngagementSchema,
} from "@usemeterkit/core";
import { PostgresStore } from "./index.js";

const url = process.env.DATABASE_TEST_URL;
const suite = url ? describe : describe.skip;
const owner = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
const other = "6NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUD";
let store: PostgresStore;

suite("paid pilot persistence", () => {
  beforeAll(async () => {
    store = PostgresStore.connect(url!);
    await store.migrate();
    await store.pool.query("TRUNCATE pilot_engagements CASCADE");
  });

  afterAll(async () => {
    await store.pool.query("TRUNCATE pilot_engagements CASCADE");
    await store.close();
  });

  it("isolates engagement evidence by owner and keeps classification immutable", async () => {
    const now = new Date().toISOString();
    const engagement = pilotEngagementSchema.parse({
      schemaVersion: 2,
      engagementId: crypto.randomUUID(),
      participantClass: "external_independent",
      offerVersion: "assisted-pilot-v1",
      disclosedPrice: { amount: "100", currency: "USD", unit: "integration" },
      surface: "express",
      startedAt: now,
      source: "test",
      assistanceMode: "docs_only",
      operationalOutcome: "active",
      createdAt: now,
      updatedAt: now,
    });
    await store.savePilotEngagement({ ...engagement, ownerWallet: owner });
    expect(
      await store.getPilotEngagementForOwner(owner, engagement.engagementId),
    ).toMatchObject({
      engagementId: engagement.engagementId,
      ownerWallet: owner,
    });
    expect(
      await store.getPilotEngagementForOwner(other, engagement.engagementId),
    ).toBeNull();
    await store.savePilotEngagement({
      ...engagement,
      participantClass: "synthetic",
      ownerWallet: owner,
      updatedAt: new Date(Date.now() + 1_000).toISOString(),
    });
    expect(
      (await store.getPilotEngagementForOwner(owner, engagement.engagementId))
        ?.participantClass,
    ).toBe("external_independent");
  });

  it("appends activation evidence and withdraws one consent scope", async () => {
    const engagement = (await store.listPilotEngagementsForOwner(owner))[0]!;
    const now = new Date().toISOString();
    await store.appendActivationEvent(
      activationEventSchema.parse({
        eventId: crypto.randomUUID(),
        engagementId: engagement.engagementId,
        stage: "challenge_received",
        outcome: "passed",
        occurredAt: now,
        recordedAt: now,
      }),
    );
    const consentId = crypto.randomUUID();
    await store.saveConsentGrant(
      consentGrantSchema.parse({
        consentId,
        engagementId: engagement.engagementId,
        scope: "public_attribution",
        status: "granted",
        termsVersion: "v1",
        capturedAt: now,
      }),
    );
    await store.saveConsentGrant(
      consentGrantSchema.parse({
        consentId,
        engagementId: engagement.engagementId,
        scope: "public_attribution",
        status: "withdrawn",
        termsVersion: "v1",
        capturedAt: now,
        withdrawnAt: new Date(Date.now() + 1_000).toISOString(),
      }),
    );
    const result = await store.pool.query<{ status: string }>(
      "SELECT status FROM pilot_consents WHERE engagement_id=$1 AND scope='public_attribution'",
      [engagement.engagementId],
    );
    expect(result.rows[0]?.status).toBe("withdrawn");
  });
});
