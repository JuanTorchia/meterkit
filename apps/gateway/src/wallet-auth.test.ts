import { generateKeyPairSync, sign } from "node:crypto";
import bs58 from "bs58";
import { describe, expect, it } from "vitest";
import { WalletChallenges } from "./wallet-auth.js";

describe("WalletChallenges", () => {
  it("accepts one valid Ed25519 signature and rejects replay", async () => {
    const pair = generateKeyPairSync("ed25519");
    const rawPublicKey = pair.publicKey.export({ format: "der", type: "spki" }).subarray(-32);
    const wallet = bs58.encode(rawPublicKey);
    const challenges = new WalletChallenges();
    const context = {
      wallet, requestHash: "abc123", idempotencyKey: "request-123",
      audience: "https://meterkit.example", method: "POST" as const, path: "/v1/products",
    };
    const challenge = await challenges.issue(context);
    const signedMessage = Buffer.from(challenge.message);
    const auth = {
      wallet,
      nonce: challenge.nonce,
      signedMessage: signedMessage.toString("base64"),
      signature: sign(null, signedMessage, pair.privateKey).toString("base64"),
      requestHash: context.requestHash,
      idempotencyKey: context.idempotencyKey,
    };
    await expect(challenges.verify(auth)).resolves.toBe(true);
    await expect(challenges.verify(auth)).resolves.toBe(false);
  });

  it("rejects expired and modified challenges", async () => {
    const pair = generateKeyPairSync("ed25519");
    const wallet = bs58.encode(pair.publicKey.export({ format: "der", type: "spki" }).subarray(-32));
    const challenges = new WalletChallenges();
    const context = {
      wallet, requestHash: "abc123", idempotencyKey: "request-123",
      audience: "https://meterkit.example", method: "POST" as const, path: "/v1/products",
    };
    const challenge = await challenges.issue(context, 1_000);
    const message = Buffer.from(`${challenge.message}!`);
    await expect(challenges.verify({
      wallet,
      nonce: challenge.nonce,
      signedMessage: message.toString("base64"),
      signature: sign(null, message, pair.privateKey).toString("base64"),
      requestHash: context.requestHash,
      idempotencyKey: context.idempotencyKey,
    }, 1_001)).resolves.toBe(false);

    const expired = await challenges.issue(context, 1_000);
    const exact = Buffer.from(expired.message);
    await expect(challenges.verify({
      wallet,
      nonce: expired.nonce,
      signedMessage: exact.toString("base64"),
      signature: sign(null, exact, pair.privateKey).toString("base64"),
      requestHash: context.requestHash,
      idempotencyKey: context.idempotencyKey,
    }, 1_000 + 5 * 60_000 + 1)).resolves.toBe(false);
  });

  it("enforces a bounded number of active challenges per wallet", async () => {
    const pair = generateKeyPairSync("ed25519");
    const wallet = bs58.encode(pair.publicKey.export({ format: "der", type: "spki" }).subarray(-32));
    const challenges = new WalletChallenges(undefined, 2);
    const context = {
      wallet, requestHash: "abc123", idempotencyKey: "request-123",
      audience: "https://meterkit.example", method: "POST" as const, path: "/v1/products",
    };
    await challenges.issue(context);
    await challenges.issue(context);
    await expect(challenges.issue(context)).rejects.toThrow("TOO_MANY_ACTIVE_CHALLENGES");
  });
});
