import { createHash, createPublicKey, randomBytes, verify } from "node:crypto";
import bs58 from "bs58";
import type { WalletChallengeRecord } from "@usemeterkit/database";

export interface WalletChallengeStore {
  saveWalletChallenge(challenge: WalletChallengeRecord, maxActive: number): Promise<void>;
  consumeWalletChallenge(nonceHash: string): Promise<WalletChallengeRecord | null>;
}

export class MemoryWalletChallengeStore implements WalletChallengeStore {
  readonly #challenges = new Map<string, WalletChallengeRecord>();

  async saveWalletChallenge(challenge: WalletChallengeRecord, maxActive: number) {
    const now = Date.now();
    for (const [key, value] of this.#challenges) {
      if (value.expiresAt.getTime() <= now) this.#challenges.delete(key);
    }
    const active = [...this.#challenges.values()]
      .filter((value) => value.wallet === challenge.wallet && value.expiresAt.getTime() > now);
    if (active.length >= maxActive) throw new Error("TOO_MANY_ACTIVE_CHALLENGES");
    this.#challenges.set(challenge.nonceHash, challenge);
  }

  async consumeWalletChallenge(nonceHash: string) {
    const challenge = this.#challenges.get(nonceHash) ?? null;
    this.#challenges.delete(nonceHash);
    return challenge;
  }
};

export class WalletChallenges {
  constructor(
    private readonly store: WalletChallengeStore = new MemoryWalletChallengeStore(),
    private readonly maxActivePerWallet = 5,
  ) {}

  async issue(input: {
    wallet: string;
    requestHash: string;
    idempotencyKey: string;
    audience: string;
    method: "POST";
    path: string;
  }, now = Date.now()) {
    const nonce = randomBytes(24).toString("base64url");
    const expiresAt = now + 5 * 60_000;
    const message = [
      "MeterKit product authorization",
      `Audience: ${input.audience}`,
      `Method: ${input.method}`,
      `Path: ${input.path}`,
      `Wallet: ${input.wallet}`,
      `Request-SHA256: ${input.requestHash}`,
      `Idempotency-Key: ${input.idempotencyKey}`,
      `Nonce: ${nonce}`,
      `Expires: ${new Date(expiresAt).toISOString()}`,
    ].join("\n");
    await this.store.saveWalletChallenge({
      nonceHash: hashNonce(nonce),
      wallet: input.wallet,
      message,
      expiresAt: new Date(expiresAt),
      requestHash: input.requestHash,
      idempotencyKey: input.idempotencyKey,
    }, this.maxActivePerWallet);
    return { nonce, message, expiresAt: new Date(expiresAt).toISOString() };
  }

  async verify(input: {
    wallet: string;
    nonce: string;
    signedMessage: string;
    signature: string;
    requestHash: string;
    idempotencyKey: string;
  }, now = Date.now()) {
    const challenge = await this.store.consumeWalletChallenge(hashNonce(input.nonce));
    // Consume before cryptographic verification so every challenge is single-use.
    if (!challenge || challenge.wallet !== input.wallet ||
        challenge.requestHash !== input.requestHash ||
        challenge.idempotencyKey !== input.idempotencyKey ||
        challenge.expiresAt.getTime() < now) return false;

    try {
      const signedMessage = Buffer.from(input.signedMessage, "base64");
      if (!signedMessage.equals(Buffer.from(challenge.message, "utf8"))) return false;
      const publicKeyBytes = bs58.decode(input.wallet);
      if (publicKeyBytes.length !== 32) return false;
      const spki = Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(publicKeyBytes),
      ]);
      return verify(
        null,
        signedMessage,
        createPublicKey({ key: spki, format: "der", type: "spki" }),
        Buffer.from(input.signature, "base64"),
      );
    } catch {
      return false;
    }
  }
}

function hashNonce(nonce: string) {
  return createHash("sha256").update(nonce).digest("hex");
}
