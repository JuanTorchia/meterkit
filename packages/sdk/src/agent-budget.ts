import { createHash, randomUUID } from "node:crypto";
import {
  agentAuthorizationViewSchema,
  type AgentAuthorizationView,
} from "@usemeterkit/core";

export type AgentBudgetStore = {
  reserveAllowanceSpend(input: {
    reservationId: string;
    allowanceAddress: string;
    paymentKey: string;
    amountAtomic: string;
    expiresAt: Date;
  }): Promise<unknown>;
  consumeAllowanceSpend(reservationId: string): Promise<boolean>;
  releaseAllowanceSpend(reservationId: string): Promise<boolean>;
};

export type AgentBudgetReservation = {
  reservationId: string;
  authorizationFingerprint: `sha256:${string}`;
  paymentFingerprint: `sha256:${string}`;
};

export class AgentBudgetGuard {
  readonly #authorization: AgentAuthorizationView;
  readonly #delegate: string;
  readonly #store: AgentBudgetStore;
  readonly #now: () => Date;

  constructor(input: {
    authorization: AgentAuthorizationView;
    delegate: string;
    store: AgentBudgetStore;
    now?: () => Date;
  }) {
    this.#authorization = agentAuthorizationViewSchema.parse(
      input.authorization,
    );
    this.#delegate = input.delegate;
    this.#store = input.store;
    this.#now = input.now ?? (() => new Date());
  }

  async reserve(input: {
    payer: string;
    network: string;
    assetMint: string;
    recipient: string;
    resource: string;
    amountAtomic: string;
    paymentPayload: unknown;
  }): Promise<AgentBudgetReservation> {
    const authorization = this.#authorization;
    const now = this.#now();
    const amount = BigInt(input.amountAtomic);
    const reject = (code: string): never => {
      throw new Error(code);
    };
    if (
      authorization.observedCommitment !== "finalized" ||
      authorization.status === "unknown"
    )
      reject("FINALITY_REQUIRED");
    if (authorization.status !== "active")
      reject(`AUTHORIZATION_${authorization.status.toUpperCase()}`);
    if (authorization.owner !== input.payer) reject("OWNER_MISMATCH");
    if (authorization.delegate !== this.#delegate) reject("DELEGATE_MISMATCH");
    if (authorization.network !== input.network) reject("NETWORK_MISMATCH");
    if (authorization.assetMint !== input.assetMint) reject("ASSET_MISMATCH");
    if (
      authorization.recipientScope &&
      authorization.recipientScope !== input.recipient
    )
      reject("RECIPIENT_MISMATCH");
    if (
      !authorization.resourceScopes.includes(normalizeResource(input.resource))
    )
      reject("RESOURCE_OUT_OF_SCOPE");
    if (Date.parse(authorization.expiresAt) <= now.getTime())
      reject("AUTHORIZATION_EXPIRED");
    if (Date.parse(authorization.startsAt) > now.getTime())
      reject("AUTHORIZATION_NOT_STARTED");
    if (amount <= 0n) reject("AMOUNT_INVALID");
    if (amount > BigInt(authorization.perRequestLimitAtomic))
      reject("PER_REQUEST_LIMIT_EXCEEDED");
    if (
      BigInt(authorization.spentAtomic) + amount >
      BigInt(authorization.aggregateLimitAtomic)
    )
      reject("AGGREGATE_LIMIT_EXCEEDED");
    const paymentFingerprint = fingerprint(stableJson(input.paymentPayload));
    const reservationId = randomUUID();
    await this.#store.reserveAllowanceSpend({
      reservationId,
      allowanceAddress: authorization.authorizationAddress,
      paymentKey: paymentFingerprint,
      amountAtomic: input.amountAtomic,
      expiresAt: new Date(
        Math.min(
          Date.parse(authorization.expiresAt),
          now.getTime() + 5 * 60_000,
        ),
      ),
    });
    return {
      reservationId,
      authorizationFingerprint: fingerprint(authorization.authorizationAddress),
      paymentFingerprint,
    };
  }

  consume(reservationId: string) {
    return this.#store.consumeAllowanceSpend(reservationId);
  }

  release(reservationId: string) {
    return this.#store.releaseAllowanceSpend(reservationId);
  }
}

function normalizeResource(raw: string) {
  try {
    const resource = new URL(raw);
    if (
      !["http:", "https:"].includes(resource.protocol) ||
      resource.username ||
      resource.password ||
      resource.hash
    )
      return "";
    if (resource.pathname.length > 1)
      resource.pathname = resource.pathname.replace(/\/+$/, "");
    return resource.toString();
  } catch {
    return "";
  }
}

function fingerprint(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 16)}` as const;
}

function stableJson(value: unknown) {
  return JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.fromEntries(
      Object.entries(item).sort(([left], [right]) => left.localeCompare(right)),
    );
  });
}
