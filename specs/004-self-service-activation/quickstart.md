# Validation Quickstart: Self-Service Activation

This is the implementation verification sequence. It deliberately separates
source-tree confidence, published-package confidence and human adoption.

## 1. Pre-publish packed-artifact gate

From a clean temporary directory, pack the initializer, CLI, SDK and database
packages. For every Express/Next/Hono/MCP surface with npm and pnpm:

1. invoke the exact non-interactive initializer contract;
2. assert there are no workspace or `file:` dependencies;
3. install with the selected manager;
4. use only the generated env file and documented commands;
5. start the service and run its local `meterkit check`;
6. assert a decoded devnet 402 with exact recipient, mint, amount and resource;
7. stop and clean the temporary project.

Also simulate a TTY for the bare guided command and test non-TTY missing-value
failures. Do not inject `MERCHANT_WALLET` directly into the child process.

## 2. Durable lifecycle gate

For every generated surface, start a disposable PostgreSQL instance, select
postgres durability and run the public migration command. With a disposable
devnet payer:

1. run `meterkit doctor` and preserve sanitized output;
2. run `meterkit pay --replay` with enforced policy limits;
3. assert exactly one settlement acceptance and protected execution;
4. restart the generated service;
5. replay the consumed proof through the test harness;
6. assert `PAYMENT_REPLAYED` and zero additional protected execution;
7. test two concurrent saves and require exactly one success;
8. break connectivity/migration and assert startup fails without memory fallback.

## 3. Recovery matrix

Test invalid/missing recipient, env file, Node version, RPC network, endpoint,
challenge policy, facilitator, token account, test balance, database connection,
settlement timeout and Explorer disagreement separately. Every result must be
sanitized, use the correct four-state diagnostic result and contain a bounded
recovery action. Unknown infrastructure state must remain unknown/unavailable.

## 4. Post-publish registry gate

After publishing an exact version, repeat the eight Ubuntu npm/pnpm × surface
cells using only registry artifacts and record integrity/resolved URLs. Run npm
Express+Next anchors on macOS and Windows. Do not move the recommended `latest`
CTA to a version until all supported registry cells pass.

## 5. Public trust gate

Verify the homepage, root README, initializer README and canonical EN/ES guides
agree on the command, supported matrix, devnet limitation, memory warning,
security/support identity, free uncompensated beta and separate optional USD 100
service. Ensure no external evidence is inferred from downloads or CI.

## 6. Five-person beta

Give each unfamiliar external evaluator only the public URL and observe without
intervening until requested. Record start, first 402, settlement, protected
response, replay, time and intervention state with scoped consent. Publish
synthetic versus external results separately, including unknown and abandoned
runs. Apply the commercial claim gate only after the cohort evidence exists.
