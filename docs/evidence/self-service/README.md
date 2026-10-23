# Self-service 0.3.1 release-candidate evidence

Evidence date: 2026-08-17 UTC. Execution host: Linux server, Node 22.22.1,
pnpm 11.10.0. This is synthetic engineering evidence and is not external
adoption.

## Completed

- Packed local artifacts for core, database, SDK, CLI and initializer.
- Generated and installed all eight npm/pnpm × Express/Next/Hono/MCP cells in
  clean temporary directories without workspace resolution in the generated
  projects.
- Express, Next and Hono returned a valid decoded HTTP 402 for both supported
  package managers. MCP emitted its separately labeled native stdio challenge.
- PostgreSQL adapter tests proved one atomic consume, sanitized storage,
  middleware protected-handler execution exactly once under concurrency, and
  replay rejection after recreating the store.
- Live Solana devnet lifecycle passed for generated Express, Next Route and
  Hono projects using packed 0.3.1 candidate artifacts and PostgreSQL. Each
  surface settled exactly `10000` atomic test-USDC, produced concurrent statuses
  `200/402`, executed the protected handler exactly once, and rejected the same
  proof both immediately and after restart with status `402`.
- The live run exposed and fixed an authorization-order defect: upstream x402
  adapters buffer the handler before settlement and treat after-settlement hook
  failures as observational. MeterKit now reserves a sanitized proof
  fingerprint atomically before the handler; PostgreSQL uniqueness is the
  cross-process authority. Regression tests prove one reservation and one
  handler under concurrency.
- Recovery matrix covered missing/invalid config, unsupported Node, RPC outage,
  wrong network, missing token account, facilitator/endpoint/database outage,
  settlement timeout and Explorer disagreement without false success.
- Full Vitest run passed 242 tests in 53 files, with 10 PostgreSQL tests skipped
  by the default run and then executed separately against PostgreSQL: 10/10.
  The Node script suite passed 22/22.
- Real Chromium Playwright verification passed 14/14 across desktop, mobile,
  English, Spanish, Portuguese, keyboard, loading, recovery and console checks.
- Documentation parity passed for 2 maintained locales and 7 pages per locale
  with 25 claims. Lint, strict typecheck, build, compatibility, package-content,
  version, release-claim and formatting gates passed.

## Sanitized live evidence

| Surface    | UTC time                 | Signature fingerprint | Merchant balance change |
| ---------- | ------------------------ | --------------------- | ----------------------: |
| Express    | 2026-08-17T19:39:30.733Z | `5872424853784157`    |         `10000 → 20000` |
| Next Route | 2026-08-17T19:46:42.089Z | `f469ffa1045ddb3d`    |         `20000 → 30000` |
| Hono       | 2026-08-17T19:48:08.694Z | `3008fbe17591a223`    |         `30000 → 40000` |

Complete local evidence artifacts are stored with mode `0600` under the ignored
`artifacts/world-class-evidence/` directory. The temporary payer key on the
validation server was securely removed after the run.

## Intentionally pending

- Exact registry smoke cannot run until immutable 0.3.1 packages are published.
- macOS and Windows anchors run in CI, not on this Linux host.
- Five-person evidence requires real independent, consented participants and is
  tracked separately; it must never be synthesized from these checks.

Therefore this document does not claim the full release quickstart is complete
and does not authorize moving a recommended npm dist-tag. Publish/promotion must
remain blocked until the pending release cells pass.
