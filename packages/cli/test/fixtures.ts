export const DEVNET_NETWORK = "solana-devnet";
export const DEVNET_CAIP2 = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
export const TEST_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const RECIPIENT_ADDRESS = "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE";
export const PAYER_ADDRESS = "HjZRrfm6G9C7RdzbzQ7u98jp6iQuE4SYgfqkuRHUiQdb";

export const fixturePolicy = Object.freeze({
  network: DEVNET_CAIP2,
  mint: TEST_USDC_MINT,
  amountAtomic: "10000",
  recipient: RECIPIENT_ADDRESS,
  resource: "http://127.0.0.1:3402/premium",
});

export const fixtureRpcResponses = Object.freeze({
  devnetHealthy: {
    jsonrpc: "2.0",
    id: 1,
    result: { "solana-core": "test", "feature-set": 1 },
  },
  unavailable: { status: 503, body: "fixture unavailable" },
});

export const fixtureFacilitatorResponses = Object.freeze({
  healthy: { status: 200, body: { status: "ready", network: DEVNET_CAIP2 } },
  unavailable: { status: 503, body: { status: "unavailable" } },
});

/**
 * Deliberately public-only wallet metadata. Signing fixtures must be created in
 * a temporary directory by the test that consumes them and never committed.
 */
export const disposableWalletMetadata = Object.freeze({
  payer: PAYER_ADDRESS,
  recipient: RECIPIENT_ADDRESS,
  network: DEVNET_NETWORK,
});
