# External pilot quickstart

This runbook takes an API or MCP developer through one complete MeterKit flow:
integration, policy verification, devnet settlement, protected response and
replay rejection. It uses only Solana devnet and test assets.

A read-only readiness report is useful but is not a completed pilot. Completion
requires a settlement through an endpoint controlled by the external developer.

## Before starting

- Use a non-sensitive test route and a disposable Solana devnet recipient.
- Use only faucet SOL and devnet USDC. Never use mainnet funds.
- Never give MeterKit a seed phrase, private key, `.env`, session token or payment
  proof.
- Record the start time immediately before adding MeterKit to the host project.
  Both time-to-402 and time-to-settlement use this same start event.
- Open the public
  [pilot-start form](https://github.com/JuanTorchia/meterkit/issues/new?template=pilot-start.yml)
  at that moment. Its issue creation time is the operational funnel timestamp.
- Choose a modality: self-service, a free guided 45-minute session, or
  self-service with asynchronous maintainer support. Count each call, chat or
  maintainer intervention needed to unblock the integration.

The public GitHub report cannot make your GitHub identity anonymous. If your
endpoint is private, report only its SHA-256 fingerprint as described in
[`pilot-evidence.md`](pilot-evidence.md).

## 1. Obtain and build the pinned workspace

Until the pilot CLI and SDK have a public package release, use a full commit SHA
so the integration is reproducible:

```bash
git clone https://github.com/JuanTorchia/meterkit.git
cd meterkit
git rev-parse HEAD
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @meterkit/sdk build
pnpm --filter @meterkit/pilot build
```

Save the full commit SHA. It is the SDK identifier in the pilot report.

## 2. Protect one developer-owned test endpoint

Add `createX402Middleware` to one route controlled by the participant, following
the root README integration example. Configure:

- the Solana devnet network;
- the devnet USDC mint;
- a disposable public recipient wallet;
- a small test price and maximum;
- the facilitator and devnet RPC;
- a protected handler with a non-secret response.

Keep signing material in the participant's local client process. MeterKit does
not need or receive a wallet key.

Start the host service and make an unpaid request to the protected route:

```bash
curl --silent --show-error --dump-header pilot-402.headers \
  --output /dev/null \
  https://your-api.test/premium
```

Acceptance: the response is HTTP `402` and contains `PAYMENT-REQUIRED`. Delete
`pilot-402.headers` after calculating the challenge fingerprint; never attach
that file to a GitHub issue.

## 3. Enforce the endpoint policy with `pilot:verify`

Create a verifier configuration for the participant's endpoint:

```bash
pnpm pilot:init -- https://your-api.test/premium
```

Edit `meterkit-pilot.json` and replace every expected value:

- `network`: the exact Solana devnet network from the challenge;
- `mint`: the exact devnet USDC mint;
- `maxAmountAtomic`: the participant's maximum acceptable charge;
- `recipient`: the participant's exact disposable devnet recipient.

Then run:

```bash
pnpm pilot:verify -- \
  --config meterkit-pilot.json \
  --out pilot-report.json
```

Acceptance:

- the command exits successfully and `passed` is `true`;
- network, mint, recipient and maximum amount each show `enforced: true`;
- the report describes the participant's endpoint, not only MeterKit's hosted
  weather demo.

`pnpm pilot:check` may separately verify the hosted MeterKit infrastructure, but
it is optional readiness evidence and never counts as an external pilot.

Review `pilot-report.json` locally. It contains the endpoint URL. Do not attach
it publicly if that URL or its query string is private; submit the safe fields
and fingerprints defined in [`pilot-evidence.md`](pilot-evidence.md).

## 4. Complete one devnet settlement

Use the local signer and x402 client described in the root README's **Pago
devnet** section and `examples/client`. Fund the disposable payer only with
faucet SOL and devnet USDC. If required, create the recipient's devnet USDC
associated token account as documented there.

Before sending payment, record:

- the challenge fingerprint;
- an opaque, non-secret correlation ID for this attempt;
- the endpoint fingerprint and MeterKit commit or package version.

Send one paid request through the participant's protected endpoint. Confirm all
of the following:

1. the transaction finalized and opens in Solana Explorer with
   `cluster=devnet`;
2. the exact test USDC amount reached the recipient from `pilot-report.json`;
3. the protected response was returned only after settlement;
4. the receipt or request log contains the same non-secret correlation ID.

Do not publish the payment header or protected response body.

## 5. Prove replay rejection

Repeat the request with the exact same payment proof. Do not create a second
payment.

Acceptance:

- the gateway rejects the reused proof;
- the protected handler does not execute a second time;
- the recipient balance does not increase a second time;
- the tester records only the HTTP status and public error code, not the proof
  or private response.

If any condition fails, the run is not a completed pilot. Record the failure and
ask for support instead of opening a completed report.

## 6. Submit the public evidence

Review the privacy checklist and fingerprint commands in
[`pilot-evidence.md`](pilot-evidence.md), then open the
[devnet pilot report](https://github.com/JuanTorchia/meterkit/issues/new?template=pilot-report.yml).

The report asks for:

- project category, modality and support intervention count;
- the pilot-start issue URL;
- proof that the endpoint is controlled by the participant;
- SDK version or full commit;
- endpoint and challenge fingerprints;
- time to first 402 and settlement;
- a devnet Explorer transaction;
- a non-secret request or receipt correlation ID;
- replay status/error code and confirmation that the handler did not rerun;
- friction, immediate outcome, product preference and citation consent.

A public issue always exposes the submitter's GitHub handle. Selecting
aggregate-only consent prevents MeterKit from naming or quoting the participant
outside the issue; it does not make the issue anonymous.

## What may be counted

A completed external pilot has one participant-controlled endpoint, one
correlated devnet settlement and protected response, and one rejected replay.
Running `pilot:check`, verifying MeterKit's own hosted endpoint, or using a
MeterKit-controlled wallet is readiness or internal synthetic validation—not an
external pilot, user, customer or traction.
