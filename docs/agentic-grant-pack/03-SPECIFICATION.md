# MeterKit grant milestone specification

Status: **implementation-backed specification reconstructed from the working MVP**.
It records current acceptance criteria and is not represented as a document that
predated the implementation.

## Problem

Independent API and AI-tool developers need a way to charge global clients
without requiring cards, accounts, API-key billing or custody of client funds.

## Primary user

A developer with an existing Node.js API or MCP server who wants to receive USDC
directly in a Solana wallet.

## Core user story

As a provider, I can define a USDC price and recipient wallet, protect an
endpoint with a small middleware integration, receive direct settlement and see
the verified payment in a dashboard.

## Functional requirements

### FR-01 — x402 challenge

An unpaid request must return HTTP 402 with unambiguous network, mint, amount,
recipient and expiration requirements.

### FR-02 — exact settlement

Protected content must be returned only after verifying the expected Solana
cluster, USDC mint, atomic amount, payer debit, provider credit and successful
transaction status.

### FR-03 — non-custodial transfer

Payment must settle directly from the client to the provider. MeterKit must not
request or store a seed phrase or private key.

### FR-04 — replay and idempotency

A settlement proof must be consumable once. Concurrent duplicate requests must
not create duplicate sales or protected operations.

### FR-05 — verifiable receipt

The provider dashboard must display the payment status, amount and an Explorer
link for the transaction.

### FR-06 — developer integration

The middleware must be distributable as a TypeScript package and usable by an
existing Node.js API with a small configuration surface.

### FR-07 — useful paid MCP tool

Solana Project Scout must return a compact, dated and source-linked report based
only on permitted public information. A preview may be free; subsequent/full
usage must support x402 payment.

### FR-08 — bounded agent spending

Allowance builders must require a positive maximum and future expiration and
must provide explicit revocation without exposing private keys.

## Security invariants

- Devnet and mainnet configuration cannot be mixed silently.
- Recipient, mint and amount are checked independently of client claims.
- Expired challenges and receipts fail closed.
- Payment signatures are unique per network.
- Logs exclude private keys, seed phrases and complete sensitive payment
  payloads.
- Mainnet operation and production deployment are outside this grant milestone.

## Grant milestone acceptance

The milestone is accepted when a fresh evaluator can follow the README, call the
public devnet protected endpoint, observe a 402 challenge, complete a devnet USDC
payment, receive the protected result, find the sale in the dashboard, open the
Explorer transaction and observe that replay fails. The repository must also
include the paid MCP path, allowance/revocation demonstration and passing CI.

## Explicit non-goals

- issuing a token;
- custody, yield, trading or investment advice;
- mainnet launch;
- fiat on/off-ramp;
- production-grade accounting or tax reporting;
- speculative features that delay the verified payment flow.
