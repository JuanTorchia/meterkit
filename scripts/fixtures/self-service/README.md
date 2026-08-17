# Self-service test fixtures

These fixtures isolate CLI contract tests from live Solana, facilitator and
provider availability. They contain public addresses and sanitized protocol
responses only—never keypairs, payment headers or complete transaction
signatures.

Fixture categories:

- provider: valid 402, invalid policy, protected response and unavailable;
- RPC: devnet identity, timeout, rate limit and contradictory/unknown state;
- facilitator: ready, rejected, unavailable and timeout;
- wallet: public payer/recipient metadata and ATA/readiness states.

Tests that need signing material must generate a disposable keypair inside a
permission-restricted temporary directory and delete it in cleanup. Live devnet
evidence belongs in the server-run validation stage, not in these unit fixtures.
