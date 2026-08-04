import { createPublicKey, randomBytes, verify } from "node:crypto";
import bs58 from "bs58";

type Challenge = {
  wallet: string;
  message: string;
  expiresAt: number;
  requestHash: string;
  idempotencyKey: string;
};

export class WalletChallenges {
  readonly #challenges = new Map<string, Challenge>();

  issue(input: {
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
    this.#challenges.set(nonce, {
      wallet: input.wallet,
      message,
      expiresAt,
      requestHash: input.requestHash,
      idempotencyKey: input.idempotencyKey,
    });
    return { nonce, message, expiresAt: new Date(expiresAt).toISOString() };
  }

  verify(input: {
    wallet: string;
    nonce: string;
    signedMessage: string;
    signature: string;
    requestHash: string;
    idempotencyKey: string;
  }, now = Date.now()) {
    const challenge = this.#challenges.get(input.nonce);
    // Consume before cryptographic verification so every challenge is single-use.
    this.#challenges.delete(input.nonce);
    if (!challenge || challenge.wallet !== input.wallet ||
        challenge.requestHash !== input.requestHash ||
        challenge.idempotencyKey !== input.idempotencyKey ||
        challenge.expiresAt < now) return false;

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
