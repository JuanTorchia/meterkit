import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SOLANA_DEVNET,
  benchmarkRunSchema,
  publicPaymentReceiptSchema,
  paymentRecordSchema,
  productSchema,
  publicReleaseSchema,
} from "@usemeterkit/core";
import { PostgresStore } from "./index.js";

const url = process.env.DATABASE_TEST_URL;
const suite = url ? describe : describe.skip;
let store: PostgresStore;

suite("PostgresStore integration", () => {
  beforeAll(async () => {
    store = PostgresStore.connect(url!);
    await store.migrate();
    await store.pool.query(
      "TRUNCATE pilot_engagements, funding_awards, payments, products, wallet_sessions, wallet_challenges, idempotency_keys, agent_allowances, release_manifests, benchmark_runs, hosted_metadata_requests, users CASCADE",
    );
  });
  afterAll(async () => {
    await store.pool.query(
      "TRUNCATE pilot_engagements, funding_awards, payments, products, wallet_sessions, wallet_challenges, idempotency_keys, agent_allowances, release_manifests, benchmark_runs, hosted_metadata_requests, users CASCADE",
    );
    await store.close();
  });

  it("applies the paid-pilot migration idempotently", async () => {
    await store.migrate();
    const result = await store.pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' AND table_name = ANY($1::text[])
       ORDER BY table_name`,
      [["pilot_engagements", "pilot_activation_events", "pilot_consents"]],
    );
    expect(result.rows.map((row) => row.table_name)).toEqual([
      "pilot_activation_events",
      "pilot_consents",
      "pilot_engagements",
    ]);
  });

  it("persists products and atomically rejects payment replay", async () => {
    const product = productSchema.parse({
      id: "premium-weather",
      name: "Premium Weather API",
      description: "Test",
      resource: "http://localhost:3402/v1/weather/premium",
      priceAtomic: "10000",
      assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      payTo: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
      network: SOLANA_DEVNET,
    });
    const created = await store.create(product);
    expect(created.uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(await store.getByUid(created.uid)).toEqual(created);
    expect(await store.getByOwnerSlug(product.payTo, product.id)).toEqual(
      created,
    );
    expect(await store.getUniqueBySlug(product.id)).toEqual(created);
    expect(await store.listProductsForOwner(product.payTo)).toEqual([created]);
    expect(
      await store.listProductsForOwner("11111111111111111111111111111111"),
    ).toEqual([]);

    const secondOwner = "6NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUD";
    const second = await store.create({ ...product, payTo: secondOwner });
    expect(second.id).toBe(product.id);
    expect(second.uid).not.toBe(created.uid);
    expect(await store.getByOwnerSlug(secondOwner, product.id)).toEqual(second);
    expect(await store.getUniqueBySlug(product.id)).toBeNull();

    const payment = paymentRecordSchema.parse({
      id: crypto.randomUUID(),
      productId: product.id,
      payer: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
      payTo: product.payTo,
      mint: product.assetMint,
      amountAtomic: product.priceAtomic,
      network: SOLANA_DEVNET,
      signature: "integration-signature",
      settledAt: new Date().toISOString(),
      status: "confirmed",
    });
    const concurrent = await Promise.allSettled([
      store.save(payment),
      store.save({ ...payment, id: crypto.randomUUID() }),
    ]);
    expect(
      concurrent.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      concurrent.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(await store.has(payment.signature)).toBe(true);
    await expect(
      store.save({ ...payment, id: crypto.randomUUID() }),
    ).rejects.toThrow("PAYMENT_REPLAYED");
    expect(await store.list()).toHaveLength(1);
    expect(await store.listPaymentsForOwner(product.payTo)).toHaveLength(1);
    expect(
      await store.listPaymentsForOwner("11111111111111111111111111111111"),
    ).toEqual([]);
    expect(await store.listPaymentsForProduct(created.uid)).toHaveLength(1);
    expect(await store.listConfirmedSignatures()).toEqual([payment.signature]);
    expect(await store.markFinalized(payment.signature)).toBe(true);
    expect((await store.list())[0]?.status).toBe("finalized");

    await store.createSession(
      "session-token-hash",
      product.payTo,
      new Date(Date.now() + 60_000),
    );
    expect(await store.getSessionOwner("session-token-hash")).toBe(
      product.payTo,
    );
    await store.createSession(
      "expired-token-hash",
      product.payTo,
      new Date(Date.now() - 1),
    );
    expect(await store.getSessionOwner("expired-token-hash")).toBeNull();

    const idempotencyKey = "product-request-0001";
    const first = await store.createIdempotent(
      product,
      idempotencyKey,
      "same-hash",
    );
    const repeated = await store.createIdempotent(
      product,
      idempotencyKey,
      "same-hash",
    );
    expect(repeated).toEqual(first);
    await expect(
      store.createIdempotent(
        { ...product, name: "Changed product" },
        idempotencyKey,
        "different-hash",
      ),
    ).rejects.toThrow("IDEMPOTENCY_KEY_CONFLICT");

    const challenge = {
      nonceHash: "nonce-hash",
      wallet: product.payTo,
      message: "bounded signed message",
      requestHash: "request-hash",
      idempotencyKey: "challenge-request",
      expiresAt: new Date(Date.now() + 60_000),
    };
    await store.saveWalletChallenge(challenge, 2);
    const consumed = await Promise.all([
      store.consumeWalletChallenge(challenge.nonceHash),
      store.consumeWalletChallenge(challenge.nonceHash),
    ]);
    expect(consumed.filter(Boolean)).toHaveLength(1);
    expect(await store.consumeWalletChallenge(challenge.nonceHash)).toBeNull();

    await store.saveWalletChallenge(
      { ...challenge, nonceHash: "expired", expiresAt: new Date(0) },
      2,
    );
    const cleanup = await store.cleanupExpired();
    expect(cleanup.challenges).toBeGreaterThanOrEqual(1);
    expect(cleanup.sessions).toBeGreaterThanOrEqual(1);
    expect(await store.getSessionOwner("session-token-hash")).toBe(
      product.payTo,
    );

    const allowance = {
      address: "9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG",
      ownerWallet: product.payTo,
      delegateWallet: "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF",
      mint: product.assetMint,
      maxAtomic: "1000000",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      revokedAt: null,
      signature:
        "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE7NXuBzJ3EQV4CuxpSVELD3t1bs5",
    };
    await store.saveAllowance(allowance);
    expect(await store.listAllowancesForOwner(product.payTo)).toEqual([
      expect.objectContaining(allowance),
    ]);
    expect(
      await store.listAllowancesForOwner("11111111111111111111111111111111"),
    ).toEqual([]);
    expect(
      await store.revokeAllowance(
        "11111111111111111111111111111111",
        allowance.address,
      ),
    ).toBe(false);
    expect(await store.revokeAllowance(product.payTo, allowance.address)).toBe(
      true,
    );
    expect(
      (await store.listAllowancesForOwner(product.payTo))[0]?.revokedAt,
    ).not.toBeNull();
    expect(
      await store.getAllowanceForOwner(product.payTo, allowance.address),
    ).toMatchObject({ address: allowance.address, ownerWallet: product.payTo });
    expect(
      await store.getAllowanceForOwner(
        "11111111111111111111111111111111",
        allowance.address,
      ),
    ).toBeNull();
    expect(
      await store.deleteAllowanceMetadata(
        "11111111111111111111111111111111",
        allowance.address,
      ),
    ).toBe(false);

    const timestamp = new Date().toISOString();
    const receipt = publicPaymentReceiptSchema.parse({
      schemaVersion: 1,
      receiptId: crypto.randomUUID(),
      productId: product.id,
      network: SOLANA_DEVNET,
      assetMint: product.assetMint,
      amountAtomic: product.priceAtomic,
      recipient: product.payTo,
      payer: payment.payer,
      resource: product.resource,
      decision: "accepted",
      settlement: "confirmed",
      signatureFingerprint: "sha256:0123456789abcdef",
      policyDecisions: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      reasonCode: "SETTLEMENT_CONFIRMED",
    });
    await store.savePublicReceipt(receipt);
    expect(await store.getPublicReceipt(receipt.receiptId)).toEqual(receipt);
    const finalized = {
      ...receipt,
      settlement: "finalized" as const,
      updatedAt: new Date(Date.now() + 1_000).toISOString(),
      reasonCode: "SETTLEMENT_FINALIZED",
    };
    await store.savePublicReceipt(finalized);
    await expect(
      store.savePublicReceipt({
        ...receipt,
        updatedAt: new Date(Date.now() + 2_000).toISOString(),
      }),
    ).rejects.toThrow("RECEIPT_TRANSITION_REJECTED");
    const concurrentReceipts = await Promise.allSettled([
      store.savePublicReceipt({
        ...finalized,
        updatedAt: new Date(Date.now() + 3_000).toISOString(),
      }),
      store.savePublicReceipt({
        ...finalized,
        settlement: "failed",
        updatedAt: new Date(Date.now() + 4_000).toISOString(),
        reasonCode: "SETTLEMENT_FAILED",
      }),
    ]);
    expect(
      concurrentReceipts.filter((item) => item.status === "fulfilled"),
    ).toHaveLength(1);
  });

  it("keeps release and benchmark evidence immutable and metadata owner-isolated", async () => {
    const artifact = {
      name: "@usemeterkit/sdk",
      version: "0.2.0",
      registry: "https://registry.npmjs.org",
      integrity: `sha512-${Buffer.from("integrity").toString("base64")}`,
      tarballSize: 42_000,
      runtimeFiles: ["dist/index.js"],
      dependencies: {},
      peerDependencies: { express: ">=5" },
      engineRange: ">=22",
      license: "Apache-2.0",
      repository: "https://github.com/JuanTorchia/meterkit",
      sourceDirectory: "packages/sdk",
      supportStatus: "primary",
    } as const;
    const manifest = publicReleaseSchema.parse({
      schemaVersion: 1,
      version: "0.2.0",
      sourceCommit: "a".repeat(40),
      tag: "v0.2.0",
      packages: [artifact],
      compatibilityReport: "artifacts/compatibility.json",
      sbomReferences: ["artifacts/source.spdx.json"],
      provenanceStatus: "staged",
      migrationImpact: "compatible",
      rollback: "Reject the staged artifact before approval.",
    });
    await store.saveReleaseManifest(manifest);
    expect(await store.getReleaseManifest(manifest.version)).toEqual(manifest);
    await expect(store.saveReleaseManifest(manifest)).rejects.toThrow(
      "RELEASE_MANIFEST_IMMUTABLE",
    );

    const benchmark = benchmarkRunSchema.parse({
      schemaVersion: 1,
      runId: crypto.randomUUID(),
      sourceCommit: manifest.sourceCommit,
      startedAt: new Date().toISOString(),
      durationMs: 1_000,
      environment: { node: "24", cpu: "test", memoryMb: 1024, os: "linux" },
      workload: {
        scenario: "unpaid",
        concurrency: 10,
        requests: 100,
        timeoutMs: 5_000,
      },
      latency: {
        local: { p50Ms: 1, p95Ms: 2, p99Ms: 3 },
        external: { p50Ms: 0, p95Ms: 0, p99Ms: 0 },
      },
      outcomes: { rejected: 100, accepted: 0, unknown: 0, failed: 0 },
      protectedExecutions: 0,
      duplicateExecutions: 0,
      limitations: ["integration fixture"],
      artifacts: [],
    });
    await store.saveBenchmarkRun(benchmark);
    expect(await store.listBenchmarkRuns(manifest.sourceCommit)).toEqual([
      benchmark,
    ]);
    await expect(store.saveBenchmarkRun(benchmark)).rejects.toThrow(
      "BENCHMARK_RUN_IMMUTABLE",
    );

    const owner = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
    const other = "6NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUD";
    const request = await store.createHostedMetadataRequest(
      owner,
      "export",
      new Date(Date.now() + 60_000),
    );
    expect(await store.listHostedMetadataRequests(owner)).toEqual([request]);
    expect(await store.listHostedMetadataRequests(other)).toEqual([]);
    await expect(
      store.createHostedMetadataRequest(owner, "delete", new Date(0)),
    ).rejects.toThrow("INVALID_METADATA_REQUEST_EXPIRY");

    await store.createHostedMetadataRequest(
      owner,
      "delete",
      new Date(Date.now() + 1_000),
    );
    const cleanup = await store.cleanupExpired(new Date(Date.now() + 120_000));
    expect(cleanup.metadataRequests).toBe(2);
    expect(await store.listHostedMetadataRequests(owner)).toEqual([]);
  });

  it("serializes allowance reservations, revocation and unknown recovery", async () => {
    const owner = "5NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUC";
    const allowance = {
      address: "4NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUB",
      ownerWallet: owner,
      delegateWallet: "3NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUA",
      mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      maxAtomic: "20000",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      revokedAt: null,
      signature: null,
    };
    await store.saveAllowance(allowance);
    const reserve = (paymentKey: string) =>
      store.reserveAllowanceSpend({
        reservationId: crypto.randomUUID(),
        allowanceAddress: allowance.address,
        paymentKey,
        amountAtomic: "15000",
        expiresAt: new Date(Date.now() + 30_000),
      });
    const concurrent = await Promise.allSettled([
      reserve("pay-a"),
      reserve("pay-b"),
    ]);
    expect(
      concurrent.filter((item) => item.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      concurrent.filter((item) => item.status === "rejected"),
    ).toHaveLength(1);
    const accepted = concurrent.find(
      (
        item,
      ): item is PromiseFulfilledResult<Awaited<ReturnType<typeof reserve>>> =>
        item.status === "fulfilled",
    );
    expect(accepted).toBeDefined();
    expect(
      await store.consumeAllowanceSpend(accepted!.value.reservationId),
    ).toBe(true);
    expect(
      await store.consumeAllowanceSpend(accepted!.value.reservationId),
    ).toBe(false);
    await expect(reserve(accepted!.value.paymentKey)).rejects.toThrow(
      "ALLOWANCE_RESERVATION_REPLAYED",
    );

    expect(
      await store.setAllowanceObservationStatus(allowance.address, "unknown"),
    ).toBe(true);
    await expect(reserve("rpc-unknown")).rejects.toThrow(
      "ALLOWANCE_NOT_ACTIVE",
    );
    expect(
      await store.setAllowanceObservationStatus(allowance.address, "active"),
    ).toBe(true);
    const finalReservation = await store.reserveAllowanceSpend({
      reservationId: crypto.randomUUID(),
      allowanceAddress: allowance.address,
      paymentKey: "after-recovery",
      amountAtomic: "5000",
      expiresAt: new Date(Date.now() + 1_000),
    });
    const cleanup = await store.cleanupExpired(new Date(Date.now() + 2_000));
    expect(cleanup.allowanceReservations).toBe(1);
    expect(
      await store.releaseAllowanceSpend(finalReservation.reservationId),
    ).toBe(false);
    const reopened = await store.reserveAllowanceSpend({
      reservationId: crypto.randomUUID(),
      allowanceAddress: allowance.address,
      paymentKey: "after-expiry-cleanup",
      amountAtomic: "5000",
      expiresAt: new Date(Date.now() + 30_000),
    });
    expect(await store.releaseAllowanceSpend(reopened.reservationId)).toBe(
      true,
    );
    expect(await store.beginAllowanceRevocation(owner, allowance.address)).toBe(
      true,
    );
    await expect(reserve("after-revoke")).rejects.toThrow(
      "ALLOWANCE_NOT_ACTIVE",
    );
  });

  it("links GitHub once through a durable single-use OAuth state", async () => {
    const wallet = "2NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZT9";
    const otherWallet = "1NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZT8";
    const stateHash = "a".repeat(64);
    await store.createOAuthLinkState(
      wallet,
      stateHash,
      new Date(Date.now() + 60_000),
    );
    expect(await store.consumeOAuthLinkState(stateHash)).toBe(wallet);
    expect(await store.consumeOAuthLinkState(stateHash)).toBeNull();
    const identity = {
      subject: "12345678",
      login: "meterkit-pilot",
      avatarUrl: "https://avatars.githubusercontent.com/u/12345678?v=4",
      linkedAt: new Date().toISOString(),
    };
    await store.linkGitHubIdentity(wallet, identity);
    expect(await store.getGitHubIdentity(wallet)).toEqual(identity);
    expect(await store.getGitHubIdentity(otherWallet)).toBeNull();
    await expect(
      store.linkGitHubIdentity(otherWallet, identity),
    ).rejects.toThrow("GITHUB_IDENTITY_ALREADY_LINKED");

    const expiredHash = "b".repeat(64);
    await store.createOAuthLinkState(
      wallet,
      expiredHash,
      new Date(Date.now() + 1_000),
    );
    const cleanup = await store.cleanupExpired(new Date(Date.now() + 2_000));
    expect(cleanup.oauthLinkStates).toBe(1);
    expect(await store.consumeOAuthLinkState(expiredHash)).toBeNull();
  });
});
