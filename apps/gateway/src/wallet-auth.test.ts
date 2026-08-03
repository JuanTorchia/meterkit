import { generateKeyPairSync, sign } from "node:crypto";
import bs58 from "bs58";
import { describe, expect, it } from "vitest";
import { WalletChallenges } from "./wallet-auth.js";

describe("WalletChallenges", () => {
  it("accepts one valid Ed25519 signature and rejects replay", () => {
    const pair = generateKeyPairSync("ed25519");
    const rawPublicKey = pair.publicKey.export({ format: "der", type: "spki" }).subarray(-32);
    const wallet = bs58.encode(rawPublicKey);
    const challenges = new WalletChallenges();
    const challenge = challenges.issue(wallet);
    const signedMessage = Buffer.from(challenge.message);
    const auth = {
      wallet,
      nonce: challenge.nonce,
      signedMessage: signedMessage.toString("base64"),
      signature: sign(null, signedMessage, pair.privateKey).toString("base64"),
    };
    expect(challenges.verify(auth)).toBe(true);
    expect(challenges.verify(auth)).toBe(false);
  });

  it("rejects expired and modified challenges", () => {
    const pair = generateKeyPairSync("ed25519");
    const wallet = bs58.encode(pair.publicKey.export({ format: "der", type: "spki" }).subarray(-32));
    const challenges = new WalletChallenges();
    const challenge = challenges.issue(wallet, 1_000);
    const message = Buffer.from(`${challenge.message}!`);
    expect(challenges.verify({
      wallet,
      nonce: challenge.nonce,
      signedMessage: message.toString("base64"),
      signature: sign(null, message, pair.privateKey).toString("base64"),
    }, 1_001)).toBe(false);

    const expired = challenges.issue(wallet, 1_000);
    const exact = Buffer.from(expired.message);
    expect(challenges.verify({
      wallet,
      nonce: expired.nonce,
      signedMessage: exact.toString("base64"),
      signature: sign(null, exact, pair.privateKey).toString("base64"),
    }, 1_000 + 5 * 60_000 + 1)).toBe(false);
  });
});
