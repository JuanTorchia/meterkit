import { expect, test } from "@playwright/test";

const wallet = "8NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUF";
const authorization = {
  schemaVersion: 1,
  authorizationAddress: "9NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUG",
  program: "De1egAFMkMWZSN5rYXRj9CAdheBamobVNubTsi9avR44",
  network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  kind: "fixed",
  owner: wallet,
  delegate: "7NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUE",
  assetMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  recipientScope: "6NXuBzJ3EQV4CuxpSVELD3t1bs5xZ6ocfGvwjFDbCZUD",
  resourceScopes: ["https://api.example.com/premium"],
  perRequestLimitAtomic: "10000",
  aggregateLimitAtomic: "50000",
  spentAtomic: "10000",
  reservedAtomic: "5000",
  remainingCapacityAtomic: "35000",
  startsAt: "2030-01-01T00:00:00.000Z",
  expiresAt: "2030-02-01T00:00:00.000Z",
  status: "unknown",
  creationTransaction: "1".repeat(64),
  observedCommitment: "unknown",
  observedAt: "2030-01-02T00:00:00.000Z",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ address }) => {
      const account = {
        address,
        publicKey: new Uint8Array(32),
        chains: ["solana:devnet"],
        features: ["solana:signMessage", "solana:signAndSendTransaction"],
        label: "MeterKit test wallet",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>",
      };
      const mock = {
        version: "1.0.0",
        name: "MeterKit E2E Wallet",
        icon: account.icon,
        chains: ["solana:devnet"],
        accounts: [account],
        features: {
          "standard:connect": {
            version: "1.0.0",
            connect: async () => ({ accounts: [account] }),
          },
          "standard:events": { version: "1.0.0", on: () => () => undefined },
          "solana:signMessage": {
            version: "1.0.0",
            signMessage: async (...inputs: Array<{ message: Uint8Array }>) =>
              inputs.map((input) => ({
                signedMessage: input.message,
                signature: new Uint8Array(64).fill(1),
              })),
          },
          "solana:signAndSendTransaction": {
            version: "1.0.0",
            supportedTransactionVersions: [0],
            signAndSendTransaction: async () => [
              { signature: new Uint8Array(64).fill(2) },
            ],
          },
        },
      };
      globalThis.addEventListener("wallet-standard:app-ready", ((
        event: CustomEvent,
      ) => event.detail.register(mock)) as EventListener);
      globalThis.dispatchEvent(
        new CustomEvent("wallet-standard:register-wallet", {
          detail: (api: { register: (wallet: unknown) => void }) =>
            api.register(mock),
        }),
      );
    },
    { address: wallet },
  );
  await page.route("**/v1/auth/session/challenge", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ nonce: "nonce", message: "bounded challenge" }),
    }),
  );
  await page.route("**/v1/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "synthetic-session" }),
    }),
  );
});

test("inspects unknown and finalized allowance states without exposing secrets", async ({
  page,
}) => {
  let reads = 0;
  let revoked = false;
  await page.route("**/v1/allowances", async (route) => {
    if (route.request().method() === "POST")
      return route.fulfill({
        status: 422,
        contentType: "application/json",
        body: '{"error":"rejected_fixture"}',
      });
    reads += 1;
    await new Promise((resolve) => setTimeout(resolve, 100));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        revoked
          ? {
              ...authorization,
              status: "revoked",
              observedCommitment: "finalized",
              revocationTransaction: "2".repeat(64),
            }
          : reads === 1
            ? authorization
            : {
                ...authorization,
                status: "active",
                observedCommitment: "finalized",
              },
      ]),
    });
  });
  await page.goto("/agent/allowances");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await page.getByRole("button", { name: "MeterKit E2E Wallet" }).click();
  await expect(page.getByText("unknown · unknown")).toBeVisible();
  await expect(page.getByText("0.035 / 0.05 USDC")).toBeVisible();
  await page.getByRole("button", { name: "Refresh allowances" }).click();
  await expect(page.getByText("active · finalized")).toBeVisible();

  await page.route("https://api.devnet.solana.com/**", async (route) => {
    const body = route.request().postDataJSON() as { method?: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        body.method === "getLatestBlockhash"
          ? {
              jsonrpc: "2.0",
              result: {
                value: {
                  blockhash: "11111111111111111111111111111111",
                  lastValidBlockHeight: 123,
                },
              },
            }
          : {
              jsonrpc: "2.0",
              result: {
                value: [{ confirmationStatus: "finalized", err: null }],
              },
            },
      ),
    });
  });
  await page.getByLabel("Delegate wallet").fill(authorization.delegate);
  await page.getByRole("button", { name: "Create fixed allowance" }).click();
  await expect(page.getByRole("status")).toContainText("422");

  await page.route("**/v1/allowances/*/revocation-pending", (route) =>
    route.fulfill({
      status: 202,
      contentType: "application/json",
      body: '{"status":"revocation_pending"}',
    }),
  );
  await page.route("**/v1/allowances/*/revoked", (route) => {
    revoked = true;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"status":"revoked"}',
    });
  });
  await page.getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByText("revoked · finalized")).toBeVisible();
  await expect(page.getByRole("link", { name: "Revoke ↗" })).toBeVisible();
  expect(await page.content()).not.toContain("synthetic-session");
});
